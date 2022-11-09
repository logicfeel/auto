const {Automation} = require('../../../../src/automation');


class Auto extends Automation {
    constructor() {
        super(__dirname);

        this.dir = __dirname;

        // 오토 가져오기
        

        // 속성 설정
        this.a = 'a'

        // 템플릿 설정

        // 메타모델 설정

        // 인터페이스 설정 (마지막)
    }
}

// module.exports = Auto;


exports.Automation = Auto;
