import * as WebSocket from 'ws';
import {MainController} from "./MainController";
import {SocketType} from "../share/share";
import {UserService} from "../service/UserService";

export class RankingController {
	constructor(private main: MainController, private userService: UserService) {
	}

	public init() {
		this.main.addConnectListner(ws => this.sendRanking(ws));
	}

	private sendRanking(ws: WebSocket) {
		this.userService.getRanker().then(users => {
			this.main.send(ws, SocketType.ranking, users);
		});
	}
}