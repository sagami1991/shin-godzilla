import {GameController} from "../websocket/GameController";
import {CONST, ReqEvilData, GodzillaMode, GodzillaInfo} from "../share/share";
import {UserService} from "../service/UserService";
export class GodzillaService {
	private static ACTION_INFO = [
		{sec: 1, mode: GodzillaMode.init},
		{sec: 0.8, mode: GodzillaMode.beforeAtk},
		{sec: 1.6, mode: GodzillaMode.atk},
		{sec: Infinity, mode: GodzillaMode.atkEnd}
	];

	private _godzilla: GodzillaInfo;
	private actionFrameCount: number;
	private isDecidedTarget: boolean;
	get godzilla() { return this._godzilla; }

	constructor(private userService: UserService) {
	}

	public init() {
		this._godzilla = {
			hp: 4000,
			mode: GodzillaMode.init,
			target: Array.from(new Array(2)).map( () => {return {x: 0, y: 0}; })
		};
		this.actionFrameCount = 0;
	}

	public roopAction() {
		this.actionFrameCount ++;
		let baseFrame = 0;
		for (const actionInfo of GodzillaService.ACTION_INFO) {
			baseFrame += actionInfo.sec * CONST.GAME.SEND_FPS;
			if (this.actionFrameCount < baseFrame) {
				this._godzilla.mode = actionInfo.mode;
				break;
			}
		}
		switch (this._godzilla.mode) {
		case GodzillaMode.beforeAtk:
			if (!this.isDecidedTarget) this.decideTarget();
			break;
		case GodzillaMode.atkEnd:
			this.isDecidedTarget = false;
			this.actionFrameCount = 0;
			GodzillaService.ACTION_INFO[0].sec = Math.floor(8 + Math.random() * 10) * 0.1;
			break;
		}
	}

	public damage(damage: number) {
		this._godzilla.hp -= 2;
	}

	private decideTarget() {
		const livedEvils = this.userService.getAllSnapShotUser().filter(evil => !evil.isDead && evil.x > CONST.GAME.ANTI_X);
		const deadEvils = this.userService.getAllSnapShotUser().filter(evil => evil.x > CONST.GAME.ANTI_X);
		const targetEvils = livedEvils.length ? livedEvils : deadEvils;
		const targets = Array.from(new Array(2)).map(() => {
			const targetEvil = GameController.getRandom(targetEvils);
			return targetEvil ? {x: targetEvil.x + 50, y: targetEvil.y + 30} : {x: 0, y: 0};
		});
		this._godzilla.target = targets;
		this.isDecidedTarget = true;
	}
}