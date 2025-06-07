/**
 * Spin the Web web socket handler
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2025 Giancarlo Trevisan
**/
import { STWSite } from "./stwElements/stwSite.ts";
import { STWPage } from "./stwElements/stwPage.ts";
import { STWContent } from "./stwElements/stwContent.ts";
import { STWSession } from "./stwSession.ts";

export function handleWebSocket(request: Request, session: STWSession): Response {
    const { socket, response } = Deno.upgradeWebSocket(request);

    session.socket = socket;

    socket.onmessage = event => {
        // deno-lint-ignore no-explicit-any
        const data: { method: string, resource: any, options: any } = JSON.parse(event.data);

        if (data.method === "PATCH")
            data.resource = [data.resource];

        else if (data.method === "HEAD") {
            session.langs = data.options.langs || ["en"];
            session.lang = STWSite.instance.langs.includes(data.options.lang)
                ? data.options.lang
                : session.langs.find(lang => STWSite.instance.langs.includes(lang.substring(0, 2)))?.substring(0, 2) || "en";

            request = new Request(new URL(request.url).origin + data.resource); // URL
            data.resource = (STWSite.instance.find(session, data.resource) as STWPage)?.contents(session) || [];
        }

        let process = data.resource.length;
        data.resource?.forEach((resource: string, i: number) => {
            const element = STWSite.instance.find(session, resource);

            const elements: STWContent[] = [];
            if (element instanceof STWContent)
                elements.push(element);
            else {
                element?.children.filter(child => {
                    if (child instanceof STWContent) elements.push(child)
                });
                process = elements.length;
            }

            (new URL(request.url + resource)).searchParams.forEach((value, key) => session.placeholders.set(`@${key}`, value));

            elements.forEach(async content => {
                const response = await content?.serve(request, session, data.method === "PATCH" ? content : undefined);
                if (response.status == 200)
                    data.resource[i] = await response.json();
                else
                    data.resource[i] = { method: "DELETE", id: content._id };
                if (!--process)
                    send(data.options);
            });
        });

        function send(options: any): void {
            data.resource?.sort((a: any, b: any) => {
                if (a.section == b.section)
                    return Math.trunc(a.sequence) != Math.trunc(b.sequence) ? 0 : a.sequence < b.sequence ? -1 : 1;
                return 0;
            });
            data.resource?.forEach((content: any) => {
                content.placeholder = options.placeholder;
                socket.send(JSON.stringify(content))
            });
        }
    };
    socket.onerror = error => console.error(error);
    socket.onclose = () => {
        // Optionally clean up session here
    };
    return response;
}