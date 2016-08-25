

export class Observable<T> {
	private changeListeners: {[prop: string]: Array<(value: any) => void>};
	constructor(protected option: T) {
	}
	public setProperties(info: T) {
		Object.keys(info).forEach(key => {
			const old = (<any>this.option)[key];
			(<any>this.option)[key] = (<any>info)[key];
			this.onChange(key, old, (<any>info)[key]);
		});
	}

	public addChangeListener(pName: string | number, cb: (value: any) => void) {
		console.assert(!Object.keys(this.option).includes(<any>pName), "存在しないプロパティ");
		if (!this.changeListeners[pName]) {
			this.changeListeners[pName] = [];
		}
		this.changeListeners[pName].push(cb);
	}

	protected onChange(pName: string | number, old: any, newVal: any) {
		if (old !== newVal && this.changeListeners[pName]) {
			const deleted: number[] = [];
			this.changeListeners[pName].forEach((cb, i) => cb ? cb(newVal) : deleted.push(i));
			deleted.forEach(i => delete this.changeListeners[pName][i]);
			this.changeListeners[pName] = this.changeListeners[pName].filter(cb => cb);
		}
	}
}