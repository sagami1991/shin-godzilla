import {BaseSkill} from "./BaseSkill";
import {CONST, SkillId} from "../../../../../server/share/share";
export class HestSkill extends BaseSkill {
	protected coolTime: number = CONST.SKILL.HEST.COOL_TIME;
	protected type = SkillId.hest;
	public execute() {
		this.body.speed *= 1.5;
		this.body.jump *= 1.3;
		this.setEnableTimer();
	}

	protected onEndCoolTime() {
		this.body.speed = CONST.USER.BASE_SPEED;
		this.body.jump = CONST.USER.BASE_JUMP;
	}
}