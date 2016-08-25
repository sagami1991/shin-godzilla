import {Observable} from "../model/Observable";

interface SkillOption {
	[key: number]: boolean;
}

export class IsEndCoolTimeModel extends Observable<SkillOption> {
}