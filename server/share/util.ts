export class DiffExtract {
	private static FORCE_KEY = "pid";
	public static diff(prevObj: Object, nextObj: Object): Object {
		if (!prevObj || !nextObj) return undefined;
		return this.objDiff(prevObj, nextObj);
	}

	private static objDiff(prevObj: {[key: string]: any}, nextObj: {[key: string]: any}): {[key: string]: any} {
		if (prevObj === undefined) {
			return nextObj;
		}

		const result: {[key: string]: any} = {};
		Object.keys(nextObj).forEach((key) => {
			const next = nextObj[key];
			const prev = prevObj[key];
			if (Array.isArray(next)) {
				const arr = this.arrDiff(prev, next);
				if (arr) result[key] = arr;
			} else if (typeof next === "object") {
				const obj = this.objDiff(prev, next);
				if (obj) result[key] = obj;
			} else if (typeof next !== "undefined" && next !== prev) {
				result[key] = next;
				// personIDは絶対入れる
				if (nextObj["pid"] && !result["pid"]) {
					result["pid"] = nextObj["pid"];
				}
			}
		});
		return !this.isEmpty(result) ? result : undefined;
	}

	private static arrDiff(befArr: any[], nextArr: any[]): any[] {
		if (befArr === undefined) {
			return nextArr;
		}
		const result: any[] = [];
		nextArr.forEach((next, i) => {
			const prev = befArr[i];
			if (Array.isArray(next) && Array.isArray(prev)) {
				const arr = this.arrDiff(prev, next);
				if (arr) result.push(arr);
			} else if (typeof next === "object") {
				const obj = this.objDiff(prev, next);
				if (obj) result.push(obj);
			} else if (typeof next !== "undefined") {
				result.push(next);
			}
		});
		return !this.isEmpty(result) ? result : undefined;
	}

	private static isEmpty(obj: {[key: string]: any} | any[]): boolean {
		if (Array.isArray(obj)) {
			return !obj.length ? true : false;
		} else {
			return !Object.keys(obj).length ? true : false;
		}
	}
}