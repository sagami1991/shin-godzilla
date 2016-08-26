import {CONST, GodzillaMode, GodzillaInfo} from "../share/share";
import {UserService} from "../service/UserService";
import {FieldItemService} from "../service/FieldItemService";
import {getRandom} from "../share/util";
import {Observable} from "../share/Observable";

export class GodzillaModel extends Observable<GodzillaInfo> {
	get mode() { return this.option.mode; }
	set mode(mode: GodzillaMode) { this.set("mode", mode); }
	get hp() { return this.option.hp; }
	set hp(hp: number) { this.set("hp", hp); }
	get target() { return this.option.target; }
	set target(target: {x: number, y: number}[]) { this.set("target", target); }
}

export class GodzillaService {
	private static ACTION_INFO = [
		{sec: 1, mode: GodzillaMode.init},
		{sec: 0.8, mode: GodzillaMode.beforeAtk},
		{sec: 1.6, mode: GodzillaMode.atk},
		{sec: Infinity, mode: GodzillaMode.atkEnd}
	];

	private _godzillaModel: GodzillaModel;
	private actionFrameCount: number;
	private isDecidedTarget: boolean;
	get godzillaModel() { return this._godzillaModel; }

	constructor(private userService: UserService) {
	}

	public init() {
		this._godzillaModel = new GodzillaModel({
			hp: CONST.GODZILLA.HP,
			mode: GodzillaMode.init,
			target: Array.from(new Array(2)).map( () => {return {x: 0, y: 0}; })
		});
		this.actionFrameCount = 0;
	}

	public roopAction() {
		this.actionFrameCount ++;
		let baseFrame = 0;
		for (const actionInfo of GodzillaService.ACTION_INFO) {
			baseFrame += actionInfo.sec * CONST.GAME.SEND_FPS;
			if (this.actionFrameCount < baseFrame) {
				this._godzillaModel.mode = actionInfo.mode;
				break;
			}
		}
		switch (this._godzillaModel.mode) {
		case GodzillaMode.beforeAtk:
			if (!this.isDecidedTarget) this.decideTarget();
			break;
		case GodzillaMode.atkEnd:
			this.isDecidedTarget = false;
			this.actionFrameCount = 0;
			GodzillaService.ACTION_INFO[0].sec = Math.floor(8 + Math.random() * 10) * 0.1;
			break;
		case GodzillaMode.dead:
			// this.fieldItemService.dropRamdomItem(CONST.GODZILLA.X, CONST.CANVAS.Y0);
		}
	}

	public damage(damage: number) {
		this._godzillaModel.hp -= 2;
	}

	private decideTarget() {
		const livedEvils = this.userService.getAllSnapShotUser().filter(evil => !evil.isDead && evil.x > CONST.GAME.ANTI_X);
		const deadEvils = this.userService.getAllSnapShotUser().filter(evil => evil.x > CONST.GAME.ANTI_X);
		const targetEvils = livedEvils.length ? livedEvils : deadEvils;
		const targets = Array.from(new Array(2)).map(() => {
			const targetEvil = getRandom(targetEvils);
			return targetEvil ? {x: targetEvil.x + 50, y: targetEvil.y + 30} : {x: 0, y: 0};
		});
		this._godzillaModel.target = targets;
		this.isDecidedTarget = true;
	}
}