import * as WebSocket from 'ws';
import {WSWrapper} from "./WebSocketWrapper";
import {GodzillaController} from "./GodzillaController";
import {SocketType, InitialUserData, ReqEvilData, GameData, CONST, MasterEvilData} from "../share/share";
import {UserDataController} from "./UserDataController";
import {FieldController} from "./FieldController";
import {DiffExtract} from "../share/util";

export class GameController {
	public static FRAME = 30;
	public static SEND_FPS = 10;
	private godzillaController: GodzillaController;
	private befSendData: GameData;
	private masterUsersData: MasterEvilData[] = [];
	private closeIds: string[] = [];
	public static getRandom<T>(arr: T[]): T  {
		return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
	}
	constructor(private wsWrapper: WSWrapper,
				private userController: UserDataController) {
		this.godzillaController = new GodzillaController(wsWrapper, this.masterUsersData);
		this.godzillaController.init();
	}

	public init() {
		this.wsWrapper.addCloseListner(ws => this.deleteClosedEvil(ws));
		this.wsWrapper.addMsgListner(SocketType.zahyou, (ws, reqData) => this.onReceiveEvilData(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.gozzilaDamege, (ws, reqData) => this.atkToGodzilla(ws, reqData));	
		setInterval(() => this.intervalAction(),  1000 / GameController.SEND_FPS);
		this.userController.onLvUp = (personId: string) => {
			const evil = this.masterUsersData.find(evil => evil.pid === personId);
			if (evil) {
				evil.lv += 1;
				evil.isLvUp = true;
			}
		};
		this.userController.onFirstConnect = (ws, user) => {
			const userData: MasterEvilData = {
				isMigi: true,
				x: Math.round(Math.random() * 500),
				y: CONST.CANVAS.Y0,
				isAtk: false,
				isDead: false,
				pid: this.wsWrapper.getPersonId(ws),
				lv: user.lv,
				isLvUp: false,
				name: user.name
			};
			this.masterUsersData.push(userData);

			this.wsWrapper.send(ws, SocketType.init, <InitialUserData> {
				pid: this.wsWrapper.getPersonId(ws),
				user: Object.assign({}, user, userData),
				users: this.masterUsersData,
				gozdilla: this.godzillaController.godzilla,
				bg: FieldController.bgType
			});
		};

		this.userController.onClose = (ws) => {
			this.closeIds.push(this.wsWrapper.getPersonId(ws));
		};

		this.userController.onSave = (ws, user) => {
			const userData = this.masterUsersData.find(user => user.pid === this.wsWrapper.getPersonId(ws));
			if (userData) userData.name = user.name;
		};
	}

	private atkToGodzilla(ws: WebSocket, damage: number) {
		this.userController.increaseExp(ws);
		this.godzillaController.damage(damage);
	}

	private deleteClosedEvil(ws: WebSocket) {
		const targetIdx = this.masterUsersData.findIndex(zahyou => zahyou.pid === this.wsWrapper.getPersonId(ws));
		this.masterUsersData.splice(targetIdx, 1);
	}

	private intervalAction() {
		this.godzillaController.roopAction();
		this.sendSnapshot();
	}

	private sendSnapshot() {
		const sendData: GameData = {
			gozzila: this.godzillaController.godzilla,
			evils: this.masterUsersData,
			cids: this.closeIds
		};
		const snapShot = <GameData> DiffExtract.diff(this.befSendData, sendData);
		if (snapShot) {
			this.wsWrapper.sendAll({
				type: SocketType.zahyou,
				value: snapShot
			});
		}
		this.masterUsersData.forEach(evil => evil.isLvUp = false);
		this.closeIds = [];
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	// MsgListner 
	private onReceiveEvilData(ws: WebSocket, reqData: ReqEvilData) {
		const user = this.userController.getUser(ws);
		if (!user || !this.validateReqData(reqData)) {
			console.trace("不正なデータ", reqData);
			ws.close();
			return;
		}
		const evilInfo = this.masterUsersData.find(zahyou => zahyou.pid === this.wsWrapper.getPersonId(ws));
		if (evilInfo) {
			Object.assign(evilInfo, this.filterEvilData(reqData));
		}
	}

	private filterEvilData(reqData: ReqEvilData): ReqEvilData {
		return {
			isMigi: reqData.isMigi,
			x: reqData.x,
			y: reqData.y,
			isAtk: reqData.isAtk,
			isDead: reqData.isDead,
		};
	}

	private validateReqData(reqData: ReqEvilData) {
		return (
			typeof reqData.x === "number" &&
			typeof reqData.y === "number" &&
			reqData.y >= 150
		);
	}
}