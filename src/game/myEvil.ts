import {SimpleEvil, EvilOption} from "./evil";
import {GodzillaMob} from "./GozdillaMob";
import {StatusBar} from "./StatusBar";
import {GamePadComponent} from "./GamePadComponent";
import {MainCanvas} from "./main";
import {WSService} from "../WebSocketService";
import {SocketType, DbUserData, CONST, SkillId} from "../../server/share/share";
import {Effect, EffectType} from "./Effect";
import {SkillComponent} from "./SkillComponent";

export interface MyEvilOption extends EvilOption {
	exp: number;
	name: string;
	dbId: string;
	skills: number[];
}

/** 自分が操作する機能をもつエビルアイ */
export class Ebiruai extends SimpleEvil {
	private static BASE_JUMP = 10;
	private static BASE_SPEED = 5;
	private static EXP_BAIRITU = 1.2;
	private static BASE_EXP = 50;
	private static INIT_MAX_HP = 100;
	private static MAX_ATACK_LENGTH = 3;
	private maxExp: number;
	private jumpF: number;
	private isJumping: boolean;
	private rebirthButton: HTMLButtonElement;
	private statusBar: StatusBar;
	private jumpValue: number;
	private speed: number;
	private rebornTimeCount: number;
	private exp: number;
	private dbId: string;
	private skills: number [];
	constructor(protected ctx: CanvasRenderingContext2D,
				private ws: WSService,
				option: MyEvilOption) {
		super(ctx, option);
		this.exp = option.exp;
		this.maxHp = Ebiruai.INIT_MAX_HP;
		this.jumpValue = Ebiruai.BASE_JUMP;
		this.speed = Ebiruai.BASE_SPEED;
		this.maxExp = this.getMaxExp();
		this.hp = this.maxHp;
		this.initButtons();
		this.initStatusBar();
		this.dbId = option.dbId;
		this.skills = option.skills;
		this.ws.addOnReceiveMsgListener(SocketType.userData, (user: DbUserData) => {
			this.onReceivePersonalData(user);
		});
	}
	public setSkill(skills: number[]) {
		this.skills = skills;
	}
	/** 毎フレーム実行される動作 */
	protected action() {
		this.drawHp();
		if (this.isDead) {
			this.drawRespawnCount();
		} else {
			this.move();
			this.jump();
			this.beforeAtk();
			this.skill();
			this.damegeCalc();
			if (this.hp <= 0) this.deadOnce();
		}
		if (this.isLvUp) {
			Effect.draw(this, EffectType.lvup);
			this.isLvUp = false;
		}
	}

	private initStatusBar() {
		this.statusBar = new StatusBar();
		this.statusBar.addOnNameEditListner((name) => {
			this.name = name;
			this.changeName();
		});
		this.refreshStatusBar();
	}

	private refreshStatusBar() {
		this.statusBar.setExp(this.exp, this.getMaxExp());
		this.statusBar.setLv(this.lv);
		this.statusBar.setName(this.name);
	}

	private initButtons() {
		this.rebirthButton = <HTMLButtonElement> document.querySelector(".hukkatu");
		this.rebirthButton.addEventListener("click", () => {
			if (!this.rebirthButton.classList.contains("disabled")) {
				this.hp = this.maxHp;
				this.isDead = false;
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
		if (user.lv > this.lv) this.isLvUp = true;
		this.lv = user.lv;
		this.exp = user.exp;
		this.refreshStatusBar();
	}

	private damegeCalc() {
		this.hp -= MainCanvas.GOZZILA.calcBeamDmg(this.x, this.x + SimpleEvil.WIDTH, this.y, this.y + SimpleEvil.HEIGHT);
		this.hp -= MainCanvas.GOZZILA.calcSessyokuDmg(this.x, this.y);
	}

	private move() {
		if (GamePadComponent.KeyEvent.hidari) {
			this.x -= this.speed;
			this.isMigi = false;
		}
		if (GamePadComponent.KeyEvent.migi) {
			this.x += this.speed;
			this.isMigi = true;
		}
	}

	private jump() {
		if (GamePadComponent.KeyEvent.jump && !this.isJumping) {
			this.jumpF = 0;
			this.isJumping = true;
		}
		if (this.isJumping) {
			this.jumpF ++ ;
			this.y = MainCanvas.Y0 + this.jumpValue * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
		}
		if (this.isJumping && this.y < MainCanvas.Y0) {
			this.y = MainCanvas.Y0;
			this.isJumping = false;
		}
	}

	private beforeAtk() {
		if (GamePadComponent.KeyEvent.atk && this.myTrains.length < Ebiruai.MAX_ATACK_LENGTH) {
			GamePadComponent.KeyEvent.atk = false;
			super.atk();
			this.isAtk = true;
			this.myTrains[this.myTrains.length - 1].setOnAtked(() => {
				this.ws.send(SocketType.gozzilaDamege);
			});
		}
	}
	private skillInterval = false;
	private skill() {
		this.isHeal = false;
		if (GamePadComponent.KeyEvent.skill1 && !this.skillInterval && this.skills.includes(SkillId.heal)) {
			this.isHeal = true;
			Effect.draw(this, EffectType.heal);
			SkillComponent.SKILL1_BUTTON.classList.add("disabled");
			this.hp += 30;
			if (this.hp > this.maxHp) {
				this.hp = this.maxHp;
			}
			this.skillInterval = true;
			window.setTimeout(() => {
				SkillComponent.SKILL1_BUTTON.classList.remove("disabled");
				this.skillInterval = false;
			}, 1300);
		}
	}

	private drawRespawnCount() {
		if (this.rebornTimeCount >= 0) this.rebornTimeCount--;
		this.ctx.fillStyle = MainCanvas.MOJI_COLOR;
		this.ctx.font = "20px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`死にました。${Math.ceil(this.rebornTimeCount / 30)}秒後に復活ボタンが使用可能になります`, 80, 180);
	}

	/** 死んだとき一度だけ実行される */
	private deadOnce() {
		this.hp = 0;
		this.isDead = true;
		this.rebornTimeCount = MainCanvas.FRAME * 8;
		setTimeout(() => this.rebirthButton.classList.remove("disabled"), 8000);
		this.ws.send(SocketType.dead);
	}

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(this.x + 10, MainCanvas.convY(this.y + SimpleEvil.HEIGHT, 10), 82, 10);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEvil.HEIGHT + 1, 8), 80, 8);
		this.ctx.fillStyle = "#e60c0c";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEvil.HEIGHT + 1, 8), 80 * this.hp / this.maxHp , 8);
	}
	private getMaxExp() {
		return Math.floor(Ebiruai.BASE_EXP * Math.pow(Ebiruai.EXP_BAIRITU, this.lv - 1));
	}

	private changeName() {
		this.ws.send(SocketType.changeName, <DbUserData> {
			name: this.name
		});
	}
}