import {WSService, sendType} from "./WebSocketService";

interface Zahyou {
	personId?: string;
	isMigiMuki: boolean;
	x: number;
	y: number;
}

export class MapleCanvas {
	public static FRAME = 30;
	public static height: number = 500;
	public static width: number = 800;
	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number) {
		return MapleCanvas.height - y;
	}

	private ws: WSService;
	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: Ebiruai;
	private simpleEbiruais: SimpleEbiruai[] = [];
	private befSendData: Zahyou;
	public static KeyEvent = {
		ue: false,
		migi: false,
		sita: false,
		hidari: false,
		jump: false
	};

	constructor(ws: WSService) {
		this.ws = ws;
	}
	public init() {
		this.canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
		this.ctx = this.canvasElm.getContext('2d');
		this.keyset();
		this.loader().then(() => {
			this.ws.addOnReceiveMsgListener((type, value) => {
				if (type !== sendType.zahyou) return;
				const evils = <Zahyou[]> value;
				this.simpleEbiruais = evils.filter(zahyou => zahyou.personId !== this.ws.personId)
				.map(zahyou => new SimpleEbiruai(this.ctx, zahyou));
			});
			this.myEvil = new Ebiruai(this.ctx);
			this.timer = window.setInterval(() => this.draw(), 1000 / MapleCanvas.FRAME);
		});
	}

	/** 画像を読み込む（非同期なのでpromiseで待つ） */
	private loader(): Promise<void> {
		const images = [
			"./assets/ebiruai.png",
			"./assets/ebiruai_.png",
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
			Ebiruai.hidariImg = imageElms[0];
			Ebiruai.migiImg = imageElms[1];
		});
	}


	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, MapleCanvas.width, MapleCanvas.height);
		this.myEvil.draw();
		this.simpleEbiruais.forEach(evil => evil.draw());
		const sendData = {
			isMigiMuki: this.myEvil.isMigiMuki,
			x: this.myEvil.x,
			y: this.myEvil.y
		};
		if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)){
			this.ws.send(sendType.zahyou, sendData);
		}
		this.befSendData = {
			isMigiMuki: this.myEvil.isMigiMuki,
			x: this.myEvil.x,
			y: this.myEvil.y
		};
	}

	private keyset() {
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
	private ctx: CanvasRenderingContext2D;
	private image: HTMLImageElement;
	public x: number;
	public y: number;
	public isMigiMuki: boolean;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		this.image = Ebiruai.hidariImg;
		this.ctx = ctx;
		this.x = zahyou.x;
		this.y = zahyou.y;
		this.isMigiMuki = zahyou.isMigiMuki;
	}

	public draw() {
		this.image = this.isMigiMuki ? Ebiruai.migiImg : Ebiruai.hidariImg;
		this.ctx.drawImage(this.image , this.x, MapleCanvas.convY(this.y));
	}
}

class Ebiruai {
	public static hidariImg: HTMLImageElement;
	public static migiImg: HTMLImageElement;
	private image: HTMLImageElement;
	private ctx: CanvasRenderingContext2D;
	private static y0 = 300;
	public x: number;
	public y: number;
	public isMigiMuki: boolean;
	private jumpF: number;
	private isJump: boolean;
	constructor(ctx: CanvasRenderingContext2D) {
		this.image = Ebiruai.hidariImg;
		this.ctx = ctx;
		this.x = 200;
		this.y = Ebiruai.y0;
	}

	private move() {
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
			this.y = Ebiruai.y0 + 10 * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
		}
		if (this.isJump && this.y < Ebiruai.y0) {
			this.y = Ebiruai.y0;
			this.isJump = false;
		}
	}
	public draw() {
		this.move();
		this.image = this.isMigiMuki ? Ebiruai.migiImg : Ebiruai.hidariImg;
		this.ctx.drawImage(this.image , this.x, MapleCanvas.convY(this.y));
	}
}


