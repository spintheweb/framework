import * as STWElements from "./stwElements.ts";
import * as STWContents from "./stwContents.ts";

export const STWFactory: Map<string, new (data: STWElements.ISTWElement) => STWElements.STWElement> = new Map();

STWFactory.set("Area", STWElements.STWArea);
STWFactory.set("Page", STWElements.STWPage);
STWFactory.set("ContentText", STWContents.STWText);
STWFactory.set("ContentList", STWContents.STWList);
STWFactory.set("ContentTable", STWContents.STWTable);
