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
	private mode: number;
	private gozzila: Gozzila;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.gozzila = MainCanvas.GOZZILA;
		this.mode = TrainMode.ikiteru;
	}

	public draw() {
		this.ctx.drawImage(this.image , this.x, MainCanvas.convY(this.y + Train.HEIGHT));
		this.move();
	}

	private move() {
		if (this.mode === TrainMode.ikiteru) {
			this.x += 10 * (this.isMigiMuki ? 1 : -1) ;
		}
		if (this.x < 0 - Train.WIDTH || 800 < this.x) {
			this.isDead = true;
		}
		if (this.gozzila.x < this.x + Train.WIDTH ) {
			this.mode = TrainMode.bakuhatu;
		}
	}
}