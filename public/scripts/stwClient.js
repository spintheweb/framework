/**
 * Spin the Web client 
 * 
 * This file runs on web browser and is responsible for real time communication 
 * with the web spinner through web sockets.
 * 
 * Language: Javascript
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
 **/
// deno-lint-ignore-file
const websocket = new WebSocket(`ws://${window.location.host}/`);

websocket.onopen = async _event => {
	const response = await fetch(document.location.href, { method: "HEAD" });
	const headers = Object.fromEntries(response.headers.entries());
	websocket.send(JSON.stringify({ verb: "PUT", resource: headers.contents?.split(",") }));
};

websocket.onclose = _event => { };

websocket.onmessage = event => {
	// verb: "GET" | "PUT" | "DELETE" | "POST", id: string, section: string, sequence: number, body: string
	const data = JSON.parse(event.data);

	if (data.verb === "PUT" || data.verb === "DELETE")
		document.getElementById(data.id)?.remove();

	if (data.section === "dialog") {
		document.querySelector("dialog")?.remove();
		document.body.insertAdjacentHTML("beforeend", `<dialog>${data.body}</dialog>`);
		document.querySelector("dialog")?.showModal();

	} else {
		let insertion = document.getElementById(data.section);
		insertion?.querySelectorAll("article[data-sequence]").forEach(article => {
			if (parseFloat(article.getAttribute("data-sequence")) < data.sequence)
				insertion = article;
		});
		insertion?.insertAdjacentHTML(insertion.id === data.section ? "afterbegin" : "afterend", data.body);
	}
};

websocket.onerror = event => {
	console.error(event.data);
};
