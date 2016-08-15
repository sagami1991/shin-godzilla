import {WSService, WSDataType} from "./WebSocketService";
import * as Handlebars from "handlebars";

interface ChatLog {
	personId: string;
	msg: string;
	date: string;
}
export class ChatComponent {
	private static IS_TABLET = (u => {
		return (u.indexOf("windows") !== -1 && u.indexOf("touch") !== -1 && u.indexOf("tablet pc") == -1)
			|| u.indexOf("ipad") !== -1
			|| (u.indexOf("android") !== -1 && u.indexOf("mobile") === -1)
			|| (u.indexOf("firefox") !== -1 && u.indexOf("tablet") !== -1)
			|| u.indexOf("kindle") !== -1
			|| u.indexOf("silk") !== -1
			|| u.indexOf("playbook") !== -1
			|| (u.indexOf("windows") !== -1 && u.indexOf("phone") !== -1)
			|| u.indexOf("iphone") !== -1
			|| u.indexOf("ipod") !== -1
			|| (u.indexOf("android") !== -1 && u.indexOf("mobile") !== -1)
			|| (u.indexOf("firefox") !== -1 && u.indexOf("mobile") !== -1)
			|| u.indexOf("blackberry") !== -1;
	})(window.navigator.userAgent.toLowerCase());

	private static MAX_LINE = 7;
	private wsService: WSService;
	private logs: ChatLog[] = [];
	private logElem: HTMLElement;
	private inputElem: HTMLTextAreaElement;
	private sendElem: HTMLElement;
	private isSended: boolean;
	private static logsTmpl = Handlebars.compile(`
		{{#logs}}
			<li class="chat-log">{{msg}}</li>
		{{/logs}}
	`);
	constructor(wsService: WSService) {
		this.wsService = wsService;
	}

	public init() {
		this.logElem = <HTMLElement> document.querySelector(".chat-logs");
		this.inputElem = <HTMLTextAreaElement> document.querySelector("#chat");
		this.sendElem = <HTMLElement> document.querySelector(".chat-send");
		document.addEventListener("keydown", (e) => {
			if (e.keyCode === 13) {
				this.inputElem.focus();
			}
		});
		this.wsService.addOnReceiveMsgListener((type, value) => this.onReceiveInitLog(type, value));
		this.wsService.addOnReceiveMsgListener((type, value) => {
			if (type !== WSDataType.log) return;
			const log = <ChatLog>value;
			this.logs.push(log);
			if (this.logs.length > ChatComponent.MAX_LINE) this.logs.shift();
			// if (!ChatComponent.IS_TABLET && log.personId !== this.wsService.personId) {
			// 	Notification.requestPermission();
			// 	new Notification("", {body: log.msg});
			// }

			this.logElem.innerHTML =  ChatComponent.logsTmpl({logs: this.logs});
		});

		this.wsService.addOnOpenListener(() => this.onOpen());
		this.wsService.addOnCloseListener(() => this.onClose());
	}

	private onReceiveInitLog(type: number, value: any) {
		if (type !== WSDataType.initlog) return;
		this.logs = <ChatLog[]> value;
		this.logElem.innerHTML =  ChatComponent.logsTmpl({logs: this.logs});
	}

	private onOpen() {
		this.inputElem.addEventListener("keypress", (e) => {
			if (e.keyCode === 13 && !e.shiftKey) {
				this.send();
				e.preventDefault();
				e.stopPropagation();
			}
		});

		this.sendElem.addEventListener("click", e => {
			this.send();
		});
	}

	private onClose() {
		this.inputElem.disabled = true;
		this.inputElem.value = "切断されました。";
	}

	private send() {
		const value = this.inputElem.value;
		if (value && !this.wsService.isClose && !this.isSended) {
			this.wsService.send(WSDataType.log, value);
			this.inputElem.value = "";
			this.inputElem.disabled = true;
			this.isSended = true;
			setTimeout(() => {
				if (!this.wsService.isClose) {
					this.inputElem.disabled = false;
					this.isSended = false;
				}
			}, 3000);
		}
	}
}