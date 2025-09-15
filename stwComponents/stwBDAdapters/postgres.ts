import { Client as PostgresClient } from "jsr:@db/postgres";
import { ISTWRecords } from "./stwDatasources.ts";

export class STWPostgresAdapter {
  private client: PostgresClient;

  constructor(private config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    this.client = new PostgresClient({
      hostname: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async query(sql: string): Promise<ISTWRecords> {
    const result = await this.client.queryObject(sql);
    const fields = result.columns.map(col => ({ name: col.name, type: col.columnType }));
    const rows = result.rows;
    return {
      affectedRows: rows.length,
      fields,
      rows: Array.isArray(rows) ? rows : [rows],
    };
  }

  async close(): Promise<void> {
    await this.client.end();
  }
}
