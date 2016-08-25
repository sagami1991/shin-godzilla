import {GameMain} from "../main";
import {BaseMob, BaseMobOption} from "./BaseMob";
import {ImageLoader} from "../ImageLoader";
import {GodzillaMode, GodzillaInfo, CONST} from "../../../../../server/share/share";
import {MyUserModel} from "./MyUser";

export class GodzillaMob extends BaseMob {
	private static WIDTH = 64;
	private static HEIGHT = 64;
	private static BAIRITU = 5;
	private static MAX_HP = 4000;
	private static HP_BAR = {
		X: 30,
		Y: 10,
		WIDTH: 500,
		HEIGHT: 20
	};
	private static BEAM_DMG = 1.3;
	private static SESSYOKU_DMG = 12;
	private target: {x: number, y: number}[];
	private mode: number;
	/** ビームが発射される座標*/
	private begin: {x: number, y: number}[];
	private beamFrame = 0;
	constructor(ctx: CanvasRenderingContext2D, option: BaseMobOption, private userModel: MyUserModel) {
		super(ctx, option);
		this.image = ImageLoader.IMAGES.gozzila;
		this.x = 550;
		this.y = CONST.CANVAS.Y0;
		this.begin = [
			{x: this.x + 14 * GodzillaMob.BAIRITU, y: this.y + 50 * GodzillaMob.BAIRITU},
			{x: this.x + 34 * GodzillaMob.BAIRITU, y: this.y + 61 * GodzillaMob.BAIRITU},
		];
		this.maxHp = GodzillaMob.MAX_HP;
		this.target = [];
	}

	public setGodzilaInfo(info: GodzillaInfo) {
		if (!info) return;
		if (info.hp !== undefined) this.hp = info.hp;
		if (info.mode !== undefined) this.mode = info.mode;
		if (info.target) {
			info.target.forEach((target, i) => {
				if (target) this.target[i] = {
					x: target.x !== undefined ? target.x : this.target[i].x,
					y: target.y  !== undefined ? target.y : this.target[i].y
				};
			});
		}
	}
	public draw() {
		this.ctx.drawImage(
			this.image,
			this.x,
			GameMain.convY(this.y, GodzillaMob.HEIGHT * GodzillaMob.BAIRITU),
			GodzillaMob.WIDTH * GodzillaMob.BAIRITU,
			GodzillaMob.HEIGHT * GodzillaMob.BAIRITU
			);
		this.drawHp();
		this.action();
	}

	/** ビームによるダメージ計算 */
	private calcBeamDmg(x0: number, x1: number,  y0: number, y1: number) {
		if (this.mode !== GodzillaMode.atk) return 0;
		let count = 0;
		this.target.forEach((target, i) => {
			const ya = (target.y - this.begin[i].y) * (x0 - this.begin[i].x) / (target.x - this.begin[i].x) + this.begin[i].y;
			const yb = (target.y - this.begin[i].y) * (x1 - this.begin[i].x) / (target.x - this.begin[i].x) + this.begin[i].y;
			const xa = (target.x - this.begin[i].x) * (y0 - this.begin[i].y) / (target.y - this.begin[i].y) + this.begin[i].x;
			const xb = (target.x - this.begin[i].x) * (y1 - this.begin[i].y) / (target.y - this.begin[i].y) + this.begin[i].x;
			if ((y0 <= ya && ya <= y1) || (y0 <= yb && yb <= y1) || (x0 <= xa && xa <= x1) || (x0 <= xb && xb <= x1)) {
				count ++;
			} ;
		});
		return count * GodzillaMob.BEAM_DMG;
	}

	/** 接触ダメージ */
	private calcSessyokuDmg(x: number, y: number): number {
		return this.mode !== GodzillaMode.dead && this.x + 5 <= x ? GodzillaMob.SESSYOKU_DMG : 0;
	}

	private drawBeam() {
		this.beamFrame += 1 / 4;
		this.target.forEach((target, i) => {
			const beamImg = ImageLoader.ANIME_IMAGE.beam[Math.floor(this.beamFrame)];
			const begin = this.begin[i];
			const angle = Math.PI / 2 + Math.atan2(begin.x - target.x , begin.y - target.y);

			// const endX = this.begin[i].x < target.x ? MainCanvas.WIDTH : 0;
			// const endY = (target.y - this.begin[i].y) * (endX - this.begin[i].x) / (target.x - this.begin[i].x) + this.begin[i].y;
			this.ctx.save();
			this.ctx.translate(begin.x - 10, GameMain.convY(begin.y - 30, 0));
			this.ctx.rotate(angle);
			this.ctx.drawImage(beamImg, 0, 0);
			this.ctx.restore();
			this.beamFrame = this.beamFrame > 2 ? 0 : this.beamFrame;
		});
	}

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(GodzillaMob.HP_BAR.X, GodzillaMob.HP_BAR.Y, GodzillaMob.HP_BAR.WIDTH + 2, GodzillaMob.HP_BAR.HEIGHT + 2);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(GodzillaMob.HP_BAR.X + 1, GodzillaMob.HP_BAR.Y + 1, GodzillaMob.HP_BAR.WIDTH, GodzillaMob.HP_BAR.HEIGHT );
		this.ctx.fillStyle = "#4f1ae8";
		this.ctx.fillRect(GodzillaMob.HP_BAR.X + 1, GodzillaMob.HP_BAR.Y + 1, GodzillaMob.HP_BAR.WIDTH * this.hp / this.maxHp , GodzillaMob.HP_BAR.HEIGHT );
		this.ctx.fillStyle = GameMain.MOJI_COLOR;
		this.ctx.font = "12px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`${this.hp} / ${this.maxHp}`, this.x + 30, 40);
	}

	private action() {
		let dmg = 0;
		switch (this.mode) {
		case GodzillaMode.init:
			this.image = ImageLoader.IMAGES.gozzila;
			break;
		case GodzillaMode.beforeAtk:
			this.image = ImageLoader.IMAGES.gozzilaBefAtk;
			break;
		case GodzillaMode.atk:
			this.image = ImageLoader.IMAGES.gozzila_atk;
			this.drawBeam();
			dmg += this.calcBeamDmg(this.userModel.x, this.userModel.x + MyUserModel.WIDTH, this.userModel.y, this.userModel.y + MyUserModel.HEIGHT);
			break;
		default:
			break;
		}
		dmg += this.calcSessyokuDmg(this.userModel.x, this.userModel.y);
		this.userModel.hp -= this.userModel.hp - dmg > 0 ? dmg : this.userModel.hp;
	}
}