import {GameMain} from "../main";
import {Train} from "./train";
import {ImageLoader} from "../ImageLoader";
import {EffectService, EffectType} from "../service/EffectService";
import {MasterEvilData} from "../../../../../server/share/share";
import {Observable} from "../model/Observable";

export class SimpleUserModel extends Observable<MasterEvilData>{
	public static WIDTH = 103;
	public static HEIGHT = 63;
	get pid() { return this.option.pid; }
	get name() { return this.option.name; }
	set name(name: string) {
		this.option.name = name;
	}
	get lv() { return this.option.lv; }
	set lv(lv: number) {
		const old = this.option.lv;
		this.option.lv = lv;
		this.onChange("lv", old, lv);
	}
	get x() { return this.option.x; }
	set x(x: number) {
		this.option.x = x;
	}
	get y() { return this.option.y; }
	set y(y: number) {
		this.option.y = y;
	}
	get isMigi() { return this.option.isMigi; }
	set isMigi(isMigi: boolean) {
		this.option.isMigi = isMigi;
	}
	set isAtk(isAtk: boolean) {
		const old = this.option.isAtk;
		this.option.isAtk = isAtk;
		this.onChange("isAtk", old, isAtk);
	}
	get isDead() {return this.option.isDead; }
	set isDead(isDead: boolean) {
		const old = this.option.isDead;
		this.option.isDead = isDead;
		this.onChange("isDead", old, isDead);
	}
	set isLvUp(isLvUp: boolean) {this.option.isLvUp = isLvUp; }
	set isHeal(isHeal: boolean) {
		const old = this.option.isHeal;
		this.option.isHeal = isHeal;
		this.onChange("isHeal", old, isHeal);
	}
	set isHest(isHest: boolean) {
		const old = this.option.isHest;
		this.option.isHest = isHest;
		this.onChange("isHest", old, isHest);
	}
	set isHb(isHb: boolean) {
		const old = this.option.isHb;
		this.option.isHb = isHb;
		this.onChange("isHb", old, isHb);
	}
}

/** 人間が操作する機能の入っていないエビルアイ */
export class SimpleUser {
	protected myTrains: Train[] = [];
	protected image: HTMLImageElement;
	constructor(
		protected ctx: CanvasRenderingContext2D,
		protected effect: EffectService,
		public model: SimpleUserModel) {
		this.image = ImageLoader.IMAGES.evilHidari;
		this.model.addChangeListener("isMigi", (isMigi: boolean) => this.changeDirection(isMigi));
		this.model.addChangeListener("isDead", (isDead: boolean) => isDead ? this.dead() : this.changeDirection(this.model.isMigi));
		this.model.addChangeListener("isAtk", (isAtk: boolean) => isAtk ? this.atk() : null);
		this.model.addChangeListener("isLvUp", (isLvUp: boolean) => isLvUp ? this.lvUp() : null);
		this.model.addChangeListener("isHeal", (isHeal: boolean) => isHeal ? this.heal() : null);
		this.model.addChangeListener("isHest", (isHest: boolean) => isHest ? this.hest() : null);
		this.model.addChangeListener("isHb", (isHb: boolean) => isHb ? this.hb() : null);
	}

	public draw() {
		this.ctx.drawImage(this.image , this.model.x, GameMain.convY(this.model.y, SimpleUserModel.HEIGHT));
		this.drawTrain();
		this.drawLv();
	}

	protected dead() {
		this.image = ImageLoader.IMAGES.evilSinda;
	}

	protected atk() {
		this.model.isAtk = false;
		const train = new Train(this.ctx, {
			x: this.model.x,
			y: this.model.y,
			isMigi: this.model.isMigi,
		});
		this.myTrains.push(train);
	}

	private changeDirection(isMigi: boolean) {
		this.image = isMigi ? ImageLoader.IMAGES.evilmigi : ImageLoader.IMAGES.evilHidari;
	}

	private lvUp() {
		this.model.isLvUp = false;
		this.effect.draw(this.model, EffectType.lvup);
	}

	private heal() {
		this.model.isHeal = false;
		this.effect.draw(this.model, EffectType.heal);
	}

	private hest() {
		this.model.isHest = false;
		this.effect.draw(this.model, EffectType.heal);
	}

	private hb() {
		this.model.isHb = false;
		this.effect.draw(this.model, EffectType.heal);
	}

	private drawLv() {
		this.ctx.fillStyle = GameMain.MOJI_COLOR;
		this.ctx.font = "14px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`${this.model.name} Lv ${this.model.lv}`, this.model.x + 34, GameMain.convY(this.model.y - 10, 0));
	}

	private drawTrain() {
		this.myTrains = this.myTrains.filter(train => !train.isDead);
		this.myTrains.forEach(train => train.draw());
	}
}