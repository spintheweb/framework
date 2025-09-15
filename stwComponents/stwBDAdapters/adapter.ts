import { ISTWRecords } from "../stwDatasources.ts";

export interface STWAdapter {
  connect(): Promise<void>;
  query(command: string): Promise<ISTWRecords>;
  close(): Promise<void>;
}
