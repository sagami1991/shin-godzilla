// クライアントサイドとも共有するコード
"use strict";
/** ウェブソケットでやりとりする情報の種類 */
(function (SocketType) {
    SocketType[SocketType["error"] = 0] = "error";
    SocketType[SocketType["initlog"] = 1] = "initlog";
    SocketType[SocketType["chatLog"] = 2] = "chatLog";
    SocketType[SocketType["infolog"] = 3] = "infolog";
    SocketType[SocketType["zahyou"] = 4] = "zahyou";
    SocketType[SocketType["init"] = 5] = "init";
    SocketType[SocketType["closePerson"] = 6] = "closePerson";
    SocketType[SocketType["gozzilaDamege"] = 7] = "gozzilaDamege";
    SocketType[SocketType["save"] = 8] = "save";
    SocketType[SocketType["ranking"] = 9] = "ranking";
})(exports.SocketType || (exports.SocketType = {}));
var SocketType = exports.SocketType;
(function (GodzillaMode) {
    GodzillaMode[GodzillaMode["init"] = 0] = "init";
    GodzillaMode[GodzillaMode["beforeAtk"] = 1] = "beforeAtk";
    GodzillaMode[GodzillaMode["atk"] = 2] = "atk";
    GodzillaMode[GodzillaMode["atkEnd"] = 3] = "atkEnd";
    GodzillaMode[GodzillaMode["dead"] = 4] = "dead";
})(exports.GodzillaMode || (exports.GodzillaMode = {}));
var GodzillaMode = exports.GodzillaMode;

//# sourceMappingURL=share.js.map
