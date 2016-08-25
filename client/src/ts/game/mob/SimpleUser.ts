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
	set name(name: string) { this.option.name = name; }
	get lv() { return this.option.lv; }
	set lv(lv: number) { this.set("lv", lv); }
	get x() { return this.option.x; }
	set x(x: number) { this.option.x = x; }
	get y() { return this.option.y; }
	set y(y: number) { this.option.y = y; }
	get isMigi() { return this.option.isMigi; }
	set isMigi(isMigi: boolean) { this.set("isMigi", isMigi); }
	get isAtk() { return this.option.isAtk; }
	set isAtk(isAtk: boolean) { this.set("isAtk", isAtk); }
	get isDead() {return this.option.isDead; }
	set isDead(isDead: boolean) { this.set("isDead", isDead); }
	get isLvUp() { return this.option.isLvUp; }
	set isLvUp(isLvUp: boolean) { this.option.isLvUp = isLvUp; }
	get isHeal() { return this.option.isHeal; }
	set isHeal(isHeal: boolean) { this.set("isHeal", isHeal); }
	get isHest() { return this.option.isHest; }
	set isHest(isHest: boolean) { this.set("isHest", isHest); }
	get isHb() { return this.option.isHb; }
	set isHb(isHb: boolean) { this.set("isHb", isHb); }
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
		const train = new Train(this.ctx, {
			x: this.model.x,
			y: this.model.y,
			isMigi: this.model.isMigi,
		});
		this.myTrains.push(train);
	}

	protected heal() {
		this.effect.draw(this.model, EffectType.heal);
	}

	protected hest() {
		this.effect.draw(this.model, EffectType.hest);
	}

	protected hb() {
		this.effect.draw(this.model, EffectType.hb);
	}

	private changeDirection(isMigi: boolean) {
		this.image = isMigi ? ImageLoader.IMAGES.evilmigi : ImageLoader.IMAGES.evilHidari;
	}

	private lvUp() {
		this.model.isLvUp = false;
		this.effect.draw(this.model, EffectType.lvup);
	}

	private drawLv() {
		this.ctx.fillStyle = GameMain.MOJI_COLOR;
		this.ctx.font = "14px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`${this.model.name} Lv ${this.model.lv}`, this.model.x + 20, GameMain.convY(this.model.y - 10, 0));
	}

	private drawTrain() {
		this.myTrains = this.myTrains.filter(train => !train.isDead);
		this.myTrains.forEach(train => train.draw());
	}
}