/// <reference path="./custom-typings.d.ts" />
require("expose?humane!humane-js");
require("!style!css!humane-js/themes/libnotify.css");
require("./main.scss");
import {MapleCanvas} from "./canvas";
import {ChatComponent} from "./chatComponent";
import {WSService} from "./WebSocketService";
import 'core-js/es6/array';
import 'core-js/es6/promise';


class MainComponent {
	private canvas: MapleCanvas;
	private chat: ChatComponent;
	constructor() {
		const wsService = new WSService();
		wsService.init();
		this.canvas = new MapleCanvas(wsService);
		this.chat = new ChatComponent(wsService);

	}

	public init() {
		this.canvas.init();
		this.chat.init();
	}
}

new MainComponent().init();