import {MainCanvas, Zahyou} from "./canvas";
import {Gozzila} from "./gozzila";
import {BaseMonster} from "./BaseMonster";
import {ImageLoader} from "./ImageLoader";

enum TrainMode {
	ikiteru,
	bakuhatu,
	sibou
}

/** 攻撃時出現する電車 */
export class Train extends BaseMonster {
	public static WIDTH = 102;
	public static HEIGHT = 20;
	private static BAKUHATU_SEC = 0.5;
	private mode: number;
	private gozzila: Gozzila;
	private bakuhatuCount: number;
	private onBakuhatu: Array<() => void> = [];
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.gozzila = MainCanvas.GOZZILA;
		this.mode = TrainMode.ikiteru;
	}
	public setOnAtked(callback: () => void) {
		this.onBakuhatu.push(callback);
	}
	public draw() {
		this.ctx.drawImage(this.image , this.x, MainCanvas.convY(this.y, Train.HEIGHT));
		this.move();
	}

	private move() {
		switch (this.mode) {
		case TrainMode.ikiteru:
			this.x += 10 * (this.isMigiMuki ? 1 : -1) ;
			this.isDead = this.x < 0 - Train.WIDTH || 800 < this.x;
			if (this.gozzila.x + 100 < this.x ) {
				this.mode = TrainMode.bakuhatu;
				this.image = ImageLoader.IMAGES.bakuhatu;
				this.bakuhatuCount = MainCanvas.FRAME * Train.BAKUHATU_SEC;
				if (this.isMy) {
					this.gozzila.isDamege = true;
				}
			}
			break;
		case TrainMode.bakuhatu:
			this.bakuhatuCount --;
			if (this.bakuhatuCount <= 0) {
				this.isDead = true;
				this.mode = TrainMode.sibou;
				this.onBakuhatu.forEach(cb => cb());
			}
			break;
		default:
			break;
		}
	}
}