import {MyUserModel} from "../mob/MyUser";
import {HealSkill} from "./HealSkill";
import {BaseSkill} from "./BaseSkill";
import {IsEndCoolTimeModel} from "./SkillModel";
export class SkillAction {
	constructor(private userBody: MyUserModel, private cooltimes: IsEndCoolTimeModel) {
		const skills = [
			{ pName: "isHeal", obj: new HealSkill(this.userBody, this.cooltimes)},
			{ pName: "isHest", obj: new HealSkill(this.userBody, this.cooltimes)},
			{ pName: "isHb", obj: new HealSkill(this.userBody, this.cooltimes)}
		];

		skills.forEach((skill, i) => {
			userBody.addChangeListener(skill.pName, (isEnable) => {
				isEnable && cooltimes.get(i) && userBody.skills.includes(i) ? skill.obj.execute() : null;
			});
		});
	}




}