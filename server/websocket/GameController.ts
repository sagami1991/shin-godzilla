import * as WebSocket from 'ws';
import {MainController, ReqData} from "./MainController";
import {GodzillaController, GodzillaInfo} from "./GodzillaController";
import {SocketType, InitialUserData, DbUserData, ReqEvilData} from "../share/share";
import {UserService} from "../service/UserService";
import * as shortid from "shortid";

interface GameData {
	gozzila: GodzillaInfo;
	evils: Zahyou[];
}

export interface Zahyou {
	personId: string;
	isMigiMuki: boolean;
	x: number;
	y: number;
	isAtk: boolean;
	isDead: boolean;
	lv: number;
	maxExp: number;
}

export class GameController {
	public static FRAME = 30;
	private static INIT_USERDATA = {
		_id: "",
		exp: 0,
		lv: 1,
		name: "名前"
	};
	private godzillaController: GodzillaController;
	private befSendData: GameData;
	private evils: Zahyou[] = [];
	public static getRandom<T>(arr: T[]): T  {
		return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
	}
	constructor(private main: MainController, private userService: UserService) {
		this.godzillaController = new GodzillaController(main, this.evils);
		this.godzillaController.init();
	}

	public init() {
		this.main.addCloseListner(ws => this.deleteClosedEvil(ws));
		this.main.addMsgListner(SocketType.init, (ws, reqData) => this.onReceiveUserId(ws, reqData));
		this.main.addMsgListner(SocketType.zahyou, (ws, reqData) => this.updateEvils(ws, reqData));
		this.main.addMsgListner(SocketType.save, (ws, reqData) => this.saveUserData(ws, reqData));
		setInterval(() => this.intervalAction(), 1000 / GameController.FRAME);
	}

	private saveUserData(ws: WebSocket, reqData: DbUserData) {
		this.userService.updateUser(reqData);
	}

	private onReceiveUserId(ws: WebSocket, reqData: {_id: string}) {
		if (!reqData._id) {
			this.sendInitUserData(ws, this.createInitUser());
		} else {
			this.userService.getUser(reqData._id).then((user) => {
				if (user) {
					this.sendInitUserData(ws, user);
				} else {
					this.sendInitUserData(ws, this.createInitUser());
				}
			});
		}
	}

	private createInitUser(): DbUserData {
		const initialData = {
			_id: shortid.generate(),
			exp: 0,
			lv: 1,
			name: "名前"
		};
		this.userService.createUser(initialData);
		return initialData;
	}

	private sendInitUserData(ws: WebSocket, user: DbUserData) {
		this.main.send(ws, SocketType.init, <InitialUserData> {
			personId: this.main.getSercretKey(ws),
			userData: user
		});
	}


	private deleteClosedEvil(ws: WebSocket) {
		const targetIdx = this.evils.findIndex(zahyou => zahyou.personId === this.main.getSercretKey(ws));
		this.evils.splice(targetIdx, 1);
	}

	private intervalAction() {
		this.godzillaController.roopAction();
		this.sendGameData();
	}

	private sendGameData() {
		const sendData = {
			gozzila: this.godzillaController.godzilla,
			evils: this.evils
		};
		if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)) {
			this.main.sendAll({
				type: SocketType.zahyou,
				value: sendData
			});
		}
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	private updateEvils(nowWs: WebSocket, reqData: ReqEvilData) {
		const evilInfo = this.evils.find(zahyou => zahyou.personId === this.main.getSercretKey(nowWs));
		if (evilInfo) {
			Object.assign(evilInfo, reqData);
		} else {
			this.evils.push(Object.assign({personId: this.main.getSercretKey(nowWs)}, reqData));
		}
	}
}