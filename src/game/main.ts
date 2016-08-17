import {WSService} from "../WebSocketService";
import {SimpleEvil, EvilOption} from "./evil";
import {Ebiruai} from "./myEvil";
import {Gozzila} from "./gozzila";
import {ImageLoader} from "./ImageLoader";
import {Keyset} from "./keyset";
import {SocketType, InitialUserData} from "../../server/share/share";

/** TODO いい加減送信用インターフェースに分ける */
export interface Zahyou {
	image?: HTMLImageElement;
	personId: string;
	isMy?: boolean;
	isMigiMuki: boolean;
	x: number;
	y: number;
	isDead?: boolean;
	isAtk?: boolean;
	gozzila?: Gozzila;
	lv?: number;
	maxExp?: number;
}


interface GozzilaInfo {
	hp: number;
	mode: number;
	target: {x: number, y: number}[];
}

/** ゲーム機能の総合操作クラス */
export class MainCanvas {
	public static FRAME = 30;
	public static HEIGHT = 500;
	public static WIDTH = 800;
	public static Y0 = 150;
	public static GOZZILA: Gozzila;

	private ws: WSService;
	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: Ebiruai;
	private gozzila: Gozzila;
	private otherPersonEvils: SimpleEvil[] = [];
	private receiveMyEvilInfo: Zahyou;
	private befSendData: Zahyou;

	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number, height: number) {
		return MainCanvas.HEIGHT - y - height;
	}

	constructor(ws: WSService) {
		this.ws = ws;
	}

	public init() {
		ImageLoader.load().then(() => {
			this.canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
			this.canvasElm.width = MainCanvas.WIDTH;
			this.canvasElm.height = MainCanvas.HEIGHT;
			this.ctx = this.canvasElm.getContext('2d');
			Keyset.setKeyAndButton();
			this.ws.addOnReceiveMsgListener(SocketType.init, (resData) => this.onReceiveInitData(resData));
			this.ws.addOnOpenListener(() => {
				this.ws.send(SocketType.init, {_id: localStorage.getItem("dbId")});
			});
		});
	}

	private onReceiveInitData(resData: InitialUserData) {
		localStorage.setItem("dbId", resData.userData._id);
		this.gozzila = new Gozzila(this.ctx, {
			image: ImageLoader.IMAGES.gozzila,
			x: 550,
			y: MainCanvas.Y0,
			isMigiMuki: false
		});
		MainCanvas.GOZZILA = this.gozzila;
		this.myEvil = new Ebiruai(this.ctx, {
			image: ImageLoader.IMAGES.evilHidari,
			x: Math.round(Math.random() * 500),
			y: MainCanvas.Y0,
			isMigiMuki: true,
			isMy: true,
			personId: resData.personId,
			gozzila: this.gozzila,
			lv: resData.userData.lv,
			exp: resData.userData.exp,
			name: resData.userData.name,
		});
		this.gozzila.target = [0, 0].map( () => {return{x: this.myEvil.x, y: this.myEvil.y}; });
		this.timer = window.setInterval(() => this.draw(), 1000 / MainCanvas.FRAME);
		this.ws.addOnReceiveMsgListener(SocketType.zahyou, (value) => this.onReceiveGameData(value));
		this.ws.addOnCloseListener(() => window.clearInterval(this.timer));
	}

	private onReceiveGameData(value: any) {
		const gozzilaInfo = <GozzilaInfo> value.gozzila;
		this.gozzila.hp = gozzilaInfo.hp;
		this.gozzila.mode = gozzilaInfo.mode;
		this.gozzila.target = gozzilaInfo.target;
		const receiveEvils = <EvilOption[]> value.evils;
		receiveEvils.forEach(evilInfo => {
			const existEvil = this.otherPersonEvils.find(existEvil => existEvil.personId === evilInfo.personId);
			if (existEvil) {
				Object.assign(existEvil, evilInfo);
			} else if (evilInfo.personId !== this.myEvil.personId) {
				this.otherPersonEvils.push(new SimpleEvil(this.ctx, evilInfo));
			}
		});
		this.otherPersonEvils = this.otherPersonEvils.filter(
			evil => receiveEvils.find(receiveEvil => receiveEvil.personId === evil.personId)
		);
		this.receiveMyEvilInfo = receiveEvils.find(evil => evil.personId === this.myEvil.personId);
	}

	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, MainCanvas.WIDTH, MainCanvas.HEIGHT);
		this.gozzila.draw();
		this.otherPersonEvils.forEach(evil => evil.draw());
		this.myEvil.draw();
		this.drawNowPersonCount();
		this.sendServer();
	}
	private drawNowPersonCount() {
		this.ctx.fillStyle = "black";
		this.ctx.font = "12px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`接続数:${this.otherPersonEvils.length + 1}`, 736, 18);
	}
	private sendServer() {
		const sendData = {
			isMigiMuki: this.myEvil.isMigiMuki,
			x: this.myEvil.x,
			y: this.myEvil.y,
			isAtk: this.myEvil.atksita,
			isDead: this.myEvil.isDead,
			lv: this.myEvil.lv,
			maxExp: this.myEvil.maxExp
		};
		if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData) ||
			!this.receiveMyEvilInfo || this.receiveMyEvilInfo.isDead !== sendData.isDead) {
			this.ws.send(SocketType.zahyou, sendData);
			this.myEvil.atksita = false;
		}
		if (this.gozzila.isDamege) {
			this.ws.send(SocketType.gozzilaDamege, null);
			this.gozzila.isDamege = false;
		}
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}
}
