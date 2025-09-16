import { assertEquals } from "@std/assert";
import { STWMySQLAdapter } from "../stwComponents/stwDBAdapters/mysql.ts";
// ...import other adapters as needed

Deno.test("STWMySQLAdapter: connect/close", async () => {
  const adapter = new STWMySQLAdapter({
    hostname: "localhost",
    username: "testuser",
    password: "testpass",
    db: "testdb"
  });
  await adapter.connect();
  // Just test that connect doesn't throw
  await adapter.close();
});

Deno.test("STWMySQLAdapter: executeBatch simple select", async () => {
  const adapter = new STWMySQLAdapter({
    hostname: "localhost",
    username: "testuser",
    password: "testpass",
    db: "testdb"
  });
  await adapter.connect();
  const results = await adapter.execute("SELECT 1 AS val;");
  assertEquals(results.length, 1);
  assertEquals(results[0].rows[0].val, 1);
  await adapter.close();
});

// Add similar tests for other adapters
