/**
 * Spin the Web Geomap content
 * 
 * This content used OpenLayers to render maps
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWDatasources } from "../stwDatasources.ts";

export class STWGeomap extends STWContent {
	// TODO: scripts should be loaded in the template, e.g. index.html
	static scripts: string = `<script src="https://www.openlayers.org/api/OpenLayers.js"></script>`;

	constructor(content: ISTWContent) {
		super(content);
	}
	override render(_req: Request, _session: STWSession): string {
		const _records = STWDatasources.query(this);

		return `<div id="Map${this._id}"></div>
			<script onload="stwLoadOpenLayersMap('Map${this._id}')">
				function stwLoadOpenLayersMap(id) {
					if (typeof OpenLayers !== "undefined") {
						map = new OpenLayers.Map(id);
						map.addLayer(new OpenLayers.Layer.OSM());
						map.zoomToMaxExtent();
					} else
					 	self.document.getElementById(id).innerHTML = 'OpenLayers not loaded, see <a target="_blank" href="https://openlayers.org/">https://openlayers.org/</a>';
				}
			</script>`;
	}
}

STWFactory.Geomap = STWGeomap;