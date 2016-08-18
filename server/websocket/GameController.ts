import * as WebSocket from 'ws';
import {MainController, ReqData} from "./MainController";
import {GodzillaController} from "./GodzillaController";
import {SocketType, InitialUserData, DbUserData, ReqEvilData, GameData, FieldType} from "../share/share";
import {UserService} from "../service/UserService";
import {FieldController} from "./FieldController";
import * as shortid from "shortid";

export class GameController {
	public static FRAME = 30;
	private static INIT_USERDATA = {
		exp: 0,
		lv: 1,
		name: "名前"
	};
	private godzillaController: GodzillaController;
	private befSendData: GameData;
	private evils: ReqEvilData[] = [];
	public static getRandom<T>(arr: T[]): T  {
		return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
	}
	constructor(private main: MainController,
	 private userService: UserService,
	 private fieldController: FieldController) {
		this.godzillaController = new GodzillaController(main, this.evils);
		this.godzillaController.init();
	}

	public init() {
		this.main.addCloseListner(ws => this.deleteClosedEvil(ws));
		this.main.addMsgListner(SocketType.init, (ws, reqData) => this.loadUser(ws, reqData));
		this.main.addMsgListner(SocketType.zahyou, (ws, reqData) => this.updateEvils(ws, reqData));
		this.main.addMsgListner(SocketType.save, (ws, reqData) => this.saveUserData(ws, reqData));
		setInterval(() => this.intervalAction(), 1000 / GameController.FRAME);
	}

	private saveUserData(ws: WebSocket, reqData: DbUserData) {
		this.userService.updateUser(Object.assign(reqData, {ip: this.main.getIpAddr(ws)}));
	}

	private loadUser(ws: WebSocket, reqData: {_id: string}) {
		this.userService.containBanList(this.main.getIpAddr(ws)).catch(() => {
			console.log(`違反者接続 ip: ${this.main.getIpAddr(ws)}`);
			ws.close(1008, "違反者リストに含まれています");
		});
		if (!reqData._id) {
			this.sendInitUserData(ws, this.createInitUser(this.main.getIpAddr(ws)));
		} else {
			this.userService.getUser(reqData._id).then((user) => {
				this.sendInitUserData(ws, user ? user : this.createInitUser(this.main.getIpAddr(ws)));
			});
		}
	}

	private createInitUser(ipAddr: string): DbUserData {
		const initialData = Object.assign({_id: shortid.generate(), ip: ipAddr}, GameController.INIT_USERDATA);
		this.userService.createUser(initialData);
		return initialData;
	}

	private sendInitUserData(ws: WebSocket, user: DbUserData) {
		this.main.send(ws, SocketType.init, <InitialUserData> {
			personId: this.main.getSercretKey(ws),
			userData: user,
			bgType: this.fieldController.bgType
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
		const sendData: GameData = {
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

	private filterEvilData() {

	}
}