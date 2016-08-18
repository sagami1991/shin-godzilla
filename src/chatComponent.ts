import {WSService} from "./WebSocketService";
import * as Handlebars from "handlebars";
import {SocketType} from "../server/share/share";

interface ChatMsg {
	msg: string;
}
export class ChatComponent {
	private static MAX_LINE = 7;
	private static HTML = `
		<ul class="chat-logs"></ul>
		<div class="chat-input">
			<textarea id="chat" maxlength="50"></textarea>
			<div class="chat-send"><i class="material-icons">send</i></div>
		</div>
	`;
	private static logsTmpl = Handlebars.compile(`
		{{#logs}}
			<li class="chat-log">{{msg}}</li>
		{{/logs}}
	`);
	private wsService: WSService;
	private logs: ChatMsg[] = [];
	private logElem: HTMLElement;
	private inputElem: HTMLTextAreaElement;
	private sendElem: HTMLElement;
	private isSended: boolean;
	constructor(wsService: WSService) {
		this.wsService = wsService;
	}

	public init() {
		document.querySelector(".chat-area").innerHTML = ChatComponent.HTML;
		this.logElem = <HTMLElement> document.querySelector(".chat-logs");
		this.inputElem = <HTMLTextAreaElement> document.querySelector("#chat");
		this.sendElem = <HTMLElement> document.querySelector(".chat-send");
		document.addEventListener("keydown", (e) => {
			if (e.keyCode === 13) {
				this.inputElem.focus();
			}
		});
		this.wsService.addOnReceiveMsgListener(SocketType.initlog, (value) => this.onReceiveInitLog(value));
		this.wsService.addOnReceiveMsgListener(SocketType.chatLog, (value) => this.onReceiveMsg(value));
		this.wsService.addOnOpenListener(() => this.onOpen());
		this.wsService.addOnCloseListener(() => this.onClose());
	}
	private onReceiveMsg(msg: ChatMsg) {
		this.logs.push(msg);
		if (this.logs.length > ChatComponent.MAX_LINE) this.logs.shift();
		this.logElem.innerHTML =  ChatComponent.logsTmpl({logs: this.logs});
	}
	private onReceiveInitLog(logs: ChatMsg[]) {
		this.logs = logs;
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
			this.wsService.send(SocketType.chatLog, value);
			this.inputElem.value = "";
			this.inputElem.disabled = true;
			this.isSended = true;
			setTimeout(() => {
				if (!this.wsService.isClose) {
					this.inputElem.disabled = false;
					this.isSended = false;
				}
			}, 2000);
		}
	}
}