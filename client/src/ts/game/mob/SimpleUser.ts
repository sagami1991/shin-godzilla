import {GameMain} from "../main";
import {Train} from "./train";
import {BaseMob, BaseMobOption} from "./BaseMob";
import {ImageLoader} from "../ImageLoader";
import {EffectService, EffectType} from "../service/EffectService";
import {MasterEvilData} from "../../../../../server/share/share";

export interface SimpleUserOption {
	pid: string;
	name: string;
	lv: number;
	x: number;
	y: number;
	isMigi: boolean;
	isAtk: boolean;
	isDead: boolean;
	isLvUp: boolean;
	isHeal: boolean;
	isHest: boolean;
	isHb: boolean;
}

export class SimpleUserModel {
	private changeListeners: {[prop: string]: Array<(value: any) => void>};

	constructor(protected option: SimpleUserOption) {

	}
	get isMigi() {
		return this.option.isMigi;
	}
	public setProperties(info: MasterEvilData) {
		Object.keys(info).forEach(key => {
			if ((<any>this.option)[key] !== (<any>info)[key]) {
				(<any>this.option)[key] = (<any>info)[key];
				if (this.changeListeners[key]) {
					this.changeListeners[key].forEach(cb => cb((<any>info)[key]));
				}
			}
		});
	}

	public addChangeListener(pName: string, cb: (value: any) => void) {
		if (!this.changeListeners[pName]) {
			this.changeListeners[pName] = [];
		}
		this.changeListeners[pName].push(cb);
	}
}

/** 人間が操作する機能の入っていないエビルアイ */
export class SimpleUser {
	public static WIDTH = 103;
	public static HEIGHT = 63;
	protected myTrains: Train[] = [];
	protected image: HTMLImageElement;
	constructor(
		protected ctx: CanvasRenderingContext2D,
		protected effect: EffectService,
		protected model: SimpleUserModel) {
		this.image = ImageLoader.IMAGES.evilHidari;
		this.model.addChangeListener("isMigi", (isMigi: boolean) => this.changeImage(isMigi));
		this.model.addChangeListener("isDead", (isDead: boolean) => this.changeAlive(isDead));
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

	private changeImage(isMigi: boolean) {
		this.image = isMigi ? ImageLoader.IMAGES.evilmigi : ImageLoader.IMAGES.evilHidari;
	}

	private changeAlive(isDead: boolean) {
		if (isDead) {
			this.image = ImageLoader.IMAGES.evilSinda;
		} else {
			this.changeImage(this.model.isMigi);
		}
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