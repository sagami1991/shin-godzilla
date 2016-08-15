import {MainCanvas, Zahyou} from "./canvas";
import {Gozzila} from "./gozzila";
import {BaseMonster} from "./BaseMonster";

enum TrainMode {
	ikiteru,
	bakuhatu,
	sibou
}

export class Train extends BaseMonster {
	public static WIDTH = 102;
	public static HEIGHT = 20;
	private static BAKUHATU_SEC = 0.5;
	private mode: number;
	private gozzila: Gozzila;
	private bakuhatuCount: number;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.gozzila = MainCanvas.GOZZILA;
		this.mode = TrainMode.ikiteru;
	}

	public draw() {
		this.ctx.drawImage(this.image , this.x, MainCanvas.convY(this.y, Train.HEIGHT));
		this.move();
	}

	private move() {
		switch (this.mode) {
		case TrainMode.ikiteru:
			this.x += 10 * (this.isMigiMuki ? 1 : -1) ;
			if (this.x < 0 - Train.WIDTH || 800 < this.x) {
				this.isDead = true;
			}
			if (this.gozzila.x + 100 < this.x ) {
				this.mode = TrainMode.bakuhatu;
				this.image = MainCanvas.images.bakuhatu;
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
			}
			break;
		default:
			break;
		}
	}
}