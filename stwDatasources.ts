// Import the MySQL client from the deno_mysql module
import { Client as MySQLClient } from "https://deno.land/x/mysql/mod.ts";
import { Client as PostgresClient } from "https://deno.land/x/postgres/mod.ts";
import { MongoClient } from "npm:mongodb@6";

const _clients: { [key: string]: any } = {
	'mysql': MySQLClient,
	'postgress': PostgresClient,
	'mongodb': MongoClient,
}

// Create a new MySQL client
const client = new MySQLClient();

// Connect to the MySQL database
await client.connect({
	hostname: "37.187.176.70", // MySQL server hostname
	username: "ps_ext_user", // MySQL username
	password: "rN-m81&57cR", // MySQL password
	db: "rs3hmqg2_pres617", // Database name
});

const content = {
	datasource: client,
	parameters: new Map(),
	query: "SELECT * FROM psjx_cms_role",
	layout: new Map([["en", "fff"]]),
};

// Fetch records from the users table
const users = await client.query(content.query);

// Log the records to the console
console.log(users);

// Close the database connection
await client.close();