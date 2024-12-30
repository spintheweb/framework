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

websocket.onopen = event => {
	websocket.send(JSON.stringify({ verb: "GET", pathname: "04aefc10-293b-11ee-92de-0fc9206ffad8" }));
};

websocket.onclose = event => { };

websocket.onmessage = event => {
	// verb: "GET" | "PUT" | "DELETE" | "POST", id: string, section: string, sequence: number, body: string
	const data = JSON.parse(event.data);

	if (data.verb === "PUT" || data.verb === "DELETE")
		document.getElementById(data.id).remove();

	let insertion = document.getElementById(data.section);
	insertion?.querySelectorAll("article[sequence]").forEach(article => {
		if (parseFloat(article.getAttribute("sequence")) < data.sequence)
			insertion = article;
	});
	insertion?.insertAdjacentHTML(insertion.id === data.section ? "afterBegin" : "afterEnd", data.body);
};

websocket.onerror = event => {
	console.log(`Error: ${event.data}`);
};
