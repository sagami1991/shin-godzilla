import {SimpleUser, SimpleUserModel} from "./SimpleUser";
import {StatusBarComponent} from "../component/StatusBarComponent";
import {GamePadComponent} from "../component/GamePadComponent";
import {GameMain} from "../main";
import {WSClient} from "../../WebSocketClient";
import {SocketType, DbUserData, CONST, SkillId, MasterEvilData} from "../../../../../server/share/share";
import {EffectService, EffectType} from "../service/EffectService";
import {SkillComponent} from "../component/SkillComponent";
import {BaseSkill} from "../skill/BaseSkill";

export interface MyUserOption extends MasterEvilData {
	dbId: string;
	hp: number;
	maxHp: number;
	exp: number;
	maxExp: number;
	skills: number[];
	jump: number;
	speed: number;
}

export class MyUserModel extends SimpleUserModel {
	get hp() { return this.option.hp; }
	set hp(hp: number) {
		const old = this.option.hp;
		this.option.hp = hp;
		this.onChange("hp", old, hp);
	}
	get maxHp() { return this.option.maxHp; }
	get exp() { return this.option.exp; }
	set exp(exp: number) {
		const old = this.option.exp;
		this.option.exp = exp;
		this.onChange("exp", old, exp);
	}
	get maxExp() { return this.option.maxExp; }
	constructor(protected option: MyUserOption) {
		super(option);
		this.option.maxExp = this.calcMaxExp();
	}
	get skills() {return this.option.skills; }
	set skills(skills: number[]) {
		this.option.skills = skills;
	}
	private calcMaxExp() {
		return Math.floor(CONST.USER.BASE_EXP * Math.pow(CONST.USER.EXP_BAIRITU, this.lv - 1));
	}
}

/** 自分が操作する機能をもつエビルアイ */
export class MyUser extends SimpleUser {
	private static MAX_ATACK_LENGTH = 3;
	private jumpF: number;
	private isJumping: boolean;
	private rebirthButton: HTMLButtonElement;
	private jumpValue: number;
	private speed: number;
	private rebornTimeCount: number;
	constructor(protected ctx: CanvasRenderingContext2D,
				protected effect: EffectService,
				private ws: WSClient,
				public model: MyUserModel) {
		super(ctx, effect, model);
		this.initButtons();
		this.ws.addOnReceiveMsgListener(SocketType.userData, (user: DbUserData) => {
			this.onReceivePersonalData(user);
		});
	}
	public draw() {
		super.draw();
		this.drawHp();
		if (!this.model.isDead) {
			this.move();
			this.jump();
			this.checkAtk();
		} else {
			this.drawRespawnCount();
		}
	}

	protected dead() {
		super.dead();
		this.model.hp = 0;
		this.rebornTimeCount = GameMain.FRAME * 8;
		setTimeout(() => this.rebirthButton.classList.remove("disabled"), 8000);
		this.ws.send(SocketType.dead);
	}

	protected atk() {
		super.atk();
		this.myTrains[this.myTrains.length - 1].setOnAtked(() => {
			this.ws.send(SocketType.gozzilaDamege);
		});
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
			this.model.x -= this.speed;
			this.model.isMigi = false;
		}
		if (GamePadComponent.KeyEvent.migi) {
			this.model.y += this.speed;
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
			this.model.y = GameMain.Y0 + this.jumpValue * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
		}
		if (this.isJumping && this.model.y < GameMain.Y0) {
			this.model.y = GameMain.Y0;
			this.isJumping = false;
		}
	}

	private checkAtk() {
		this.model.isAtk = false;
		this.model.isHeal = false;
		this.model.isHest = false;
		this.model.isHb = false;
		const pad = GamePadComponent.KeyEvent;
		if (pad.atk && this.myTrains.length < MyUser.MAX_ATACK_LENGTH) {
			pad.atk = false;
			this.model.isAtk = true;
		} else if (pad.skill_0) {
			this.model.isHeal = true;
		} else if (pad.skill_1) {
			this.model.isHest = true;
		} else if (pad.skill_2) {
			this.model.isHb = true;
		}
	}

	private drawRespawnCount() {
		if (this.rebornTimeCount >= 0) this.rebornTimeCount--;
		this.ctx.fillStyle = GameMain.MOJI_COLOR;
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