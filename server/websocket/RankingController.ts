import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {SocketType} from "../share/share";
import {UserRepository} from "../repository/UserRepository";

export class RankingController {
	constructor(private wsServer: WSServer, private userService: UserRepository) {
	}

	public init() {
		this.wsServer.addConnectListner(ws => this.sendRanking(ws));
		this.wsServer.addMsgListner(SocketType.ranking, ws => this.sendRanking(ws));
	}

	private sendRanking(ws: WebSocket) {
		this.userService.getRanker().then(users => {
			this.wsServer.send(ws, SocketType.ranking, users);
		});
	}
}