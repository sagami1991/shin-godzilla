"use strict";
var GameController_1 = require("./GameController");
var share_1 = require("../share/share");
var GodzillaController = (function () {
    function GodzillaController(wsWrapper, evils) {
        this.wsWrapper = wsWrapper;
        this.evils = evils;
    }
    Object.defineProperty(GodzillaController.prototype, "godzilla", {
        get: function () {
            return this._godzilla;
        },
        enumerable: true,
        configurable: true
    });
    GodzillaController.prototype.init = function () {
        this._godzilla = {
            hp: 4000,
            mode: share_1.GodzillaMode.init,
            target: Array.from(new Array(2)).map(function () { return { x: 0, y: 0 }; })
        };
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
            case share_1.GodzillaMode.beforeAtk:
                if (!this.isDecidedTarget)
                    this.decideTarget();
                break;
            case share_1.GodzillaMode.atkEnd:
                this.isDecidedTarget = false;
                this.actionFrameCount = 0;
                GodzillaController.ACTION_INFO[0].sec = Math.floor(8 + Math.random() * 10) * 0.1;
                break;
        }
    };
    GodzillaController.prototype.damage = function (damage) {
        this._godzilla.hp -= 2;
    };
    GodzillaController.prototype.decideTarget = function () {
        var livedEvils = this.evils.filter(function (evil) { return !evil.isDead && evil.x > share_1.CONST.GAME.ANTI_X; });
        var deadEvils = this.evils.filter(function (evil) { return evil.x > share_1.CONST.GAME.ANTI_X; });
        var targetEvils = livedEvils.length ? livedEvils : deadEvils;
        var targets = Array.from(new Array(2)).map(function () {
            var targetEvil = GameController_1.GameController.getRandom(targetEvils);
            return targetEvil ? { x: targetEvil.x + 50, y: targetEvil.y + 30 } : { x: 0, y: 0 };
        });
        this._godzilla.target = targets;
        this.isDecidedTarget = true;
    };
    GodzillaController.ACTION_INFO = [
        { sec: 1, mode: share_1.GodzillaMode.init },
        { sec: 0.8, mode: share_1.GodzillaMode.beforeAtk },
        { sec: 1.6, mode: share_1.GodzillaMode.atk },
        { sec: Infinity, mode: share_1.GodzillaMode.atkEnd }
    ];
    return GodzillaController;
}());
exports.GodzillaController = GodzillaController;

//# sourceMappingURL=GodzillaController.js.map
