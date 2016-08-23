
/** 画面用の通知、humane-jsをラップしたものブラウザのNotificationとは別 */
declare namespace humane {
	//function remove(): any;
	function spawn(option: {addnCls: string, timeout: number}): (msg: string) => void;
}

export class Notify {
	public static error(msg: string) {
		humane.spawn({addnCls: "humane-error", timeout: 20000})(msg);
	};
	public static warning(msg: string) {
		humane.spawn({addnCls: "humane-warning", timeout: 5000})(msg);
	};
	public static success(msg: string) {
		humane.spawn({addnCls: "humane-success", timeout: 1800})(msg);
	};
}