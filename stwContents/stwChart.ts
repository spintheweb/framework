/**
 * Spin the Web Chart content
 * 
 * This content uses Chart.js for plotting data https://www.chartjs.org/
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWChart extends STWContent {
	// TODO: scripts should be loaded in the template, e.g. index.html
	static scripts: string = `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;

	public constructor(content: ISTWContent) {
		super(content);
	}

	// deno-lint-ignore require-await
	public override async render(_req: Request, _session: STWSession, _records: ISTWRecords): Promise<string> {
		return `<canvas id="Chart${this._id}"></canvas>
			<script name="STWChart" onload="fnSTWChart('Chart${this._id}')">
				function fnSTWChart(id) {
					const ctx = self.document.getElementById(id);
					new Chart(ctx, {
						type: 'bar',
						data: {
							labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
							datasets: [{
								label: '# of Votes',
								data: [12, 19, 3, 5, 2, 3],
								borderWidth: 1
							}]
						},
						options: {
							scales: { y: { beginAtZero: true } }
						}
					});
				}
			</script>`;
	}
}

STWFactory.Chart = STWChart;
