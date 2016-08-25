import {Observable} from "../model/Observable";

interface SkillOption {
	[key: number]: boolean;
}

export class IsEndCoolTimeModel extends Observable<SkillOption> {
	set(key: number, value: boolean) {
		const old = this.option[key];
		this.option[key] = value;
		this.onChange(key, old, value);
	}

	get(key: number) {
		return this.option[key];
	}
}