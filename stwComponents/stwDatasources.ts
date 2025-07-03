/**
 * Spin the Web Datasources
 * 
 * STWDatasources manages Spin the Web connection to datasources in general.
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSession } from "./stwSession.ts";
import { STWSite } from "../stwElements/stwSite.ts";
import { STWContent } from "../stwElements/stwContent.ts";
import { wbpl } from "./wbpl.ts";
import { ExecuteResult, Client as MySQLClient } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
import jsonata from "https://esm.sh/jsonata";

// Global cache for query results
const queryCache = new Map<string, { data: ISTWRecords, timestamp: number }>();

export type ISTWRecords = ExecuteResult;

interface ISTWDatasource {
    type: "stw" | "json" | "api" | "mysql" | "postgres" | "mongodb", // Datasource type
    host: string, // Server hostname
    port: number, // Server port
    user: string, // Username
    password: string, // Password
    database: string, // Database name
    contentType: string // Content type (e.g., application/json)
}
export class STWDatasources {
    static datasources: Map<string, STWSite | MySQLClient | ISTWDatasource> = new Map();
    static #initializationPromise: Promise<void> | null = null;

    private static initialize(session: STWSession): Promise<void> {
        if (!this.#initializationPromise) {
            this.#initializationPromise = (async () => {
                this.datasources.set("stw", session.site); // Webbase

                // TODO: Connection pools
                for (const settings of JSON.parse(Deno.readTextFileSync("./public/.data/datasources.json"))) {
                    try {
                        switch (settings.type) {
                            case "api":
                                this.datasources.set(settings.name, settings);
                                break;
                            case "mysql":
                                this.datasources.set(settings.name, await new MySQLClient().connect({
                                    hostname: settings.host,
                                    username: settings.user,
                                    password: settings.password,
                                    db: settings.database,
                                }));
                                break;
                            case "postgress":
                                break;
                            case "mongodb":
                                break;
                        }
                    } catch (error) {
                        console.error(`Error processing datasource configuration: ${error.message}`);
                        continue;
                    }
                }
            })();
        }
        return this.#initializationPromise;
    }

    static async query(session: STWSession, content: STWContent): Promise<ISTWRecords> {
        if (!content.dsn)
            return { fields: [], rows: [] };

        // Generate a unique key for this query based on content ID and resolved parameters
        const cacheKey = `${content._id}:${wbpl(content.params, session.placeholders)}`;

        // 1. Check cache if caching is enabled for this content
        if (content.cache && queryCache.has(cacheKey)) {
            const cached = queryCache.get(cacheKey)!;
            const isCacheValid = content.cache === -1 || (Date.now() - cached.timestamp < content.cache * 1000);

            if (isCacheValid) {
                return cached.data; // Return cached data
            }
        }

        // 2. If not in cache or cache is stale, perform the query using the original logic
        let records: ISTWRecords;
        try {
            await this.initialize(session);

            const datasource = STWDatasources.datasources.get(content.dsn);
            if (content.dsn === "json") {
                const json = JSON.parse(content.query);
                records = {
                    affectedRows: 1,
                    fields: json && typeof json === "object" && !Array.isArray(json) ? Object.getOwnPropertyNames(json).map(name => ({ name, type: 'string' })) : [],
                    rows: Array.isArray(json) ? json : [json]
                };
            } else if (datasource?.type === "api") {
                records = await fetchAPIData(session, content, datasource);
            } else if (datasource instanceof STWSite) {
                records = await fetchWebbaseData(session, content);
            } else if (datasource instanceof MySQLClient && datasource.pool && datasource.pool.size) {
                records = await datasource.execute(wbpl(content.query, session.placeholders));
            } else {
                records = { affectedRows: 0, fields: [], rows: [] };
            }
        } catch (error) {
            throw error; // Propagate the error
        }

        // 3. Store the new results in the cache if caching is enabled
        if (content.cache) {
            queryCache.set(cacheKey, { data: records, timestamp: Date.now() });
        }

        return records;
    }
}

/**
 * This function queries the webbase using JSONata expressions.
 * 
 * @param session The session
 * @param content The content being rendered
 * @returns The result set
 */
async function fetchWebbaseData(session: STWSession, content: STWContent): Promise<ISTWRecords> {
    let result: any;
    if (content.query) {
        const expr = jsonata(wbpl(content.query, session.placeholders));
        result = expr.evaluate(STWSite.wbml);
    } else
        result = STWSite.instance.find(session, session.placeholders.get("@_id") || "/");

    if (result instanceof Promise)
        result = await result;

    return new Promise<ISTWRecords>(resolve => resolve({
        affectedRows: 1,
        fields: result && typeof result === "object" && !Array.isArray(result) ? Object.getOwnPropertyNames(result).map(name => ({ name })) : [],
        rows: Array.isArray(result) ? result : [result]
    }));
}

/**
 * This function queries an API datasource using JSONata expressions.
 * 
 * @param session The session
 * @param content The content being rendered
 * @param datasource The datasource configuration
 * @returns The result set
 */
async function fetchAPIData(session: STWSession, content: STWContent, datasource: any): Promise<ISTWRecords> {
    const query = wbpl(content.query, session.placeholders)
    const expr = jsonata(query);

    const response = await fetch(`${datasource.host}?${wbpl(content.params, session.placeholders)}`,
        { headers: { "Content-Type": datasource.contentType || "application/json" } });
    let json = await response.json();

    json = expr.evaluate(json);
    if (json instanceof Promise)
        json = await json;

    return new Promise<ISTWRecords>(resolve => resolve({
        affectedRows: 1,
        fields: json && typeof json === "object" && !Array.isArray(json) ? Object.getOwnPropertyNames(json).map(name => ({ name })) : [],
        rows: Array.isArray(json) ? json : [json]
    }));
}
