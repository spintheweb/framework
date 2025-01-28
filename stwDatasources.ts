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
import { STWSite } from "./stwElements/stwSite.ts";
import { STWContent } from "./stwElements/stwContent.ts";
import { rePlaceholders } from "./stwMiscellanea.ts";
import { JSONPath } from "https://cdn.jsdelivr.net/npm/jsonpath-plus@10.2.0/dist/index-browser-esm.min.js";
import { ExecuteResult, Client as MySQLClient } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

export type ISTWRecords = ExecuteResult;

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
				STWDatasources.datasources.set("stw", session.site); // Webbase

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
					return await fetchWebbaseData(session, content);
				if (datasource instanceof MySQLClient)
					return await datasource.execute(rePlaceholders(content.query, session.placeholders));
			}
		} catch (error) {
			console.error(error);
//			throw error;
		}
		return new Promise<ExecuteResult>(resolve => resolve({ rows: [] }));
	}
}

/**
 * This function queries the webbase using JSONPath
 * 
 * @param session The session
 * @param content The content being rendered
 * @returns The result set
 */
function fetchWebbaseData(session: STWSession, content: STWContent): Promise<ExecuteResult> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve({
				affectedRows: 1,
				rows: [STWSite.index.get(session.placeholders.get("@_id") || "")],
//				rows: [JSONPath({ path: rePlaceholders(content.query, session.placeholders), json: session.site, callback: localize })],
			});
		}, 1000); // Mock delay to simulate async behavior
	});

	/**
	 * Given the session language include all the element locale neutral properties and only the localized versions of those localized
	 * 
	 * @param value 
	 * @param type 
	 * @param payload 
	 */
	// deno-lint-ignore no-explicit-any
	function localize(_value: any, _type: any, _payload: any) {
		console.info(_value, _type);
	}
}
