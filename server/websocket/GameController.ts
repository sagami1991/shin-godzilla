import * as WebSocket from 'ws';
import {MainController, SocketType, ReqData} from "./MainController";
import {GodzillaController, GodzillaInfo} from "./GodzillaController";

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
	private godzillaController: GodzillaController;
	private befSendData: GameData;
	private evils: Zahyou[] = [];
	public static getRandom<T>(arr: T[]): T  {
		return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
	}
	constructor(private main: MainController) {
		this.godzillaController = new GodzillaController(main, this.evils);
		this.godzillaController.init();
	}

	public init() {
		this.main.addConnectListner(ws => this.onSomebodyConnect(ws));
		this.main.addCloseListner(ws => this.deleteClosedEvil(ws));
		this.main.addMsgListner({
			type: SocketType.zahyou,
			cb: (ws, reqData) => this.updateEvils(ws, reqData)
		});
		setInterval(() => this.intervalAction(), 1000 / GameController.FRAME);
	}

	private onSomebodyConnect(ws: WebSocket) {
		this.main.sendAll({
			myWs: ws,
			isSelfSend: false,
			type: SocketType.infolog,
			value: `誰かがアクセスしました`
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

	private updateEvils(nowWs: WebSocket, reqData: ReqData) {
		const evilInfo = this.evils.find(zahyou => zahyou.personId === this.main.getSercretKey(nowWs));
		if (evilInfo) {
			Object.assign(evilInfo, reqData.value);
		} else {
			this.evils.push(Object.assign({personId: this.main.getSercretKey(nowWs)}, reqData.value));
		}
	}
}