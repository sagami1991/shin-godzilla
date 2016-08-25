import {MyUser, MyUserModel} from "../mob/MyUser";
import {IsEndCoolTimeModel} from "./SkillModel";
export class BaseSkill {
	protected excusionTime: Date;
	protected coolTime: number;
	protected type: number;
	constructor(protected userBody: MyUserModel,
				protected cooltimes: IsEndCoolTimeModel) {}

	public execute(): void {};

	protected setEnableTimer() {
		window.setTimeout(() => this.cooltimes.set(this.type, true), this.coolTime);
	}
}