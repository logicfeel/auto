const Automation = require('../../src/automation');
let Mod1 = require('../m1/auto');
let mod1 = new Mod1();

class Auto extends Automation {
    
    kkk = 10
    
    constructor() {
        super(__dirname);

        // 오토 가져오기
        this.mod.sub('M1', mod1);
        
        // 속성 설정
        // 템플릿 설정
        // 메타모델 설정
        // 인터페이스 설정 (마지막)
    }
}

module.exports = Auto;