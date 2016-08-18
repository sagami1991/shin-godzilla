"use strict";
var share_1 = require("../share/share");
var FieldController = (function () {
    function FieldController(main) {
        this.main = main;
        this._bgType = share_1.FieldType.henesys;
    }
    Object.defineProperty(FieldController.prototype, "bgType", {
        get: function () { return this._bgType; },
        enumerable: true,
        configurable: true
    });
    FieldController.prototype.init = function () {
        var _this = this;
        this.main.addMsgListner(share_1.SocketType.field, function (ws, data) { return _this.sendFieldTypeForAll(ws, data); });
    };
    FieldController.prototype.sendFieldTypeForAll = function (ws, type) {
        this._bgType = type;
        this.main.sendAll({
            type: share_1.SocketType.field,
            value: this._bgType
        });
    };
    return FieldController;
}());
exports.FieldController = FieldController;

//# sourceMappingURL=FieldController.js.map
