/**
 * Spin the Web Datasources
 * 
 * STWDatasources manages Spin the Web connection to datasources in general.
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSite } from "./stwElements/stwSite.ts";
import { STWContent } from "./stwElements/stwContent.ts";
import { processPlaceholders } from "./stwMiscellanea.ts";
import { ExecuteResult, Client as MySQLClient } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
import { JSONPath } from "https://cdn.skypack.dev/jsonpath-plus";
import { STWSession } from "./stwSession.ts";

interface ISTWDatasource {
	type: "stw" | "mysql" | "postgres" | "mongodb", // Datasource type
	host: string, // Server hostname
	port: number, // Server port
	user: string, // Username
	password: string, // Password
	database: string, // Database name
}
export class STWDatasources {
	static datasources: Map<string, STWSite | MySQLClient> = new Map();

	static async query(session: STWSession, content: STWContent): Promise<ExecuteResult> {
		try {
			if (!STWDatasources.datasources.size) {
				STWDatasources.datasources.set("stw", STWSite.get()); // Webbase

				// TODO: Connection pools
				for (const settings of JSON.parse(Deno.readTextFileSync("./public/.data/datasources.json"))) {
					switch (settings.type) {
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
				if (datasource instanceof STWSite)
					return {
						rows: [JSONPath({ path: processPlaceholders(content.query, session.placeholders), json: datasource })],
					}
				if (datasource instanceof MySQLClient)
					return await datasource.execute(processPlaceholders(content.query, session.placeholders));
			}
		} catch (error) {
			throw error;
		}
		return await new Promise<ExecuteResult>(resolve => resolve({ rows: [] }));
	}
}
