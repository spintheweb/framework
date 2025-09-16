/**
 * Spin the Web Adapter Interface
 * 
 * Language: TypeScript for Deno
 */

export interface ISTWRecords {
	fields: { name: string; type?: string }[];
	rows: Record<string, any>[];
	affectedRows?: number;
	stwOrigin?: string;
	stwAction?: string;
}

export interface ISTWAdapter {
  connect(): Promise<void>;
  close(): Promise<void>;

  execute(batch: string): Promise<ISTWRecords[]>;
  listObjects(): Promise<ISTWRecords>;
  getObjectDetails(objectName: string, objectType: string): Promise<ISTWRecords>;
}