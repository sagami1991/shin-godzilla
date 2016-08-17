import {MainCanvas, Zahyou} from "./main";
import {Train} from "./train";
import {BaseMonster, BaseMobOption} from "./BaseMonster";
import {ImageLoader} from "./ImageLoader";

export interface EvilOption extends BaseMobOption {
	lv: number;
	isDead?: boolean;
	isAtk?: boolean;
	personId: string;
}

/** 人間が操作する機能の入っていないエビルアイ */
export class SimpleEvil extends BaseMonster {
	public static WIDTH = 103;
	public static HEIGHT = 63;
	public personId: string;
	public isAtk: boolean;
	protected myTrains: Train[] = [];
	public lv: number;
	constructor(ctx: CanvasRenderingContext2D, option: EvilOption) {
		super(ctx, option);
		this.lv = option.lv;
		this.isDead = option.isDead;
		this.isAtk = option.isAtk;
		this.personId = option.personId;
	}
	public draw() {
		this.action();
		this.image = this.isDead ? 		ImageLoader.IMAGES.evilSinda :
					 this.isMigiMuki ? 	ImageLoader.IMAGES.evilmigi :
										ImageLoader.IMAGES.evilHidari;
		this.ctx.drawImage(this.image , this.x, MainCanvas.convY(this.y, SimpleEvil.HEIGHT));
		this.trainDraw();
		this.lvDraw();
	}
	protected action() {
		if (this.isAtk) {
			this.atk();
		}
	}
	protected atk() {
		this.isAtk = false;
		const train = new Train(this.ctx, {
			image: ImageLoader.IMAGES.densya,
			x: this.x,
			y: this.y,
			isMigiMuki: this.isMigiMuki,
			isMy: this.isMy
		});
		this.myTrains.push(train);
	}
	private lvDraw() {
		this.ctx.fillStyle = "black";
		this.ctx.font = "14px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`Lv ${this.lv}`, this.x + 34, MainCanvas.convY(this.y - 10, 0));
	}
	private trainDraw() {
		this.myTrains = this.myTrains.filter(train => !train.isDead);
		this.myTrains.forEach(train => train.draw());
	}
}