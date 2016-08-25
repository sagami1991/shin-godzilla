import {BaseSkill} from "./BaseSkill";
import {CONST, SkillId} from "../../../../../server/share/share";
export class HealSkill extends BaseSkill {
	protected coolTime: number = CONST.SKILL.HEAL.COOL_TIME;
	protected type = SkillId.heal;
	public execute() {
		this.userBody.hp += this.userBody.hp + 10 > this.userBody.maxHp ? this.userBody.maxHp : 10;
		this.setEnableTimer();
	}
}