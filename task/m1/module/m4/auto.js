const {Automation} = require('../../../../src/automation');


class Auto extends Automation {
    constructor() {
        super();

        this.dir = __dirname;
        this.isStatic = true;   // 정적 모드 설정
    }
}

module.exports = Auto;
// exports.Automation = Auto;
