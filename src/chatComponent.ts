import {WSService, sendType} from "./WebSocketService";
import * as Handlebars from "handlebars";

interface ChatLog {
	personId: string;
	msg: string;
	date: string;
}
export class ChatComponent {
	private static MAX_LINE = 7;
	private wsService: WSService;
	private logs: ChatLog[] = [];
	private logElem: HTMLElement;
	private inputElem: HTMLTextAreaElement;
	private sendElem: HTMLElement;
	private static logsTmpl = Handlebars.compile(`
		{{#logs}}
		<li class="chat-log">
			{{msg}}
		</li>
		{{/logs}}
	`);
	constructor(wsService: WSService) {
		this.wsService = wsService;
	}

	public init() {
		this.logElem = <HTMLElement> document.querySelector(".chat-logs");
		this.inputElem = <HTMLTextAreaElement> document.querySelector("#chat");
		this.sendElem = <HTMLElement> document.querySelector(".chat-send");

		this.wsService.addOnReceiveMsgListener((type, value) => this.onReceiveInitLog(type, value));
		this.wsService.addOnReceiveMsgListener((type, value) => {
			if (type !== sendType.log) return;
			const log = <ChatLog>value;
			this.logs.push(log);
			if (this.logs.length > ChatComponent.MAX_LINE) this.logs.shift();
			if (log.personId !== this.wsService.personId) {
				Notification.requestPermission();
				new Notification("", {body: log.msg});
			} ;

			this.logElem.innerHTML =  ChatComponent.logsTmpl({logs: this.logs});
		});

		this.wsService.addOnOpenListener(() => this.onOpen());
		this.wsService.addOnCloseListener(() => this.onClose());
	}

	private onReceiveInitLog(type: number, value: any) {
		if (type !== sendType.initlog) return;
		this.logs = <ChatLog[]> value;
		this.logElem.innerHTML =  ChatComponent.logsTmpl({logs: this.logs});
	}

	private onOpen() {
		this.inputElem.addEventListener("keypress", (e) => {
			if (e.keyCode === 13 && !e.shiftKey) {
				this.send();
				e.preventDefault();
			}
		});

		this.sendElem.addEventListener("click", e => {
			this.send();
		});
	}

	private onClose() {
		this.inputElem.disabled = true;
		this.inputElem.value = "チャットが切断されました。";
	}

	private send() {
		const value = this.inputElem.value;
		if (value && this.wsService.isClose) {
			this.wsService.send(sendType.log, value);
			this.inputElem.value = "";
		}
	}
}