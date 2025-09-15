import { mssqlLoadLibrary, mssqlConnect, mssqlQuery } from "npm:deno-mssql-query";
import { ISTWRecords } from "../stwDatasources.ts";

export class STWMSSQLAdapter {
  private connection: any;

  constructor(private config: {
    server: string;
    user: string;
    password: string;
    database: string;
  }) {}

  async connect(): Promise<void> {
    const lib = await mssqlLoadLibrary({ libPath: "./libmssql.so" });
    this.connection = await mssqlConnect(lib, {
      server: this.config.server,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
    });
  }

  async query(sql: string): Promise<ISTWRecords> {
    const result = await mssqlQuery(this.connection, sql);
    const rows = result.rows ?? [];
    const fields = result.columns?.map((col) => ({ name: col, type: "string" })) ?? [];
    return {
      affectedRows: rows.length,
      fields,
      rows,
    };
  }

  async close(): Promise<void> {
    // Graceful shutdown logic if needed
  }
}
