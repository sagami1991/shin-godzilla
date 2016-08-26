import {SimpleUser, SimpleUserModel} from "./SimpleUser";
import {GamePadComponent} from "../component/GamePadComponent";
import {GameMain} from "../main";
import {WSClient} from "../../WebSocketClient";
import {SocketType, DbUserData, CONST, SkillId, MyUserOption} from "../../../../../server/share/share";
import {EffectService} from "../service/EffectService";
import {BaseSkill} from "../skill/BaseSkill";
import {IsEndCoolTimeModel} from "../skill/SkillModel";
import {HealSkill} from "../skill/HealSkill";
import {HestSkill} from "../skill/HestSkill";
import {HbSkill} from "../skill/HbSkill";

export class MyUserModel extends SimpleUserModel {
	get hp() { return this.option.hp; }
	set hp(hp: number) { this.set("hp", hp); }
	get maxHp() { return this.option.maxHp; }
	set maxHp(maxHp: number) { this.set("maxHp", maxHp); }
	get exp() { return this.option.exp; }
	set exp(exp: number) { this.set("exp", exp); }
	get maxExp() { return this.option.maxExp; }
	set maxExp(maxExp: number) { this.set("maxExp", maxExp); }
	get skills() {return this.option.skills; }
	set skills(skills: number[]) { this.option.skills = skills; }
	get speed() { return this.option.speed; }
	set speed(speed: number) { this.set("speed", speed); }
	get jump() { return this.option.jump; }
	set jump(jump: number) { this.set("jump", jump); }
	constructor(protected option: MyUserOption) {
		super(option);
		this.option.maxExp = this.calcMaxExp();
		this.addChangeListener("lv", () => this.maxExp = this.calcMaxExp());
	}
	private calcMaxExp() {
		return Math.floor(CONST.USER.BASE_EXP * Math.pow(CONST.USER.EXP_BAIRITU, this.lv - 1));
	}
}

/** 自分が操作する機能をもつエビルアイ */
export class MyUser extends SimpleUser {
	private jumpF: number;
	private isJumping: boolean;
	private rebirthButton: HTMLButtonElement;
	private rebornTimeCount: number;
	private skills: BaseSkill[];
	constructor(protected ctx: CanvasRenderingContext2D,
				protected effect: EffectService,
				private ws: WSClient,
				public model: MyUserModel,
				private cooltimes: IsEndCoolTimeModel) {
		super(ctx, effect, model);
		this.initButtons();
		this.ws.addOnReceiveMsgListener(SocketType.userData, (user: DbUserData) => {
			this.onReceivePersonalData(user);
		});
		this.skills = [
			new HealSkill(model, cooltimes),
			new HestSkill(model, cooltimes),
			new HbSkill(model, cooltimes)
		];
	}
	public draw() {
		super.draw();
		this.drawHp();
		if (!this.model.isDead) {
			this.move();
			this.jump();
			this.checkPad();
			if (this.model.hp <= 0) this.model.isDead = true; 
		} else {
			this.drawRespawnCount();
		}
	}

	protected dead() {
		super.dead();
		this.model.hp = 0;
		this.rebornTimeCount = CONST.GAME.FPS * 8;
		setTimeout(() => this.rebirthButton.classList.remove("disabled"), 8000);
		this.ws.send(SocketType.dead);
	}

	protected atk() {
		super.atk();
		this.myTrains[this.myTrains.length - 1].setOnAtked(() => {
			this.ws.send(SocketType.gozzilaDamege);
		});
	}

	protected heal() {
		super.heal();
		this.skills[SkillId.heal].execute();
	}

	protected hest() {
		super.hest();
		this.skills[SkillId.hest].execute();
	}

	protected hb() {
		super.hb();
		this.skills[SkillId.hb].execute();
	}

	private initButtons() {
		this.rebirthButton = <HTMLButtonElement> document.querySelector(".hukkatu");
		this.rebirthButton.addEventListener("click", () => {
			if (!this.rebirthButton.classList.contains("disabled")) {
				this.model.hp = this.model.maxHp;
				this.model.isDead = false;
				this.rebirthButton.classList.add("disabled");
			}
		});
		document.querySelector(".reset-button").addEventListener("click", () => {
			if (window.confirm("レベルが1に戻ります。元に戻せませんがよろしいですか？")) {
				this.ws.send(SocketType.resetLv);
			}
		});
	}

	private onReceivePersonalData(user: DbUserData) {
		this.model.lv = user.lv;
		this.model.exp = user.exp;
	}


	private move() {
		if (GamePadComponent.KeyEvent.hidari) {
			this.model.x -= this.model.speed;
			this.model.isMigi = false;
		}
		if (GamePadComponent.KeyEvent.migi) {
			this.model.x += this.model.speed;
			this.model.isMigi = true;
		}
	}

	private jump() {
		if (GamePadComponent.KeyEvent.jump && !this.isJumping) {
			this.jumpF = 0;
			this.isJumping = true;
		}
		if (this.isJumping) {
			this.jumpF ++ ;
			this.model.y = CONST.CANVAS.Y0 + this.model.jump * this.jumpF - 0.54 * 1 * Math.pow(this.jumpF, 2);
		}
		if (this.isJumping && this.model.y < CONST.CANVAS.Y0) {
			this.model.y = CONST.CANVAS.Y0;
			this.isJumping = false;
		}
	}

	private checkPad() {
		this.model.isAtk = false;
		this.model.isHeal = false;
		this.model.isHest = false;
		this.model.isHb = false;
		const pad = GamePadComponent.KeyEvent;
		if (pad.atk && this.myTrains.length < CONST.USER.MAX_ATK) {
			pad.atk = false;
			this.model.isAtk = true;
		} else if (pad.skill_0 && this.cooltimes.get(0) && this.model.skills.includes(0)) {
			pad.skill_0 = false;
			this.model.isHeal = true;
		} else if (pad.skill_1 && this.cooltimes.get(1) && this.model.skills.includes(1)) {
			pad.skill_1 = false;
			this.model.isHest = true;
		} else if (pad.skill_2 && this.cooltimes.get(2) && this.model.skills.includes(2)) {
			pad.skill_2 = false;
			this.model.isHb = true;
		}
	}

	private drawRespawnCount() {
		if (this.rebornTimeCount >= 0) this.rebornTimeCount--;
		this.ctx.fillStyle = CONST.CANVAS.MOJI_COLOR;
		this.ctx.font = "20px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`死にました。${Math.ceil(this.rebornTimeCount / 30)}秒後に復活ボタンが使用可能になります`, 80, 180);
	}

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(this.model.x + 10, GameMain.convY(this.model.y + MyUserModel.HEIGHT, 10), 82, 10);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(this.model.x + 10 + 1, GameMain.convY(this.model.y + MyUserModel.HEIGHT + 1, 8), 80, 8);
		this.ctx.fillStyle = "#e60c0c";
		this.ctx.fillRect(this.model.x + 10 + 1, GameMain.convY(this.model.y + MyUserModel.HEIGHT + 1, 8), 80 * this.model.hp / this.model.maxHp , 8);
	}
}