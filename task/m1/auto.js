const {Automation} = require('../../src/automation');


class Auto extends Automation {
    constructor() {
        super(__dirname);

        // 오토 가져오기
        this.vir.add('/aaa/bbb');

        // 속성 설정
        this.prop.a = 'a'

        // 템플릿 설정

        // 메타모델 설정

        // 인터페이스 설정 (마지막)
    }
}

module.exports = Auto;
