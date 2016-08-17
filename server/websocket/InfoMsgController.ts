import * as WebSocket from 'ws';
import {MainController, SocketType} from "./MainController";
export class InfoMsgController {
	constructor(private main: MainController) {
	}

	public init() {
		this.main.addConnectListner(ws => this.onSomebodyConnect(ws));
	}

	private onSomebodyConnect(ws: WebSocket) {
		this.main.sendAll({
			myWs: ws,
			isSelfSend: false,
			type: SocketType.infolog,
			value: `誰かがアクセスしました`
		});
	}
}