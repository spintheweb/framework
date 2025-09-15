import { Client } from "https://deno.land/x/mysql/mod.ts";
import { ISTWRecords } from "../stwDatasources.ts";

export class STWMySQLAdapter {
  private client: Client;

  constructor(private config: {
    hostname: string;
    port?: number;
    username: string;
    password: string;
    db: string;
  }) {
    this.client = new Client();
  }

  async connect(): Promise<void> {
    await this.client.connect({
      hostname: this.config.hostname,
      port: this.config.port ?? 3306,
      username: this.config.username,
      password: this.config.password,
      db: this.config.db,
    });
  }

  async query(sql: string): Promise<ISTWRecords> {
    const result = await this.client.execute(sql);
    const rows = result.rows ?? [];
    const fields = result.columns?.map((col) => ({ name: col, type: "string" })) ?? [];
    return {
      affectedRows: rows.length,
      fields,
      rows,
    };
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
