/**
 * Spin the Web Manager
 * 
 * STWManager is a webbaselet, incorporated in the main site webbase,
 * that is accessible to developers, i.e., users with Developers role.
 * It allows for main web webbase management.
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWElement } from "./stwElements/stwElement.ts";
import { STWSite } from "./stwElements/stwSite.ts";
import { STWSession } from "./stwSession.ts";

export interface STWData {
    affectedRows?: number;
    lastInsertId?: number;
    fields: ISTWFieldInfo[];
    rows: any[];
    iterator?: any;
}

export interface ISTWFieldInfo {
    catalog?: string;
    schema?: string;
    table?: string;
    originTable?: string;
    name: string;
    originName?: string;
    encoding?: number;
    fieldLen?: number;
    fieldType: "number" | "string" | "date" | "datetime";
    fieldFlag?: number;
    decimals?: number;
    defaultVal?: string;
}

export class STWManager {
    constructor() { }

    element(_id: string): STWElement | undefined {
        return STWSite.index.get(_id);
    }

    /**
     * Return an array of element in the 
     * 
     * @param session 
     * @param search 
     * @returns 
     */
    elements(session: STWSession, search: string): STWData {
        const elements: STWData = {
            fields: [
                { name: "_id", fieldType: "number" },
                { name: "type", fieldType: "string" },
                { name: "name", fieldType: "string" },
            ],
            rows: []
        };
        iterate(STWSite.get());
        return elements;

        function iterate(element: STWElement): void {
            if (!search || element.localize(session, "name").indexOf(search) !== -1)
                elements.rows.push({ _id: element._id, type: element.type, name: element.localize(session, "name") });
            for (const child of element.children)
                iterate(child);
        }
    }
}
