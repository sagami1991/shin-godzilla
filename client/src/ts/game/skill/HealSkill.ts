import {BaseSkill} from "./BaseSkill";
export abstract class HealSkill extends BaseSkill {
	public execute() {
		if (!this.isWaitedCoolTime()) return;
		this.userBody.hp += this.userBody.hp + 10 > this.userBody.maxHp ? this.userBody.maxHp : 10;
	}
}