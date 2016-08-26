

/** 変更を監視できるModelの基底クラス */
export class Observable<T> {
	private changeListeners: {[prop: string]: Array<(value: any) => void>} = {};
	constructor(protected option: T) {
	}
	public setProperties(info: T) {
		Object.keys(info).forEach(key => {
			const myOption = <{[index: string]: any}> this.option;
			const old = myOption[key];
			const newVal = (<any>info)[key];
			myOption[key] = typeof old === "object" ? Object.assign({}, old, newVal) : newVal;
			this.onChange(key, old, newVal);
		});
	}

	public addChangeListener(pName: string | number, cb: (value: any) => void) {
		console.assert(Object.keys(this.option).includes(pName + ""), "存在しないプロパティ", pName);
		if (!this.changeListeners[pName]) {
			this.changeListeners[pName] = [];
		}
		this.changeListeners[pName].push(cb);
	}

	protected onChange(pName: string | number, old: any, newVal: any) {
		if (
			(typeof old !== "object" && old !== newVal && this.changeListeners[pName]) ||
			(typeof old === "object" && JSON.stringify(old) !== JSON.stringify(newVal) && this.changeListeners[pName])
		) {
			const deletedCbIndexs: number[] = [];
			this.changeListeners[pName].forEach((cb, i) => cb ? cb(newVal) : deletedCbIndexs.push(i));
			deletedCbIndexs.forEach(i => delete this.changeListeners[pName][i]);
			this.changeListeners[pName] = this.changeListeners[pName].filter(cb => cb);
		}
	}

	public get(key: number | string) {
		return (<any>this.option)[key];
	}

	public set(key: number | string, value: any) {
		const old = (<any>this.option)[key];
		(<any>this.option)[key] = value;
		this.onChange(key, old, value);
	}

	public getOption() {
		return this.option;
	}
}