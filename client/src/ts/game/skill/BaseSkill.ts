import {MyUserModel} from "../mob/MyUser";
import {IsEndCoolTimeModel} from "./SkillModel";
export class BaseSkill {
	protected excusionTime: Date;
	protected coolTime: number;
	protected type: number;
	constructor(protected body: MyUserModel,
				protected cooltimes: IsEndCoolTimeModel) {}

	public execute(): void {};

	protected setEnableTimer() {
		this.cooltimes.set(this.type, false);
		window.setTimeout(() => {
			this.cooltimes.set(this.type, true);
			this.onEndCoolTime();
		}, this.coolTime);
	}

	protected onEndCoolTime(): void {}
}