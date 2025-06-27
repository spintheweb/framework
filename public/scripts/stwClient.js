/**
 * Spin the Web client 
 * 
 * This file runs in web browser and is responsible for real time communication 
 * with the web spinner through web sockets.
 * 
 * Language: Javascript
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
 **/
// deno-lint-ignore-file
self.addEventListener("load", stwStartWebsocket);

let stwWS;
function stwStartWebsocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/`;

    stwWS = new WebSocket(wsUrl);

    stwWS.onopen = _event => {
        stwWS.send(JSON.stringify({
            method: "HEAD",
            resource: self.document.location.pathname,
            options: {
                lang: navigator.language,
                langs: navigator.languages,
            }
        }));

        // TODO: Update lang to reflect the session language, should each <article> have a lang attribute that reflects its language?
        self.document.querySelectorAll("[lang]").forEach(element => element.setAttribute("lang", "en-US"));
    };

    stwWS.onmessage = event => {
        // event.data = { method: "GET" | "PUT" | "PATCH" | "DELETE", id: string, section: string, sequence: number, body: string }
        const data = JSON.parse(event.data);

        if (data.method === "PATCH") {
            stwWS.send(JSON.stringify({ method: "PATCH", resource: data.id, options: { placeholder: data.placeholder } }));
            return;
        }

        if (data.placeholder) {
            const placeholder = self.document.getElementById(data.placeholder);
            placeholder?.insertAdjacentHTML("afterend", data.body);
            placeholder?.remove();

        } else {
            if (data.method === "PUT" || data.method === "DELETE") {
                self.document.getElementById(data.id)?.remove();
                if (data.method === "DELETE")
                    return;
            }

            if (data.section === "stwDialog" || data.section === "dialog") {
                // self.document.querySelector("dialog")?.remove();
                self.document.body.insertAdjacentHTML("afterbegin", `<dialog onclose="this.remove()">${data.body}</dialog>`);
                if (data.section === "dialog")
                    self.document.querySelector("dialog")?.showModal();
                else
                    self.document.querySelector("dialog")?.show();

            } else if (data.section === "stwConsole") {
                const stwConsole = self.document.getElementById("stwConsole");
                if (stwConsole)
                    stwConsole.insertAdjacentHTML("beforeend", `<li onclick="this.remove()">${data.body}&#128473;</li>`);
                else
                    self.document.body.insertAdjacentHTML("beforeend", `<ul id="stwConsole"><li onclick="this.remove()">${data.body}&#128473;</li></ul>`);

            } else {
                let insertion = self.document.getElementById(data.section);
                insertion?.querySelectorAll("article[data-sequence]").forEach(article => {
                    if (parseFloat(article.getAttribute("data-sequence")) < data.sequence)
                        insertion = article;
                });
                insertion?.insertAdjacentHTML(insertion.id === data.section ? "afterbegin" : "afterend", data.body);
            }
        }

        // Load articles
        document.querySelectorAll("article[href]").forEach(article => {
            stwWS.send(JSON.stringify({ method: "PATCH", resource: article.getAttribute("href"), options: { placeholder: article.id } }));
            article.removeAttribute("href");
        });

        // Load content script
        const script = self.document.getElementById(data.id)?.querySelector("script[onload]");
        if (script) {
            if (typeof window[`fn${script.getAttribute("name")}`] !== "function") {
                const element = self.document.createElement("script");
                element.insertAdjacentText("afterbegin", script.innerText);
                self.document.head.append(element);
            }
            script.onload();
            script.remove();
        }
    };

    stwWS.onerror = err => {
        console.error(err);
        stwWS = null;
        setTimeout(stwStartWebsocket, 5000);
    };
}
function stwToggleCollapse(event) {
    event.preventDefault();
    const el = event.currentTarget;
    el.querySelector("i.fa-light").classList.toggle("fa-angle-down");
    if (el.querySelector("i.fa-light").classList.toggle("fa-angle-right"))
        el.nextElementSibling.classList.add("stwHide");
    else
        el.nextElementSibling.classList.remove("stwHide");
}

// Toggle studio mode with Alt+F12
window.addEventListener("keydown", event => {
    if (event.altKey && event.key == "F12") {
        event.preventDefault();
        if (document.getElementById("stwStudio")) {
            const stash = document.getElementById("stwSite");
            while (stash.firstChild)
                document.body.appendChild(stash.firstChild);
            document.getElementById("stwStudio").remove();
        } else {
            const stash = document.createElement("div");
            while (document.body.firstChild)
                stash.appendChild(document.body.firstChild);
            document.body.insertAdjacentHTML("afterbegin", `<div id="stwStudio"><header id="stwMenubar"></header><div><aside id="stwSidebar"></aside><div class="stwSplitter"></div><div id="stwSite"></div></div><footer id="stwStatusbar"></footer></div>`)
            while (stash.firstChild)
                document.getElementById("stwSite").appendChild(stash.firstChild);
            stwWS.send(JSON.stringify({ method: "PATCH", resource: "/stws/interface", options: { recurse: false } }));
        }
    }
});

// Handle resizing of the sidebar in studio mode
document.addEventListener("mousedown", function (event) {
    const splitter = event.target.closest(".stwSplitter");
    if (!splitter) return;
    const container = splitter.parentElement;
    const aside = container.querySelector("aside");
    const startX = event.clientX;
    const startWidth = aside.offsetWidth;

    function onMouseMove(e2) {
        const dx = e2.clientX - startX;
        let newWidth = startWidth + dx;
        newWidth = Math.max(100, Math.min(window.innerWidth * 0.5, newWidth));
        container.style.gridTemplateColumns = `${newWidth}px 5px 1fr`;
    }

    function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
});

// Open content properties when studio mode is enabled with Alt+click
window.addEventListener("click", function (e) {
    const article = e.target.closest("article[id]");
    if (document.getElementById("stwStudio") && article && e.altKey) {
        e.preventDefault();
        stwWS.send(JSON.stringify({ method: 'PATCH', resource: `/stws/editcontent?_id=${article.id}`, options: { placeholder: '' } }));
    }
});

// Handle navigation inside the webbase
// This allows the user to navigate inside the webbase without reloading the page
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", function (event) {
        const target = event.target.closest("a[href]");

        const href = target?.getAttribute("href").replace(window.location.origin, "");
        if (href?.startsWith("/")) {
            event.preventDefault();
            //			history.pushState({}, "", target.getAttribute("href"));
            stwWS.send(JSON.stringify({ method: "PATCH", resource: href, options: {} }));
        }
    });
});

// Optional: handle browser back/forward navigation
window.addEventListener("popstate", function () {
    stwWS.send(JSON.stringify({ method: "PATCH", resource: location.pathname, options: {} }));
});

