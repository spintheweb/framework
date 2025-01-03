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
self.addEventListener("load", startWebsocket);
	
function startWebsocket() {
	let ws = new WebSocket(self.location.host);

	ws.onopen = _event => {
		ws.send(JSON.stringify({
			method: "HEAD",
			resource: self.document.location.pathname,
			options: {
				lang: navigator.language,
				langs: navigator.languages,
			}
		}));
	};

	ws.onmessage = event => {
		// event.data = { method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD", id: string, section: string, sequence: number, body: string }
		const data = JSON.parse(event.data);

		if (data.method === "PUT" || data.method === "DELETE")
			self.document.getElementById(data.id)?.remove();

		if (data.section === "dialog") {
			self.document.querySelector("dialog")?.remove();
			self.document.body.insertAdjacentHTML("afterbegin", `<dialog>${data.body}</dialog>`);
			self.document.querySelector("dialog")?.showModal();

		} else {
			let insertion = self.document.getElementById(data.section);
			insertion?.querySelectorAll("article[data-sequence]").forEach(article => {
				if (parseFloat(article.getAttribute("data-sequence")) < data.sequence)
					insertion = article;
			});
			insertion?.insertAdjacentHTML(insertion.id === data.section ? "afterbegin" : "afterend", data.body);
		}
	};

	ws.onerror = err => {
		console.error(err);
		ws = null;
		setTimeout(startWebsocket, 5000);
	}
}
