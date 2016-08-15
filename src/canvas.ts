import {WSService, sendType} from "./WebSocketService";

interface Zahyou {
	image?: HTMLImageElement;
	personId: string;
	isMy?: boolean;
	isMigiMuki: boolean;
	x: number;
	y: number;
	isAtk?: boolean;
}

export class MapleCanvas {
	public static FRAME = 30;
	public static HEIGHT = 500;
	public static WIDTH = 800;
	public static Y0 = 150;

	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number) {
		return MapleCanvas.HEIGHT - y;
	}
	private ws: WSService;
	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: Ebiruai;
	private gozzila: Gozzila;
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
		this.ws.addOnReceiveMsgListener((type, value) => this.onReceiveEvils(type, value));
		this.ws.addOnReceiveMsgListener((type, value) => this.onReceiveClosePerson(type, value));
		this.myEvil = new Ebiruai(this.ctx, {
			image: MapleCanvas.images.evilHidari,
			x: Math.round(Math.random() * 500),
			y: MapleCanvas.Y0,
			isMigiMuki: true,
			isMy: true,
			personId: this.ws.personId
		});
		this.gozzila = new Gozzila(this.ctx, {
			image: MapleCanvas.images.gozzila,
			x: 550,
			y: MapleCanvas.Y0,
			isMigiMuki: false,
			personId: null
		});
		this.timer = window.setInterval(() => this.draw(), 1000 / MapleCanvas.FRAME);
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
			if (existEvil){
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
			MapleCanvas.images.evilHidari = imageElms[0];
			MapleCanvas.images.evilmigi = imageElms[1];
			MapleCanvas.images.densya = imageElms[2];
			MapleCanvas.images.bakuhatu = imageElms[3];
			MapleCanvas.images.gozzila = imageElms[4];
			MapleCanvas.images.gozzila_atk = imageElms[5];
		});
	}


	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, MapleCanvas.WIDTH, MapleCanvas.HEIGHT);
		this.myEvil.draw();
		this.simpleEbiruais.forEach(evil => evil.draw());
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
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	private keyset() {
		this.canvasElm.addEventListener("click", () => {
			MapleCanvas.KeyEvent.atk = true;
		});

		window.addEventListener("keydown", (e) => {
			switch (e.keyCode) {
			case 68: case 39: //→
				MapleCanvas.KeyEvent.migi = true;
				break;
			case 87: case 38:
				MapleCanvas.KeyEvent.ue = true;
				break;
			case 83: case 40:
				MapleCanvas.KeyEvent.sita = true;
				break;
			case 65: case 37:
				MapleCanvas.KeyEvent.hidari = true;
				break;
			case 32:
				MapleCanvas.KeyEvent.jump = true;
				break;
			case 88:
				MapleCanvas.KeyEvent.atk = true;
				break;
			}
		});

		window.addEventListener("keyup", (e) => {
			switch (e.keyCode) {
			case 68: case 39: //→
				MapleCanvas.KeyEvent.migi = false;
				break;
			case 87: case 38:
				MapleCanvas.KeyEvent.ue = false;
				break;
			case 83: case 40:
				MapleCanvas.KeyEvent.sita = false;
				break;
			case 65: case 37:
				MapleCanvas.KeyEvent.hidari = false;
				break;
			case 32:
				MapleCanvas.KeyEvent.jump = false;
				break;
			}
		});
	}
}

class SimpleEbiruai {
	public static WIDTH = 103;
	public static HEIGHT = 63;
	public static SOUTAI_Y0 = MapleCanvas.Y0 + SimpleEbiruai.HEIGHT;
	public personId: string;
	protected ctx: CanvasRenderingContext2D;
	protected image: HTMLImageElement;
	protected isMy: boolean;
	public isAtk: boolean;
	protected myTrains: Train[] = [];
	public isDead: boolean;
	public x: number;
	public y: number;
	public isMigiMuki: boolean;
	constructor(ctx: CanvasRenderingContext2D, option: Zahyou) {
		this.image = option.image;
		this.ctx = ctx;
		this.x = option.x;
		this.y = option.y;
		this.isMigiMuki = option.isMigiMuki;
		this.isMy = option.isMy;
		this.isAtk = option.isAtk;
		this.personId = option.personId;
	}
	public draw() {
		this.action();
		this.image = this.isMigiMuki ? MapleCanvas.images.evilmigi : MapleCanvas.images.evilHidari;
		this.ctx.drawImage(this.image , this.x, MapleCanvas.convY(this.y));
		this.trainDraw();
	}

	protected trainDraw() {
		this.myTrains = this.myTrains.filter(train => !train.isDead);
		this.myTrains.forEach(train => train.draw());
	}
	protected action() {
		if (this.isAtk) {
			this.atk();
		}
	}
	protected atk() {
		this.isAtk = false;
		const train = new Train(this.ctx, {
			image: MapleCanvas.images.densya,
			x: this.x,
			y: this.y - SimpleEbiruai.HEIGHT,
			isMigiMuki: this.isMigiMuki,
			isMy: this.isMy,
			personId: null
		});
		this.myTrains.push(train);
	}
}
class Train extends SimpleEbiruai {
	public static WIDTH = 102;
	public static HEIGHT = 20;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.y = this.y + Train.HEIGHT;
	}
	public draw() {
		this.ctx.drawImage(this.image , this.x, MapleCanvas.convY(this.y));
		this.move();
	}

	private move() {
		this.x += 10 * (this.isMigiMuki ? 1 : -1) ;
		if (this.x < 0 - Train.WIDTH || 800 < this.x) {
			this.isDead = true;
		}
	}
	
}

class Ebiruai extends SimpleEbiruai {
	private jumpF: number;
	private isJump: boolean;
	public atksita: boolean;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.y = this.y + SimpleEbiruai.HEIGHT;
	}
	protected action() {
		if (MapleCanvas.KeyEvent.hidari) {
			this.x -= 5;
			this.isMigiMuki = false;
		}
		if (MapleCanvas.KeyEvent.migi) {
			this.x += 5;
			this.isMigiMuki = true;
		}
		if (MapleCanvas.KeyEvent.jump) {
			if (!this.isJump) {
				this.jumpF = 0;
				this.isJump = true;
			}
		}
		if (this.isJump) {
			this.jumpF ++ ;
			this.y = SimpleEbiruai.SOUTAI_Y0 + 10 * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
		}
		if (this.isJump && this.y < SimpleEbiruai.SOUTAI_Y0) {
			this.y = SimpleEbiruai.SOUTAI_Y0;
			this.isJump = false;
		}
		if (MapleCanvas.KeyEvent.atk && this.myTrains.length < 1) {
			this.atksita = true;
			this.atk();
		}
		MapleCanvas.KeyEvent.atk = false;
	}
}


class Gozzila extends SimpleEbiruai{
	public static WIDTH = 64;
	public static HEIGHT = 64;
	public static BAIRITU = 5;
	public atkTarget: {x: number, y: number};
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		//this.x = this.x - Gozzila.WIDTH * Gozzila.BAIRITU;
		this.y = this.y + Gozzila.HEIGHT * Gozzila.BAIRITU;
	}
	public draw() {
		this.ctx.drawImage(
			this.image,
			this.x, MapleCanvas.convY(this.y),
			Gozzila.WIDTH * Gozzila.BAIRITU,
			Gozzila.HEIGHT * Gozzila.BAIRITU
			);
		this.action();
	}
	protected action() {
		if (this.isAtk) {
			this.atk();
		}
	}
	protected atk() {

	}
}

