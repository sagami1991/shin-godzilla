import * as WebSocket from 'ws';
import {WSWrapper} from "./WebSocketWrapper";
import {SocketType} from "../share/share";
import {UserService} from "../service/UserService";

export class RankingController {
	constructor(private main: WSWrapper, private userService: UserService) {
	}

	public init() {
		this.main.addConnectListner(ws => this.sendRanking(ws));
		this.main.addMsgListner(SocketType.ranking, ws => this.sendRanking(ws));
	}

	private sendRanking(ws: WebSocket) {
		this.userService.getRanker().then(users => {
			this.main.send(ws, SocketType.ranking, users);
		});
	}
}