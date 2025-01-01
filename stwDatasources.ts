/**
 * Spin the Web Datasources
 * 
 * STWDatasources manages Spin the Web connection to datasources in general.
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWContent } from "./stwElements/stwContent.ts";
import { ExecuteResult, Client as MySQLClient } from "https://deno.land/x/mysql/mod.ts";
import { Client as PostgresClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { MongoClient } from "npm:mongodb@6";

interface ISTWDatasource {
	type: "mysql" | "postgres" | "mongodb", // Datasource type
	hostname: string, // Server hostname
	port: number, // Server port
	username: string, // Username
	password: string, // Password
	db: string, // Database name
}
export class STWDatasources {
	static datasources: Map<string, MySQLClient | PostgresClient | MongoClient> = new Map();

	static async query(content: STWContent): Promise<ExecuteResult> {
		try {
			if (!STWDatasources.datasources.size) {
				for (const settings of JSON.parse(Deno.readTextFileSync("./public/.data/datasources.json"))) {
					switch (settings.type) {
						case "mysql":
							STWDatasources.datasources.set(settings.name, await new MySQLClient().connect(settings));
							break;
						case "postgress":
							STWDatasources.datasources.set(settings.name, await new PostgresClient());
							break;
						case "mongodb":
							break;
					}
				}
			}

			if (content.dsn && content.query) {
				const datasource = STWDatasources.datasources.get(content.dsn);
				if (datasource instanceof MySQLClient)
					return datasource.execute(content.query);
				if (datasource instanceof PostgresClient)
					return [];
				if (datasource instanceof MongoClient)
					return [];
			}
		} catch (error) {
			console.error(error);
		}
		return [];
	}
}
