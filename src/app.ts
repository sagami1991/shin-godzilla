/// <reference path="./custom-typings.d.ts" />
require("expose?humane!humane-js");
require("!style!css!humane-js/themes/libnotify.css");
require("./scss/main.scss");
import {MainCanvas} from "./game/main";
import {ChatComponent} from "./chatComponent";
import {WSService} from "./WebSocketService";
import 'core-js/es6/array';
import 'core-js/es6/promise';
import 'core-js/es6/object';

class MainComponent {
	private canvas: MainCanvas;
	private chat: ChatComponent;
	constructor() {
		const wsService = new WSService();
		wsService.init();
		this.canvas = new MainCanvas(wsService);
		this.chat = new ChatComponent(wsService);

	}

	public init() {
		this.canvas.init();
		this.chat.init();
	}
}

new MainComponent().init();