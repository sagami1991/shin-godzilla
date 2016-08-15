
/** 画面用の通知、humane-jsをラップしたものブラウザのNotificationとは別 */
export class Notify {
	public static error(msg: string) {
		humane.spawn({addnCls: "humane-error", timeout: 5000})(msg);
	};
	public static warning(msg: string) {
		humane.spawn({addnCls: "humane-warning", timeout: 5000})(msg);
	};
	public static success(msg: string) {
		humane.spawn({addnCls: "humane-success", timeout: 5000})(msg);
	};
}