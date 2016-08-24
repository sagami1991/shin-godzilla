import {SimpleUser} from "./SimpleUser";
import {MyUserModel} from "../myuser/UserModel";
import {StatusBarComponent} from "../component/StatusBarComponent";
import {GamePadComponent} from "../component/GamePadComponent";
import {GameMain} from "../main";
import {WSClient} from "../../WebSocketClient";
import {SocketType, DbUserData, CONST, SkillId} from "../../../../../server/share/share";
import {EffectService, EffectType} from "../service/EffectService";
import {SkillComponent} from "../component/SkillComponent";


/** 自分が操作する機能をもつエビルアイ */
export class MyUser extends SimpleUser {
	private static BASE_JUMP = 10;
	private static BASE_SPEED = 5;
	private static EXP_BAIRITU = 1.2;
	private static BASE_EXP = 50;
	private static INIT_MAX_HP = 100;
	private static MAX_ATACK_LENGTH = 3;
	public onLvUpListener: (lv: number, skills: number[]) => void;
	private maxExp: number;
	private jumpF: number;
	private isJumping: boolean;
	private rebirthButton: HTMLButtonElement;
	private statusBar: StatusBarComponent;
	private jumpValue: number;
	private speed: number;
	private rebornTimeCount: number;
	private exp: number;
	private dbId: string;
	private skills: number [];
	constructor(protected ctx: CanvasRenderingContext2D,
				protected effect: EffectService,
				private ws: WSClient,
				private model: MyUserModel) {
		super(ctx, effect, option);
		this.exp = option.exp;
		this.maxHp = MyUser.INIT_MAX_HP;
		this.jumpValue = MyUser.BASE_JUMP;
		this.speed = MyUser.BASE_SPEED;
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

	public setSkill(skills: SkillId[]) {
		this.skills = skills;
	};

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
			this.effect.draw(this, EffectType.lvup);
			this.isLvUp = false;
		}
	}

	private initStatusBar() {
		this.statusBar = new StatusBarComponent();
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
		if (user.lv > this.lv) {
			this.isLvUp = true;
			this.onLvUpListener(user.lv, this.skills);
		}
		this.lv = user.lv;
		this.exp = user.exp;
		this.refreshStatusBar();
	}

	private damegeCalc() {
		this.hp -= GameMain.GOZZILA.calcBeamDmg(this.x, this.x + SimpleUser.WIDTH, this.y, this.y + SimpleUser.HEIGHT);
		this.hp -= GameMain.GOZZILA.calcSessyokuDmg(this.x, this.y);
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
			this.y = GameMain.Y0 + this.jumpValue * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
		}
		if (this.isJumping && this.y < GameMain.Y0) {
			this.y = GameMain.Y0;
			this.isJumping = false;
		}
	}

	private beforeAtk() {
		if (GamePadComponent.KeyEvent.atk && this.myTrains.length < MyUser.MAX_ATACK_LENGTH) {
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
			this.effect.draw(this, EffectType.heal);
			SkillComponent.SKILL1_BUTTON.classList.add("disabled");
			this.hp += 10;
			if (this.hp > this.maxHp) {
				this.hp = this.maxHp;
			}
			this.skillInterval = true;
			window.setTimeout(() => {
				SkillComponent.SKILL1_BUTTON.classList.remove("disabled");
				this.skillInterval = false;
			}, 1400);
		}
	}

	private drawRespawnCount() {
		if (this.rebornTimeCount >= 0) this.rebornTimeCount--;
		this.ctx.fillStyle = GameMain.MOJI_COLOR;
		this.ctx.font = "20px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`死にました。${Math.ceil(this.rebornTimeCount / 30)}秒後に復活ボタンが使用可能になります`, 80, 180);
	}

	/** 死んだとき一度だけ実行される */
	private deadOnce() {
		this.hp = 0;
		this.isDead = true;
		this.rebornTimeCount = GameMain.FRAME * 8;
		setTimeout(() => this.rebirthButton.classList.remove("disabled"), 8000);
		this.ws.send(SocketType.dead);
	}

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(this.x + 10, GameMain.convY(this.y + SimpleUser.HEIGHT, 10), 82, 10);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(this.x + 10 + 1, GameMain.convY(this.y + SimpleUser.HEIGHT + 1, 8), 80, 8);
		this.ctx.fillStyle = "#e60c0c";
		this.ctx.fillRect(this.x + 10 + 1, GameMain.convY(this.y + SimpleUser.HEIGHT + 1, 8), 80 * this.hp / this.maxHp , 8);
	}
	private getMaxExp() {
		return Math.floor(MyUser.BASE_EXP * Math.pow(MyUser.EXP_BAIRITU, this.lv - 1));
	}

	private changeName() {
		this.ws.send(SocketType.changeName, <DbUserData> {
			name: this.name
		});
	}
}