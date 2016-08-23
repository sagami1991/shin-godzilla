import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketWrapper";
import {SocketType} from "../share/share";
import {UserRepository} from "../repository/UserRepository";

export class RankingController {
	constructor(private main: WSServer, private userService: UserRepository) {
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