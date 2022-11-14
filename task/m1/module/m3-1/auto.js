const {Automation} = require('../../../../src/automation');

class Auto extends Automation {
    constructor() {
        super();

        this.dir = __dirname;
        // this.isFinal = true; // 상속금지 설정
        this.a = 'a'
        this.install._except.push('KKK');   // 임의 코드
    }
}

module.exports = Auto;
// exports.Automation = Auto;
