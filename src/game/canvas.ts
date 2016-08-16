import {WSService, WSDataType} from "../WebSocketService";
import {SimpleEvil} from "./evil";
import {Ebiruai} from "./myEvil";
import {Gozzila} from "./gozzila";

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

/** canvasの総合操作クラス */
export class MainCanvas {
	public static FRAME = 30;
	public static HEIGHT = 500;
	public static WIDTH = 800;
	public static Y0 = 150;

	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number, height: number) {
		return MainCanvas.HEIGHT - y - height;
	}
	private ws: WSService;
	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: Ebiruai;
	private gozzila: Gozzila;
	public static GOZZILA: Gozzila;
	private otherPersonEvils: SimpleEvil[] = [];
	private receiveMyEvilInfo: Zahyou;
	private befSendData: Zahyou;
	public static KeyEvent = {
		ue: false,
		migi: false,
		sita: false,
		hidari: false,
		jump: false,
		atk: false
	};
	public static images: {
		densya?: HTMLImageElement,
		bakuhatu?: HTMLImageElement,
		evilmigi?: HTMLImageElement,
		evilHidari?: HTMLImageElement,
		gozzila?: HTMLImageElement,
		gozzila_atk?: HTMLImageElement,
		evilSinda?: HTMLImageElement
		gozzilaBefAtk?: HTMLImageElement
		lvup?: HTMLImageElement[];
	} = {};

	constructor(ws: WSService) {
		this.ws = ws;
	}
	public init() {
		this.canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
		this.canvasElm.width = MainCanvas.WIDTH;
		this.canvasElm.height = MainCanvas.HEIGHT;
		this.ctx = this.canvasElm.getContext('2d');
		this.keyset();
		this.ws.addOnReceiveMsgListener((type) => {
			if (type === WSDataType.personId) {
				this.loadImage().then(() => this.onImageLoaded());
			}
		});
	}

	private onImageLoaded() {
		this.gozzila = new Gozzila(this.ctx, {
			image: MainCanvas.images.gozzila,
			x: 550,
			y: MainCanvas.Y0,
			isMigiMuki: false,
			personId: null
		});
		MainCanvas.GOZZILA = this.gozzila;
		this.myEvil = new Ebiruai(this.ctx, {
			image: MainCanvas.images.evilHidari,
			x: Math.round(Math.random() * 500),
			y: MainCanvas.Y0,
			isMigiMuki: true,
			isMy: true,
			personId: this.ws.personId,
			gozzila: this.gozzila,
			lv: 1
		});
		this.gozzila.target = [0, 0].map( () => {return{x: this.myEvil.x, y: this.myEvil.y}; });
		this.timer = window.setInterval(() => this.draw(), 1000 / MainCanvas.FRAME);
		this.ws.addOnReceiveMsgListener((type, value) => this.onReceiveGameData(type, value));
		this.ws.addOnCloseListener(() => window.clearInterval(this.timer));
	}

	private onReceiveGameData(type: number, value: any) {
		if (type !== WSDataType.zahyou) return;
		const gozzilaInfo = <GozzilaInfo> value.gozzila;
		this.gozzila.hp = gozzilaInfo.hp;
		this.gozzila.mode = gozzilaInfo.mode;
		this.gozzila.target = gozzilaInfo.target;
		const receiveEvils = <Zahyou[]> value.evils;
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
		// TODO エラー出てる
		if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData) ||
			!this.receiveMyEvilInfo || this.receiveMyEvilInfo.isDead !== sendData.isDead) {
			this.ws.send(WSDataType.zahyou, sendData);
			this.myEvil.atksita = false;
		}
		if (this.gozzila.isDamege) {
			this.ws.send(WSDataType.gozzilaDamege, null);
			this.gozzila.isDamege = false;
		}
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	private static KEYSET = [
		{keycode: [68, 39], eventName: "migi"},
		// {keycode: [87, 38], eventName: "ue"},
		// {keycode: [83, 40], eventName: "sita"},
		{keycode: [65, 37], eventName: "hidari"},
		{keycode: [32, 87, 67], eventName: "jump"},
		{keycode: [88], eventName: "atk"}
	];

	/** ボタンやキーを設定 */
	private keyset() {
		this.canvasElm.addEventListener("click", () => {
			MainCanvas.KeyEvent.atk = true;
		});
		MainCanvas.KEYSET.forEach((keyset) => {
			window.addEventListener("keydown", e => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>MainCanvas.KeyEvent)[keyset.eventName] = true;
					if (e.keyCode === 32 && document.activeElement === document.body) {
						e.preventDefault();
					}
				}
			});
			window.addEventListener("keyup", e => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>MainCanvas.KeyEvent)[keyset.eventName] = false;
				}
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("mousedown", () => {
				(<any>MainCanvas.KeyEvent)[keyset.eventName] = true;
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("touchstart", e => {
				(<any>MainCanvas.KeyEvent)[keyset.eventName] = true;
				const elem = (<HTMLElement> e.target);
				elem.className = elem.className + " hover";
				e.preventDefault();
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("mouseup", () => {
				(<any>MainCanvas.KeyEvent)[keyset.eventName] = false;
			});
			document.querySelector(`.${keyset.eventName}`).addEventListener("touchend", e => {
				(<any>MainCanvas.KeyEvent)[keyset.eventName] = false;
				const elem = (<HTMLElement> e.target);
				elem.className = elem.className.replace(" hover", "");
				e.preventDefault();
			});
		});

	}

	/** 画像を読み込む */
	private loadImage(): Promise<void> {
		const images = [
			"./assets/ebiruai.png",
			"./assets/ebiruai_.png",
			"./assets/densya.png",
			"./assets/bakuhatu.png",
			"./assets/gozzila.png",
			"./assets/gozzila_attack.png",
			"./assets/evil_sinda.png",
			"./assets/gozzila_bef_atk.png",
		];

		return Promise.all(images.map((src) => {
			return new Promise<HTMLImageElement>(reslve => {
				const image = new Image();
				image.addEventListener("load", () => {
					reslve(image);
				});
				image.src = src;
			});
		})).then((imageElms) => {
			MainCanvas.images.evilHidari = imageElms[0];
			MainCanvas.images.evilmigi = imageElms[1];
			MainCanvas.images.densya = imageElms[2];
			MainCanvas.images.bakuhatu = imageElms[3];
			MainCanvas.images.gozzila = imageElms[4];
			MainCanvas.images.gozzila_atk = imageElms[5];
			MainCanvas.images.evilSinda = imageElms[6];
			MainCanvas.images.gozzilaBefAtk = imageElms[7];
		});
	}
}
