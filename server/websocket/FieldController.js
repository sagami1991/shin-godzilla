"use strict";
var share_1 = require("../share/share");
var FieldController = (function () {
    function FieldController(main) {
        this.main = main;
    }
    FieldController.prototype.init = function () {
        var _this = this;
        this.main.addMsgListner(share_1.SocketType.field, function (ws, data) { return _this.sendFieldTypeForAll(ws, data); });
    };
    FieldController.prototype.sendFieldTypeForAll = function (ws, type) {
        FieldController.bgType = type;
        this.main.sendAll({
            type: share_1.SocketType.field,
            value: FieldController.bgType
        });
    };
    FieldController.bgType = share_1.FieldType.henesys;
    return FieldController;
}());
exports.FieldController = FieldController;

//# sourceMappingURL=FieldController.js.map
