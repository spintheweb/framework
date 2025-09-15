// stwComponents/stwBDAdapters/oracle.ts
// Oracle adapter for Spin the Web (CLI-backed via SQLcl or SQL*Plus).
// Requires Oracle SQLcl (`sql`) in PATH. SQLcl supports `SET SQLFORMAT json`.
//
// Fallback: SQL*Plus may not support JSON formatting on older versions; prefer SQLcl.
//
// Usage example in datasource settings:
// {
//   "name": "oracleMain",
//   "type": "oracle",
//   "mode": "cli",
//   "username": "stw_user",
//   "password": "stw_pass",
//   "host": "db.example.com",
//   "port": 1521,
//   "service": "ORCLPDB1"
// }

import { ISTWRecords } from "../stwDatasources.ts";

export type OracleMode = "cli"; // reserved for future (e.g., "ords")

export interface OracleConfig {
  mode: OracleMode;
  username: string;
  password: string;
  host: string;
  port?: number;        // default 1521
  service: string;      // service name (EZCONNECT)
  sqlclCommand?: string; // default "sql"
  sqlplusCommand?: string; // optional fallback (limited JSON support)
  env?: Record<string, string>; // e.g., ORACLE_HOME, TNS_ADMIN if needed
}

export class STWOracleAdapter {
  private config: Required<
    Omit<OracleConfig, "env">
  > & { env?: Record<string, string> };

  constructor(cfg: OracleConfig) {
    this.config = {
      mode: cfg.mode ?? "cli",
      username: cfg.username,
      password: cfg.password,
      host: cfg.host,
      port: cfg.port ?? 1521,
      service: cfg.service,
      sqlclCommand: cfg.sqlclCommand ?? "sql",
      sqlplusCommand: cfg.sqlplusCommand ?? "sqlplus",
      env: cfg.env,
    };
  }

  async connect(): Promise<void> {
    // For CLI mode, we defer connectivity checks to first query.
    return;
  }

  async query(sqlText: string): Promise<ISTWRecords> {
    if (this.config.mode === "cli") {
      return await this.queryViaCLI(sqlText);
    }
    throw new Error(`Unsupported Oracle mode: ${this.config.mode}`);
  }

  async close(): Promise<void> {
    // No persistent connection to close for CLI mode
    return;
  }

  // ---- Internal helpers ----

  private buildEzConnect(): string {
    // EZCONNECT: user/password@host:port/service_name
    const { username, password, host, port, service } = this.config;
    return `${username}/${password}@${host}:${port}/${service}`;
  }

  private async queryViaCLI(sqlText: string): Promise<ISTWRecords> {
    // Prefer SQLcl (`sql`). It supports SET SQLFORMAT json for structured output.
    // We construct a script that sets JSON output, runs the query, then exits.
    const script = [
      "SET FEEDBACK OFF",
      "SET HEADING ON",
      "SET VERIFY OFF",
      "SET PAGESIZE 0",
      "SET SQLFORMAT json",
      sqlText.replace(/;\s*$/, "") + ";",
      "EXIT",
      "",
    ].join("\n");

    const conn = this.buildEzConnect();
    const cmd = new Deno.Command(this.config.sqlclCommand, {
      args: [conn],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
      env: this.config.env,
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(script));
    await writer.close();

    const { code, stdout, stderr } = await child.output();
    const out = new TextDecoder().decode(stdout);
    const err = new TextDecoder().decode(stderr);

    if (code !== 0) {
      throw new Error(`Oracle CLI failed (code ${code}): ${err || out}`);
    }

    // SQLcl JSON structure: typically an object with "items" for SELECT.
    // We attempt to parse and normalize; fall back to heuristics if needed.
    let parsed: unknown;
    try {
      parsed = JSON.parse(out.trim());
    } catch {
      // Some environments echo banners; try to extract the last JSON block.
      const jsonMatch = out.match(/\{[\s\S]*\}$/m);
      if (!jsonMatch) {
        throw new Error("Failed to parse SQLcl JSON output.");
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Normalize to ISTWRecords
    // Expected shapes can vary; we attempt common SQLcl JSON patterns.
    const rows = this.extractRows(parsed);
    const fields = rows.length > 0
      ? Object.keys(rows[0]).map((k) => ({ name: k, type: typeof (rows[0] as Record<string, unknown>)[k] }))
      : [];

    return {
      affectedRows: rows.length,
      fields,
      rows,
    };
  }

  private extractRows(parsed: unknown): Array<Record<string, unknown>> {
    // Common SQLcl JSON for SELECT returns:
    // { "items": [ { "COL1": "...", "COL2": ... }, ... ] }
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.items)) {
        return obj.items as Array<Record<string, unknown>>;
      }
      // Some formats nest under "result" or include "rows"
      if (obj.result && typeof obj.result === "object") {
        const r = obj.result as Record<string, unknown>;
        if (Array.isArray(r.rows)) return r.rows as Array<Record<string, unknown>>;
      }
      // If the parsed object itself looks like a row or array of rows
      if (Array.isArray(parsed)) {
        return parsed as Array<Record<string, unknown>>;
      }
    }
    return [];
  }
}
