"use strict";
var share_1 = require("../share/share");
var RankingController = (function () {
    function RankingController(main, userService) {
        this.main = main;
        this.userService = userService;
    }
    RankingController.prototype.init = function () {
        var _this = this;
        this.main.addConnectListner(function (ws) { return _this.sendRanking(ws); });
    };
    RankingController.prototype.sendRanking = function (ws) {
        var _this = this;
        this.userService.getRanker().then(function (users) {
            _this.main.send(ws, share_1.SocketType.ranking, users);
        });
    };
    return RankingController;
}());
exports.RankingController = RankingController;

//# sourceMappingURL=RankingController.js.map
