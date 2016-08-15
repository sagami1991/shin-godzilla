import {WSService, sendType} from "../WebSocketService";
import {SimpleEbiruai} from "./evil";
import {Ebiruai} from "./myEvil";
import {Gozzila} from "./gozzila";

export interface Zahyou {
	image?: HTMLImageElement;
	personId: string;
	isMy?: boolean;
	isMigiMuki: boolean;
	x: number;
	y: number;
	isAtk?: boolean;
}

export class MainCanvas {
	public static FRAME = 30;
	public static HEIGHT = 500;
	public static WIDTH = 800;
	public static Y0 = 150;

	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number) {
		return MainCanvas.HEIGHT - y;
	}
	private ws: WSService;
	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: Ebiruai;
	private gozzila: Gozzila;
	public static GOZZILA: Gozzila;
	private simpleEbiruais: SimpleEbiruai[] = [];
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
	} = {};

	constructor(ws: WSService) {
		this.ws = ws;
	}
	public init() {
		this.canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
		this.ctx = this.canvasElm.getContext('2d');
		this.keyset();
		this.loader().then(() => this.onImageLoaded());
	}

	private onImageLoaded() {
		this.myEvil = new Ebiruai(this.ctx, {
			image: MainCanvas.images.evilHidari,
			x: Math.round(Math.random() * 500),
			y: MainCanvas.Y0,
			isMigiMuki: true,
			isMy: true,
			personId: this.ws.personId
		});
		this.gozzila = new Gozzila(this.ctx, {
			image: MainCanvas.images.gozzila,
			x: 550,
			y: MainCanvas.Y0,
			isMigiMuki: false,
			personId: null
		});
		MainCanvas.GOZZILA = this.gozzila;
		this.timer = window.setInterval(() => this.draw(), 1000 / MainCanvas.FRAME);
		this.ws.addOnReceiveMsgListener((type, value) => this.onReceiveEvils(type, value));
		this.ws.addOnReceiveMsgListener((type, value) => this.onReceiveClosePerson(type, value));
	}
	private onReceiveClosePerson(type: number, value: any) {
		if (type !== sendType.closePerson) return;
		this.simpleEbiruais = this.simpleEbiruais.filter(evil => evil.personId !== value);
	}
	private onReceiveEvils(type: number, value: any) {
		if (type !== sendType.zahyou) return;
		const evils = <Zahyou[]> value;
		evils.forEach(evil => {
			const existEvil = this.simpleEbiruais.find(existEvil => existEvil.personId === evil.personId);
			if (existEvil) {
				Object.assign(existEvil, evil);
			} else if (evil.personId !== this.myEvil.personId) {
				this.simpleEbiruais.push(new SimpleEbiruai(this.ctx, evil));
			}
		});
	}

	/** 画像を読み込む（非同期なのでpromiseで待つ） */
	private loader(): Promise<void> {
		const images = [
			"./assets/ebiruai.png",
			"./assets/ebiruai_.png",
			"./assets/densya.png",
			"./assets/bakuhatu.png",
			"./assets/gozzila.png",
			"./assets/gozzila_attack.png",
		];

		return Promise.all(images.map((src)=>{
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
		});
	}


	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, MainCanvas.WIDTH, MainCanvas.HEIGHT);
		this.myEvil.draw();
		this.simpleEbiruais.forEach(evil => evil.draw());
		this.gozzila.target = this.myEvil;
		this.gozzila.draw();
		this.sendServer();
	}

	private sendServer() {
		const sendData = {
			isMigiMuki: this.myEvil.isMigiMuki,
			x: this.myEvil.x,
			y: this.myEvil.y,
			isAtk: this.myEvil.atksita
		};
		if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)){
			this.ws.send(sendType.zahyou, sendData);
			this.myEvil.atksita = false;
		}
		if (this.gozzila.isDamege) {
			this.ws.send(sendType.gozzilaDamege, null);
			this.gozzila.isDamege = false;
		}
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	private static KEYSET = [
		{keycode: [68, 39], eventName: "migi"},
		{keycode: [87, 38], eventName: "ue"},
		{keycode: [83, 40], eventName: "sita"},
		{keycode: [65, 37], eventName: "hidari"},
		{keycode: [32], eventName: "jump"},
		{keycode: [88], eventName: "atk"}
	];
	private keyset() {
		this.canvasElm.addEventListener("click", () => {
			MainCanvas.KeyEvent.atk = true;
		});

		window.addEventListener("keydown", e => {
			MainCanvas.KEYSET.forEach((keyset) => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>MainCanvas.KeyEvent)[keyset.eventName] = true;
				}
			});
		});

		window.addEventListener("keyup", e => {
			MainCanvas.KEYSET.forEach((keyset) => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>MainCanvas.KeyEvent)[keyset.eventName] = false;
				}
			});
		});
	}
}




