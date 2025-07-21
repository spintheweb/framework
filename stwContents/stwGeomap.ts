/**
 * Spin the Web Geomap content
 * 
 * This content used OpenLayers to render maps
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWGeomap extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	// deno-lint-ignore require-await
	public override async render(_req: Request, _session: STWSession, _records: ISTWRecords): Promise<string> {
		return `<div id="Map${this._id}"></div>
			<script name="OpenLayers" src="https://www.openlayers.org/api/OpenLayers.js"></script>
			<script name="STWGeomap" onload="fnSTWGeomap('Map${this._id}')">
				function fnSTWGeomap(id) {
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