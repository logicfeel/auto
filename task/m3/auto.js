const Automation = require('../../src/automation');
let Mod2 = require('./module/m2/auto');
// let Mod1_1 = require('./module/m1/auto');

let mod1 = new Mod2();
// let mod2 = new Mod1();
// let mod3 = new Mod1_1();


class Auto extends Automation {
    
    kkk = 10
    
    constructor() {
        super(__dirname);

        // 오토 가져오기
        // this.mod.super('M2', mod1);    // 동일 위치에 있음
        this.mod.sub('M2', mod1);       // 동일 위치에 있음
        // this.mod.add('M2', mod1);       // 동일 위치에 있음        

        // this.mod.sub('M2', mod3);       // module 하위에 있음
        // this.mod.sub('M1', mod2);
        // this.mod.super('M1', mod1);

        // 속성 설정
        // 템플릿 설정
        // 메타모델 설정
        // 인터페이스 설정 (마지막)
    }
}

module.exports = Auto;