import {BaseSkill} from "./BaseSkill";
import {CONST, SkillId} from "../../../../../server/share/share";
export class HbSkill extends BaseSkill {
	protected coolTime: number = CONST.SKILL.HB.COOL_TIME;
	protected type = SkillId.hb;
	public execute() {
		this.body.maxHp *= 1.5;
		this.setEnableTimer();
	}

	protected onEndCoolTime() {
		this.body.maxHp = CONST.USER.BASE_MAX_HP;
	}
}