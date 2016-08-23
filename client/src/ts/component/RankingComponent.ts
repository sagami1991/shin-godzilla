import {WSClient} from "../WebSocketClient";
import * as Handlebars from "handlebars";
import {SocketType, RankingInfo} from "../../../../server/share/share";
require("./scss/ranking.scss");

export class RankingComponent {
	private static HTML = `
		<h2 class="h2"><i class="material-icons">school</i>ランキング</h2>
		<table class="table rank-table">
			<thead>
				<tr>
					<th class="rank-th">Rank</th>
					<th>Name</th>
					<th>Lv</th>
				</tr>
			</thead>
			<tbody class="rank-tbody">

			</tbody>
		</table>
	`;

	private static RANK_TEMPL = Handlebars.compile(`
		{{#rankInfos}}
			<tr>
				<td><span class="bold">{{addOne @index}}</span> 位</td>
				<td><div class="rank-name">
					{{#unless @index}}<i class="material-icons">stars</i>{{/unless}}
					{{name}}
				</div></td>
				<td>Lv. <span class="bold">{{lv}}</span></td>
			</tr>
		{{/rankInfos}}
	`);
	constructor(private wsService: WSClient) {}

	public init() {
		document.querySelector(".ranking-area").innerHTML = RankingComponent.HTML;
		document.querySelector(".rank-button").addEventListener("click", () => {
			this.wsService.sendPromise<RankingInfo[]>(SocketType.ranking).then(ranks => this.parseRanking(ranks));
			document.querySelector(".ranking-area").classList.toggle("disabled");
		});
	}

	private parseRanking(ranks: RankingInfo[]) {
		document.querySelector(".rank-tbody").innerHTML = RankingComponent.RANK_TEMPL({rankInfos: ranks});
	}

}