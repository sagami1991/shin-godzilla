/// <reference path="./custom-typings.d.ts" />
import 'core-js/es6/array';
import 'core-js/es6/promise';
import 'core-js/es7/array';
import 'core-js/es6/object';
require("expose?humane!humane-js");
require("!style!css!humane-js/themes/libnotify.css");
require("./scss/main.scss");
import {MainCanvas} from "./game/main";
import {ChatComponent} from "./chatComponent";
import {WSService} from "./WebSocketService";
import {RankingComponent} from "./RankingComponent";
import * as Handlebars from "handlebars";

class MainComponent {
	private canvas: MainCanvas;
	private chat: ChatComponent;
	private ranking: RankingComponent;
	constructor() {
		const wsService = new WSService();
		wsService.init();
		this.canvas = new MainCanvas(wsService);
		this.chat = new ChatComponent(wsService);
		this.ranking = new RankingComponent(wsService);
	}

	public init() {
		this.canvas.init();
		this.chat.init();
		this.ranking.init();
		Handlebars.registerHelper("addOne",  (index: number) => index + 1);
	}
}

new MainComponent().init();