
/** humaneJSの型定義、ほかにいい通知ライブラリあったらそっち使う */
declare module humane{
	function remove(): any;
	function spawn(option: {addnCls: string, timeout: number}) :(msg: string)=> void;
}
