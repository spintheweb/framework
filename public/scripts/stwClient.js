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
	const ws = new WebSocket(self.location.host);

	ws.onopen = _event => {
		ws.send(JSON.stringify({
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

	ws.onmessage = event => {
		// event.data = { method: "GET" | "PUT" | "PATCH" | "DELETE", id: string, section: string, sequence: number, body: string }
		const data = JSON.parse(event.data);

		if (data.method === "PATCH") {
			ws.send(JSON.stringify({ method: "PATCH", resource: data.id, options: { placeholder: data.placeholder } }));
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

			if (data.section === "stwDialog" || data.section === "stwDialogModal") {
				self.document.body.insertAdjacentHTML("afterbegin", `<dialog onclose="this.remove()">${data.body}</dialog>`);
				if (data.section === "stwDialogModal") {
					self.document.querySelector("dialog")?.remove();
					self.document.querySelector("dialog")?.showModal();
				} else
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


		// Load content script
		const script = self.document.getElementById(data.id)?.querySelector("script[onload]");
		if (script) {
			const callback = script.onload, element = self.document.createElement("script");
			element.insertAdjacentText("afterbegin", script.innerText);
			self.document.head.append(element);
			script.remove();

			if (callback)
				callback();
		}
	};

	ws.onerror = err => {
		console.error(err);
		ws = null;
		setTimeout(startWebsocket, 5000);
	}
}
