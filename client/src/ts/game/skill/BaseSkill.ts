import {SkillComponent} from "../component/SkillComponent";
import {MyUser, MyUserOption} from "../mob/MyUser";
export class BaseSkill {
	protected excusionTime: Date;
	
	constructor(protected userBody: MyUserOption,
				protected skillComponent: SkillComponent,
				protected coolTime: number) {}

	public execute(): void {};

	protected setEnableTimer() {
		window.setTimeout(() => {

		}, this.coolTime);
	}

	protected isWaitedCoolTime() {
		return new Date().getTime() - this.excusionTime.getTime() > this.coolTime;
	}
}