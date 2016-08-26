import {Observable} from "../../../../../server/share/Observable";

interface SkillOption {
	[key: number]: boolean;
}

export class IsEndCoolTimeModel extends Observable<SkillOption> {}