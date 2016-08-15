import {MainCanvas, Zahyou} from "./canvas";
import {Train} from "./train";
import {BaseMonster} from "./BaseMonster";

export class SimpleEbiruai extends BaseMonster {
	public static WIDTH = 103;
	public static HEIGHT = 63;
	public personId: string;
	public isAtk: boolean;
	protected myTrains: Train[] = [];
	constructor(ctx: CanvasRenderingContext2D, option: Zahyou) {
		super(ctx, option);
		this.isAtk = option.isAtk;
		this.personId = option.personId;
	}
	public draw() {
		this.action();
		this.image = this.isDead ? 		MainCanvas.images.evilSinda :
					 this.isMigiMuki ? 	MainCanvas.images.evilmigi :
										MainCanvas.images.evilHidari;
		this.ctx.drawImage(this.image , this.x, MainCanvas.convY(this.y, SimpleEbiruai.HEIGHT));
		this.trainDraw();
	}

	private trainDraw() {
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
			image: MainCanvas.images.densya,
			x: this.x,
			y: this.y,
			isMigiMuki: this.isMigiMuki,
			isMy: this.isMy,
			personId: null
		});
		this.myTrains.push(train);
	}
}