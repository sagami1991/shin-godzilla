import 'core-js/es6/array';
import 'core-js/es6/promise';
import 'core-js/es6/object';
import 'core-js/es7/array';
require("expose?humane!humane-js");
require("!style!css!humane-js/themes/libnotify.css");
require("./scss/main.scss");
import {GameMain} from "./game/main";
import {ChatComponent} from "./component/ChatComponent";
import {WSClient} from "./WebSocketClient";
import {RankingComponent} from "./component/RankingComponent";
import * as Handlebars from "handlebars";

class MainComponent {
	private canvas: GameMain;
	private chat: ChatComponent;
	private ranking: RankingComponent;
	constructor() {
		const wsClient = new WSClient();
		wsClient.init();
		this.canvas = new GameMain(wsClient);
		this.chat = new ChatComponent(wsClient);
		this.ranking = new RankingComponent(wsClient);
	}

	public init() {
		this.canvas.init();
		this.chat.init();
		this.ranking.init();
		Handlebars.registerHelper("addOne",  (index: number) => index + 1);
	}
}

new MainComponent().init();