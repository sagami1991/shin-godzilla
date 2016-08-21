"use strict";
var share_1 = require("../share/share");
var SkillController = (function () {
    function SkillController(wsWrapper, userController) {
        this.wsWrapper = wsWrapper;
        this.userController = userController;
    }
    SkillController.prototype.init = function () {
        var _this = this;
        this.wsWrapper.addMsgListner(share_1.SocketType.getSkill, function (ws, req) { return _this.onGetSkill(ws, req); });
    };
    SkillController.prototype.onGetSkill = function (ws, req) {
        var user = this.userController.getUser(ws);
        if (user && this.validate(req, user)) {
            user.skills.push(req);
            this.wsWrapper.send(ws, share_1.SocketType.getSkill, user);
        }
    };
    SkillController.prototype.validate = function (req, user) {
        return (typeof req === "number" &&
            !user.skills.includes(req)) &&
            user.lv >= (user.skills.length + 1) * 10;
    };
    return SkillController;
}());
exports.SkillController = SkillController;

//# sourceMappingURL=SkillController.js.map
