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

	static async query(session: STWSession, content: STWContent): Promise<ISTWRecords> {
		try {
			if (!STWDatasources.datasources.size) {
				STWDatasources.datasources.set("stw", session.site); // Webbase

				// TODO: Connection pools
				for (const settings of JSON.parse(Deno.readTextFileSync("./public/.data/datasources.json"))) {
					switch (settings.type) {
						case "api":
							STWDatasources.datasources.set(settings.name, settings);
							break;
						case "mysql":
							STWDatasources.datasources.set(settings.name, await new MySQLClient().connect({
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
				}
			}

			if (content.dsn && content.query) {
				const datasource = STWDatasources.datasources.get(content.dsn);
				if (content.dsn === "json") {
					const json = JSON.parse(content.query);
					return new Promise<ISTWRecords>(resolve => resolve({
						affectedRows: 1,
						fields: json && typeof json === "object" && !Array.isArray(json) ? Object.getOwnPropertyNames(json).map(name => ({ name })) : [],
						rows: Array.isArray(json) ? json : [json]
					}));}
				if (datasource?.type === "api")
					return await fetchAPIData(session, content, datasource);
				if (datasource instanceof STWSite)
					return await fetchWebbaseData(session, content);
				if (datasource instanceof MySQLClient)
					return await datasource.execute(wbpl(content.query, session.placeholders));
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error(error.message);
			} else {
				console.error(String(error));
			}
		}
		return new Promise<ExecuteResult>(resolve => resolve({ affectedRows: 0, fields: [], rows: [] }));
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
	const query = content.query ? wbpl(content.query, session.placeholders) : `$[?(@._id=="${session.placeholders.get("@_id")}")]`;
	const expr = jsonata(query);
	let result = expr.evaluate(STWSite.wbml);
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
