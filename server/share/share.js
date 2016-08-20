// クライアントサイドとも共有するコード
"use strict";
/** ウェブソケットでやりとりする情報の種類 */
(function (SocketType) {
    SocketType[SocketType["error"] = 0] = "error";
    SocketType[SocketType["initlog"] = 1] = "initlog";
    SocketType[SocketType["chatLog"] = 2] = "chatLog";
    SocketType[SocketType["infolog"] = 3] = "infolog";
    SocketType[SocketType["snapshot"] = 4] = "snapshot";
    SocketType[SocketType["init"] = 5] = "init";
    SocketType[SocketType["closePerson"] = 6] = "closePerson";
    SocketType[SocketType["gozzilaDamege"] = 7] = "gozzilaDamege";
    SocketType[SocketType["saveUserData"] = 8] = "saveUserData";
    SocketType[SocketType["ranking"] = 9] = "ranking";
    SocketType[SocketType["field"] = 10] = "field";
    SocketType[SocketType["userData"] = 11] = "userData";
    SocketType[SocketType["resetLv"] = 12] = "resetLv";
    SocketType[SocketType["dead"] = 13] = "dead";
    SocketType[SocketType["changeName"] = 14] = "changeName";
    SocketType[SocketType["getSkill"] = 15] = "getSkill";
})(exports.SocketType || (exports.SocketType = {}));
var SocketType = exports.SocketType;
(function (FieldType) {
    FieldType[FieldType["henesys"] = 0] = "henesys";
    FieldType[FieldType["risu"] = 1] = "risu";
    FieldType[FieldType["kaning"] = 2] = "kaning";
})(exports.FieldType || (exports.FieldType = {}));
var FieldType = exports.FieldType;
(function (SkillId) {
    SkillId[SkillId["heal"] = 0] = "heal";
})(exports.SkillId || (exports.SkillId = {}));
var SkillId = exports.SkillId;
(function (GodzillaMode) {
    GodzillaMode[GodzillaMode["init"] = 0] = "init";
    GodzillaMode[GodzillaMode["beforeAtk"] = 1] = "beforeAtk";
    GodzillaMode[GodzillaMode["atk"] = 2] = "atk";
    GodzillaMode[GodzillaMode["atkEnd"] = 3] = "atkEnd";
    GodzillaMode[GodzillaMode["dead"] = 4] = "dead";
})(exports.GodzillaMode || (exports.GodzillaMode = {}));
var GodzillaMode = exports.GodzillaMode;
exports.CONST = {
    USER: {
        BASE_EXP: 50,
        EXP_BAIRITU: 1.2
    },
    GAME: {
        SEND_FPS: 10,
    },
    CANVAS: {
        Y0: 150
    }
};

//# sourceMappingURL=share.js.map
