/**
 * Spin the Web Geomap content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWDatasources } from "../stwDatasources.ts";

export class STWGeomap extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override render(_req: Request, _session: STWSession): string {
		const _records = STWDatasources.query(this);

		return `<div id="Map${this._id}" style="height:250px"></div>
			<template data-stwCallback="stwLoadOpenLayersMap">
				<!--script src="https://cdnjs.cloudflare.com/ajax/libs/openlayers/10.3.1/index.js" integrity="sha512-+o0vxcUhkW07ZmZ3vD13Wgt0bzTXqmUIbqNSyCWfBiEv8Ziq9BExylSJTQVjEvT6YU2Ob6Bq1MUPDnwn7U6Mng==" crossorigin="anonymous" referrerpolicy="no-referrer"></script-->
				<script>
					function stwLoadOpenLayersMap() {
						alert("Map it!"); return;
						const map = new OpenLayers.Map("Map${this._id}");
						map.addLayer(new OpenLayers.Layer.OSM());
						map.zoomToMaxExtent();
					}
				</script>
			</template>`;
	}
}

STWFactory.Geomap = STWGeomap;