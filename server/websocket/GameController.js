"use strict";
var GodzillaController_1 = require("./GodzillaController");
var share_1 = require("../share/share");
var FieldController_1 = require("./FieldController");
var util_1 = require("../share/util");
var GameController = (function () {
    function GameController(wsWrapper, userController) {
        this.wsWrapper = wsWrapper;
        this.userController = userController;
        this.masterUsersData = [];
        this.closeIds = [];
        this.godzillaController = new GodzillaController_1.GodzillaController(wsWrapper, this.masterUsersData);
        this.godzillaController.init();
    }
    GameController.getRandom = function (arr) {
        return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
    };
    GameController.prototype.init = function () {
        var _this = this;
        this.wsWrapper.addCloseListner(function (ws) { return _this.deleteClosedEvil(ws); });
        this.wsWrapper.addMsgListner(share_1.SocketType.zahyou, function (ws, reqData) { return _this.onReceiveEvilData(ws, reqData); });
        this.wsWrapper.addMsgListner(share_1.SocketType.gozzilaDamege, function (ws, reqData) { return _this.atkToGodzilla(ws, reqData); });
        setInterval(function () { return _this.intervalAction(); }, 1000 / GameController.SEND_FPS);
        this.userController.onLvUp = function (personId) {
            var evil = _this.masterUsersData.find(function (evil) { return evil.pid === personId; });
            if (evil) {
                evil.lv += 1;
                evil.isLvUp = true;
            }
        };
        this.userController.onFirstConnect = function (ws, user) {
            var userData = {
                isMigi: true,
                x: Math.round(Math.random() * 500),
                y: share_1.CONST.CANVAS.Y0,
                isAtk: false,
                isDead: false,
                pid: _this.wsWrapper.getPersonId(ws),
                lv: user.lv,
                isLvUp: false,
                name: user.name
            };
            _this.masterUsersData.push(userData);
            _this.wsWrapper.send(ws, share_1.SocketType.init, {
                pid: _this.wsWrapper.getPersonId(ws),
                user: Object.assign({}, user, userData),
                users: _this.masterUsersData,
                gozdilla: _this.godzillaController.godzilla,
                bg: FieldController_1.FieldController.bgType
            });
        };
        this.userController.onClose = function (ws) {
            _this.closeIds.push(_this.wsWrapper.getPersonId(ws));
        };
        this.userController.onSave = function (ws, user) {
            var userData = _this.masterUsersData.find(function (user) { return user.pid === _this.wsWrapper.getPersonId(ws); });
            if (userData)
                userData.name = user.name;
        };
    };
    GameController.prototype.atkToGodzilla = function (ws, damage) {
        this.userController.increaseExp(ws);
        this.godzillaController.damage(damage);
    };
    GameController.prototype.deleteClosedEvil = function (ws) {
        var _this = this;
        var targetIdx = this.masterUsersData.findIndex(function (zahyou) { return zahyou.pid === _this.wsWrapper.getPersonId(ws); });
        this.masterUsersData.splice(targetIdx, 1);
    };
    GameController.prototype.intervalAction = function () {
        this.godzillaController.roopAction();
        this.sendSnapshot();
    };
    GameController.prototype.sendSnapshot = function () {
        var sendData = {
            gozzila: this.godzillaController.godzilla,
            evils: this.masterUsersData,
            cids: this.closeIds
        };
        var snapShot = util_1.DiffExtract.diff(this.befSendData, sendData);
        if (snapShot) {
            this.wsWrapper.sendAll({
                type: share_1.SocketType.zahyou,
                value: snapShot
            });
        }
        this.masterUsersData.forEach(function (evil) { return evil.isLvUp = false; });
        this.closeIds = [];
        this.befSendData = JSON.parse(JSON.stringify(sendData));
    };
    // MsgListner 
    GameController.prototype.onReceiveEvilData = function (ws, reqData) {
        var _this = this;
        var user = this.userController.getUser(ws);
        if (!user || !this.validateReqData(reqData)) {
            console.trace("不正なデータ", reqData);
            ws.close();
            return;
        }
        var evilInfo = this.masterUsersData.find(function (zahyou) { return zahyou.pid === _this.wsWrapper.getPersonId(ws); });
        if (evilInfo) {
            Object.assign(evilInfo, this.filterEvilData(reqData));
        }
    };
    GameController.prototype.filterEvilData = function (reqData) {
        return {
            isMigi: reqData.isMigi,
            x: reqData.x,
            y: reqData.y,
            isAtk: reqData.isAtk,
            isDead: reqData.isDead,
        };
    };
    GameController.prototype.validateReqData = function (reqData) {
        return (typeof reqData.x === "number" &&
            typeof reqData.y === "number" &&
            reqData.y >= 150);
    };
    GameController.FRAME = 30;
    GameController.SEND_FPS = 10;
    return GameController;
}());
exports.GameController = GameController;

//# sourceMappingURL=GameController.js.map
