import {BaseSkill} from "./BaseSkill";
import {CONST, SkillId} from "../../../../../server/share/share";
export class HealSkill extends BaseSkill {
	protected coolTime: number = CONST.SKILL.HEAL.COOL_TIME;
	protected type = SkillId.heal;
	public execute() {
		const hp = this.body.hp + CONST.SKILL.HEAL.AMOUNT;
		this.body.hp = (hp > this.body.maxHp) ? this.body.maxHp : hp;
		this.setEnableTimer();
	}
}