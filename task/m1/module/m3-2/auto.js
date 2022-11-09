const { Automation } = require('../m3-1/auto');


class Auto extends Automation {
    constructor() {
        super(__dirname);

        this.dir = __dirname;

        // 오토 가져오기
        

        // 속성 설정
        this.a = 'b'

        // 템플릿 설정

        // 메타모델 설정

        // 인터페이스 설정 (마지막)
    }
}

// exports.Automation = Auto;
module.exports = Auto;
