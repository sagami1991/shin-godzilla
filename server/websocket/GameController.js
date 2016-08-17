"use strict";
var MainController_1 = require("./MainController");
var GodzillaController_1 = require("./GodzillaController");
var GameController = (function () {
    function GameController(main) {
        this.main = main;
        this.evils = [];
        this.godzillaController = new GodzillaController_1.GodzillaController(main, this.evils);
        this.godzillaController.init();
    }
    GameController.getRandom = function (arr) {
        return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
    };
    GameController.prototype.init = function () {
        var _this = this;
        this.main.addConnectListner(function (ws) { return _this.onSomebodyConnect(ws); });
        this.main.addCloseListner(function (ws) { return _this.deleteClosedEvil(ws); });
        this.main.addMsgListner({
            type: MainController_1.SocketType.zahyou,
            cb: function (ws, reqData) { return _this.updateEvils(ws, reqData); }
        });
        setInterval(function () { return _this.intervalAction(); }, 1000 / GameController.FRAME);
    };
    GameController.prototype.onSomebodyConnect = function (ws) {
        this.main.sendAll({
            myWs: ws,
            isSelfSend: false,
            type: MainController_1.SocketType.infolog,
            value: "\u8AB0\u304B\u304C\u30A2\u30AF\u30BB\u30B9\u3057\u307E\u3057\u305F"
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
                type: MainController_1.SocketType.zahyou,
                value: sendData
            });
        }
        this.befSendData = JSON.parse(JSON.stringify(sendData));
    };
    GameController.prototype.updateEvils = function (nowWs, reqData) {
        var _this = this;
        var evilInfo = this.evils.find(function (zahyou) { return zahyou.personId === _this.main.getSercretKey(nowWs); });
        if (evilInfo) {
            Object.assign(evilInfo, reqData.value);
        }
        else {
            this.evils.push(Object.assign({ personId: this.main.getSercretKey(nowWs) }, reqData.value));
        }
    };
    GameController.FRAME = 30;
    return GameController;
}());
exports.GameController = GameController;

//# sourceMappingURL=GameController.js.map
