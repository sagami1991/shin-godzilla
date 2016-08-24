import {GameMain} from "../main";
import {Train} from "./train";
import {BaseMob, BaseMobOption} from "./BaseMob";
import {ImageLoader} from "../ImageLoader";
import {EffectService, EffectType} from "../Effect";
import {MasterEvilData} from "../../../../../server/share/share";

export interface SimpleUserOption extends BaseMobOption {
	lv: number;
	isDead: boolean;
	isAtk: boolean;
	pid: string;
	name: string;
}

/** 人間が操作する機能の入っていないエビルアイ */
export class SimpleUser extends BaseMob {
	public static WIDTH = 103;
	public static HEIGHT = 63;
	public pid: string;
	public isAtk: boolean;
	public isHeal: boolean;
	protected myTrains: Train[] = [];
	public lv: number;
	public isLvUp: boolean;
	public name: string;
	constructor(protected ctx: CanvasRenderingContext2D, protected effect: EffectService, option: SimpleUserOption) {
		super(ctx, option);
		this.image = ImageLoader.IMAGES.evilHidari;
		this.lv = option.lv;
		this.isDead = option.isDead;
		this.isAtk = option.isAtk;
		this.pid = option.pid;
		this.isLvUp = false;
		this.name = option.name;
	}
	public draw() {
		this.action();
		this.image = this.isDead ? 	ImageLoader.IMAGES.evilSinda :
					 this.isMigi ? 	ImageLoader.IMAGES.evilmigi :
									ImageLoader.IMAGES.evilHidari;
		this.ctx.drawImage(this.image , this.x, GameMain.convY(this.y, SimpleUser.HEIGHT));
		this.trainDraw();
		this.drawLv();
	}

	public setPersonInfo(info: MasterEvilData) {
		Object.keys(info).forEach(key => {
			if ((<any>info)[key] !== undefined) {
				(<any>this)[key] = (<any>info)[key];
			}
		});
	}

	protected action() {
		if (this.isAtk) {
			this.atk();
		}
		if (this.isLvUp) {
			this.effect.draw(this, EffectType.lvup);
			this.isLvUp = false;
		}

		if (this.isHeal) {
			this.effect.draw(this, EffectType.heal);
			this.isHeal = false;
		}
	}
	protected atk() {
		this.isAtk = false;
		const train = new Train(this.ctx, {
			x: this.x,
			y: this.y,
			isMigi: this.isMigi,
		});
		this.myTrains.push(train);
	}

	private drawLv() {
		this.ctx.fillStyle = GameMain.MOJI_COLOR;
		this.ctx.font = "14px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`${this.name} Lv ${this.lv}`, this.x + 34, GameMain.convY(this.y - 10, 0));
	}
	private trainDraw() {
		this.myTrains = this.myTrains.filter(train => !train.isDead);
		this.myTrains.forEach(train => train.draw());
	}
}