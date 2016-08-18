"use strict";
var GodzillaController_1 = require("./GodzillaController");
var share_1 = require("../share/share");
var shortid = require("shortid");
var GameController = (function () {
    function GameController(main, userService) {
        this.main = main;
        this.userService = userService;
        this.evils = [];
        this.godzillaController = new GodzillaController_1.GodzillaController(main, this.evils);
        this.godzillaController.init();
    }
    GameController.getRandom = function (arr) {
        return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
    };
    GameController.prototype.init = function () {
        var _this = this;
        this.main.addCloseListner(function (ws) { return _this.deleteClosedEvil(ws); });
        this.main.addMsgListner(share_1.SocketType.init, function (ws, reqData) { return _this.onReceiveUserId(ws, reqData); });
        this.main.addMsgListner(share_1.SocketType.zahyou, function (ws, reqData) { return _this.updateEvils(ws, reqData); });
        this.main.addMsgListner(share_1.SocketType.save, function (ws, reqData) { return _this.saveUserData(ws, reqData); });
        setInterval(function () { return _this.intervalAction(); }, 1000 / GameController.FRAME);
    };
    GameController.prototype.saveUserData = function (ws, reqData) {
        this.userService.updateUser(reqData).catch(function (e) {
            console.trace(e);
            console.log(reqData);
        });
    };
    GameController.prototype.onReceiveUserId = function (ws, reqData) {
        var _this = this;
        if (!reqData._id) {
            this.sendInitUserData(ws, this.createInitUser());
        }
        else {
            this.userService.getUser(reqData._id).then(function (user) {
                _this.sendInitUserData(ws, user ? user : _this.createInitUser());
            });
        }
    };
    GameController.prototype.createInitUser = function () {
        var initialData = Object.assign({ _id: shortid.generate() }, GameController.INIT_USERDATA);
        this.userService.createUser(initialData);
        return initialData;
    };
    GameController.prototype.sendInitUserData = function (ws, user) {
        this.main.send(ws, share_1.SocketType.init, {
            personId: this.main.getSercretKey(ws),
            userData: user
        });
    };
    GameController.prototype.deleteClosedEvil = function (ws) {
        var _this = this;
        var targetIdx = this.evils.findIndex(function (zahyou) { return zahyou.personId === _this.main.getSercretKey(ws); });
        this.evils.splice(targetIdx, 1);
    };
    GameController.prototype.intervalAction = function () {
        this.godzillaController.roopAction();
        this.sendGameData();
    };
    GameController.prototype.sendGameData = function () {
        var sendData = {
            gozzila: this.godzillaController.godzilla,
            evils: this.evils
        };
        if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)) {
            this.main.sendAll({
                type: share_1.SocketType.zahyou,
                value: sendData
            });
        }
        this.befSendData = JSON.parse(JSON.stringify(sendData));
    };
    GameController.prototype.updateEvils = function (nowWs, reqData) {
        var _this = this;
        var evilInfo = this.evils.find(function (zahyou) { return zahyou.personId === _this.main.getSercretKey(nowWs); });
        if (evilInfo) {
            Object.assign(evilInfo, reqData);
        }
        else {
            this.evils.push(Object.assign({ personId: this.main.getSercretKey(nowWs) }, reqData));
        }
    };
    GameController.FRAME = 30;
    GameController.INIT_USERDATA = {
        exp: 0,
        lv: 1,
        name: "名前"
    };
    return GameController;
}());
exports.GameController = GameController;

//# sourceMappingURL=GameController.js.map
