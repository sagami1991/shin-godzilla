import {GameMain} from "../main";
import {ImageLoader} from "../ImageLoader";
import {BaseMob} from "../mob/BaseMob";
import {EffectService} from "../service/EffectService";
import {GamePadComponent} from "../component/GamePadComponent";
import {SocketType, DbUserData, SkillId} from "../../../../../server/share/share";
import {SkillComponent} from "../component/SkillComponent";
import {MyUser, MyUserOption} from "../mob/MyUser";
import {HealSkill} from "./HealSkill";
import {BaseSkill} from "./BaseSkill";
export class SkillAction {
	constructor(private ctx: CanvasRenderingContext2D,
				private effectService: EffectService,
				private userBody: MyUserOption,
				private skillComponent: SkillComponent,
				private skills: BaseSkill[]) {}

	public action() {
		const buttons = [
			GamePadComponent.KeyEvent.skill_0,
			GamePadComponent.KeyEvent.skill_1,
			GamePadComponent.KeyEvent.skill_2,
		];
		
		buttons.forEach((isActive, i) => {
			if (isActive && this.userBody.skills) {

			}
		});
	}



}