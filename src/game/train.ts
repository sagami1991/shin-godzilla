import {MainCanvas} from "./main";
import {GodzillaMob} from "./GozdillaMob";
import {BaseMonster, BaseMobOption} from "./BaseMonster";
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
	private beginX: number;
	private bakuhatuCount: number;
	private onBakuhatu: Array<() => void> = [];
	constructor(ctx: CanvasRenderingContext2D, option: BaseMobOption) {
		super(ctx, option);
		this.image = ImageLoader.IMAGES.densya,
		this.mode = TrainMode.ikiteru;
		this.beginX = this.x;
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
			this.x += 10 * (this.isMigi ? 1 : -1) ;
			this.isDead = this.x < 0 - Train.WIDTH || 800 < this.x;
			if (Math.abs(this.beginX - this.x) > 400) {
				this.isDead = true;
				this.mode = this.mode = TrainMode.sibou;
			}
			if ( MainCanvas.GOZZILA.x + 100 < this.x ) {
				this.mode = TrainMode.bakuhatu;
				this.image = ImageLoader.IMAGES.bakuhatu;
				this.bakuhatuCount = MainCanvas.FRAME * Train.BAKUHATU_SEC;
				this.onBakuhatu.forEach(cb => cb());
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