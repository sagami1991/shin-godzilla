import * as WebSocket from 'ws';
import {WSWrapper} from "./WebSocketWrapper";
import {GodzillaController} from "./GodzillaController";
import {SocketType, InitialUserData, ReqEvilData, GameData, CONST, MasterEvilData} from "../share/share";
import {UserDataController} from "./UserDataController";
import {FieldController} from "./FieldController";
import {DiffExtract} from "../share/util";
import * as _ from "lodash";
export class GameController {
	public static FRAME = 30;
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
		this.wsWrapper.addMsgListner(SocketType.snapshot, (ws, reqData) => this.onReceiveSnapshot(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.gozzilaDamege, (ws, reqData) => this.atkToGodzilla(ws, reqData));	
		setInterval(() => this.intervalAction(),  1000 / GameController.FRAME);
		this.userController.onLvUp = (personId: string) => {
			const evil = this.masterUsersData.find(evil => evil.pid === personId);
			if (evil) {
				evil.lv += 1;
				evil.isLvUp = true;
			}
		};
		this.userController.onFirstConnect = (ws, dbUserData) => {
			const sendUserData: MasterEvilData = {
				isMigi: true,
				x: Math.round(Math.random() * 500),
				y: CONST.CANVAS.Y0,
				isAtk: false,
				isDead: false,
				pid: this.wsWrapper.getPersonId(ws),
				lv: dbUserData.lv,
				isLvUp: false,
				isHeal: false,
				name: dbUserData.name
			};

			const isSuccessSend = this.wsWrapper.send(ws, SocketType.init, <InitialUserData> {
				pid: this.wsWrapper.getPersonId(ws),
				user: Object.assign({}, dbUserData, sendUserData),
				users: this.masterUsersData,
				gozdilla: this.godzillaController.godzilla,
				bg: FieldController.bgType
			});
			if (isSuccessSend) {
				this.masterUsersData.push(sendUserData);
				this.userController.pushUser(dbUserData);
			}
		};

		this.userController.onClose = (ws) => {
			const pid = this.wsWrapper.getPersonId(ws);
			this.closeIds.push(pid);
			_.remove(this.masterUsersData, user => user.pid === pid);
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
				type: SocketType.snapshot,
				value: snapShot
			});
		}
		this.masterUsersData.forEach(evil => evil.isLvUp = false);
		this.closeIds = [];
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	// MsgListner 
	private onReceiveSnapshot(ws: WebSocket, reqData: ReqEvilData) {
		const user = this.userController.getUser(ws);
		if (!user) {
			console.trace("存在しないユーザー", reqData);
			this.wsWrapper.close(ws, 1001, "予期せぬエラー");
			return;
		} else if (!this.validateReqData(reqData)) {
			this.wsWrapper.close(ws, 1001, "予期せぬエラー データ処理できない");
			return;
		}
		const evilInfo = this.masterUsersData.find(zahyou => zahyou.pid === this.wsWrapper.getPersonId(ws));
		if (evilInfo) {
			_.merge(evilInfo, this.filterEvilData(reqData));
		}
		user.date = new Date();
	}

	private filterEvilData(reqData: ReqEvilData): ReqEvilData {
		return {
			isMigi: reqData.isMigi,
			x: reqData.x,
			y: reqData.y,
			isAtk: reqData.isAtk,
			isDead: reqData.isDead,
			isHeal: reqData.isHeal
		};
	}

	private validateReqData(reqData: ReqEvilData) {
		return (
			["number", "undefined"].includes(typeof reqData.x) &&
			(typeof reqData.y === "undefined" || (typeof reqData.y === "number" && reqData.y >= 150))
		);
	}
}