import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketWrapper";
import {GodzillaController} from "./GodzillaController";
import {SocketType, InitialUserData, ReqEvilData, GameData, CONST, MasterEvilData} from "../share/share";
import {UserDataController} from "./UserDataController";
import {FieldController} from "./FieldController";
import {DiffExtract} from "../share/util";
import {UserService} from "../service/UserService";
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
	constructor(private wsWrapper: WSServer,
				private userService: UserService) {
		this.godzillaController = new GodzillaController(wsWrapper, this.masterUsersData);
		this.godzillaController.init();
	}

	public init() {
		this.wsWrapper.addMsgListner(SocketType.snapshot, (ws, reqData) => this.onReceiveSnapshot(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.gozzilaDamege, (ws, reqData) => this.atkToGodzilla(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.init, (ws, reqData) => this.onFirstRequest(ws, reqData));
		this.wsWrapper.addCloseListner((ws) => this.onClose(ws));
		setInterval(() => this.intervalAction(),  1000 / GameController.FRAME);
	}

	private onFirstRequest(ws: WebSocket, reqData: {_id: string}) {
		const ip = this.wsWrapper.getIpAddr(ws);
		const personId = this.wsWrapper.getPersonId(ws);
		this.userService.generateOrGetUser(reqData._id, personId, ip).catch((msg) => {
			this.wsWrapper.close(ws, 1008, msg);
		}).then((dbUserData) => {
			if (!dbUserData) {
				this.wsWrapper.close(ws, 1008, "予期せぬエラー、");
				return;
			}
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

			const isSendSuccess = this.wsWrapper.send(ws, SocketType.init, <InitialUserData> {
				pid: this.wsWrapper.getPersonId(ws),
				user: Object.assign({}, dbUserData, sendUserData),
				users: this.masterUsersData,
				gozdilla: this.godzillaController.godzilla,
				bg: FieldController.bgType
			});
			if (isSendSuccess) {
				this.masterUsersData.push(sendUserData);
				this.userService.pushUser(dbUserData);
				this.wsWrapper.setDbIdToWs(ws, dbUserData._id);
			}
		});
	}

	private onClose(ws: WebSocket) {
		const pid = this.wsWrapper.getPersonId(ws);
		this.closeIds.push(pid);
		this.userService.deleteAndSaveUser(this.wsWrapper.getDbId(ws));
		_.remove(this.masterUsersData, user => user.pid === pid);
	}

	private atkToGodzilla(ws: WebSocket, damage: number) {
		this.godzillaController.damage(damage);
		const user = this.userService.increaseExp(this.wsWrapper.getDbId(ws));
		if (user) {
			this.wsWrapper.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
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

	private onReceiveSnapshot(ws: WebSocket, reqData: ReqEvilData) {
		const user = this.userService.getUser(this.wsWrapper.getDbId(ws));
		if (!user) {
			this.wsWrapper.close(ws, 1001, "予期せぬエラー UserMemoryに存在しないユーザー");
		} else if (!this.validateReqData(reqData)) {
			this.wsWrapper.close(ws, 1001, "予期せぬエラー 処理できないsnapShotデータを受信");
		} else {
			user.date = new Date();
			const evilInfo = this.masterUsersData.find(zahyou => zahyou.pid === this.wsWrapper.getPersonId(ws));
			if (evilInfo) {
				_.merge(evilInfo, this.filterEvilData(reqData));
			}
		}
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