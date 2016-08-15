// 更新日、webpackビルド時に付与される
declare var LAST_UPDATED: string;

interface NotificationOptions {
	dir?: string;
	lang?: string;
	body?: string;
	tag?: string;
	icon?: string;
}
//これ型定義ファイルどこにある？
declare class Notification {
	constructor(title: string, options?: NotificationOptions);
	static requestPermission(callback?: (permission: string) => void): void;
}

/** humaneJSの型定義、ほかにいい通知ライブラリあったらそっち使う */
declare module humane{
	function remove(): any;
	function spawn(option: {addnCls: string, timeout: number}) :(msg: string)=> void;
}
