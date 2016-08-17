"use strict";
var MainController_1 = require("./MainController");
var GameController_1 = require("./GameController");
var GodzillaMode;
(function (GodzillaMode) {
    GodzillaMode[GodzillaMode["init"] = 0] = "init";
    GodzillaMode[GodzillaMode["beforeAtk"] = 1] = "beforeAtk";
    GodzillaMode[GodzillaMode["atk"] = 2] = "atk";
    GodzillaMode[GodzillaMode["atkEnd"] = 3] = "atkEnd";
    GodzillaMode[GodzillaMode["dead"] = 4] = "dead";
})(GodzillaMode || (GodzillaMode = {}));
var GodzillaController = (function () {
    function GodzillaController(main, evils) {
        this.main = main;
        this.evils = evils;
        this.atkCount = {};
    }
    Object.defineProperty(GodzillaController.prototype, "godzilla", {
        get: function () {
            return this._godzilla;
        },
        enumerable: true,
        configurable: true
    });
    GodzillaController.prototype.init = function () {
        var _this = this;
        this._godzilla = {
            hp: 4000,
            mode: GodzillaMode.init,
            target: Array.from(new Array(2)).map(function () { return { x: 0, y: 0 }; })
        };
        this.main.addMsgListner({
            type: MainController_1.SocketType.gozzilaDamege,
            cb: function (ws, reqData) { return _this.onAtkGodzilla(ws); }
        });
        this.actionFrameCount = 0;
    };
    GodzillaController.prototype.roopAction = function () {
        this.actionFrameCount++;
        var baseFrame = 0;
        for (var _i = 0, _a = GodzillaController.ACTION_INFO; _i < _a.length; _i++) {
            var actionInfo = _a[_i];
            baseFrame += actionInfo.sec * GameController_1.GameController.FRAME;
            if (this.actionFrameCount < baseFrame) {
                this._godzilla.mode = actionInfo.mode;
                break;
            }
        }
        switch (this._godzilla.mode) {
            case GodzillaMode.beforeAtk:
                if (!this.isDecidedTarget)
                    this.decideTarget();
                break;
            case GodzillaMode.atkEnd:
                this.isDecidedTarget = false;
                this.actionFrameCount = 0;
                break;
        }
    };
    GodzillaController.prototype.onAtkGodzilla = function (ws) {
        var skey = this.main.getSercretKey(ws);
        this.atkCount[skey] = this.atkCount[skey] ? this.atkCount[skey] + 1 : 1;
        if (this.atkCount[skey] > 100)
            ws.close();
        this._godzilla.hp -= 2;
    };
    GodzillaController.prototype.decideTarget = function () {
        var livedEvils = this.evils.filter(function (evil) { return !evil.isDead; });
        var targetEvils = livedEvils.length ? livedEvils : this.evils;
        var targets = Array.from(new Array(2)).map(function () {
            var targetEvil = GameController_1.GameController.getRandom(targetEvils);
            return targetEvil ? { x: targetEvil.x + 50, y: targetEvil.y + 30 } : { x: 0, y: 0 };
        });
        this._godzilla.target = targets;
        this.isDecidedTarget = true;
    };
    GodzillaController.ACTION_INFO = [
        { sec: 1, mode: GodzillaMode.init },
        { sec: 0.8, mode: GodzillaMode.beforeAtk },
        { sec: 1.6, mode: GodzillaMode.atk },
        { sec: Infinity, mode: GodzillaMode.atkEnd }
    ];
    return GodzillaController;
}());
exports.GodzillaController = GodzillaController;

//# sourceMappingURL=GodzillaController.js.map
