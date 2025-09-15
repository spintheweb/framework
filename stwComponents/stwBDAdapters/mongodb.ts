import { MongoClient } from "npm:mongodb";
import { ISTWRecords } from "../stwDatasources.ts";

export class STWMongoAdapter {
  private client: MongoClient;
  private db: any;

  constructor(private config: {
    uri: string;
    database: string;
    collection: string;
  }) {
    this.client = new MongoClient(this.config.uri);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db(this.config.database);
  }

  async query(filter: string): Promise<ISTWRecords> {
    const parsed = JSON.parse(filter); // Expecting JSON query string
    const collection = this.db.collection(this.config.collection);
    const docs = await collection.find(parsed).toArray();
    const fields = docs.length > 0 ? Object.keys(docs[0]).map(k => ({ name: k, type: typeof docs[0][k] })) : [];
    return {
      affectedRows: docs.length,
      fields,
      rows: docs,
    };
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
