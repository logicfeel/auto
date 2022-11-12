const {Automation} = require('../../src/automation');
let Mod2 = require('./module/m2-1/auto');
let Mod3 = require('./module/m3-2/auto');
let Mod4 = require('./module/m4/auto');
// let Mod1_1 = require('./module/m1/auto');

let mod1 = new Mod2();

// let mod2 = new Mod2();  // 중복테스트

let mod3 = new Mod3();  // 상속테스트

// let mod4 = new Mod4();  // static 테스트
let mod4 = Mod4.getInstance();  // static 테스트

// mod2.vvv = 10;

// console.log(mod1 === mod2)
// let mod2 = new Mod1();
// let mod3 = new Mod1_1();

class IAuto {
    prop = {
        test: ''
    };
}

class Auto extends Automation {
    constructor() {
        super();

        this.dir = __dirname;

        // 오토 가져오기
        this.vir.add('aaa/bbb');
        // 오토 가져오기
        // this.mod.super('M2', mod1);    // 동일 위치에 있음
        this.mod.super('M2-1', mod1, '중복로딩 테스트');       // 동일 위치에 있음
        this.mod.sub('M3-2', mod3, '상속테스트');       // 상속 테스트
        this.mod.sub('M4', mod4, 'static 테스크');       // static 테스트

        this.title = '테스트 auto';
        // this.mod.sub('M2-12', mod2);
        // this.mod.add('M2', mod1);       // 동일 위치에 있음        

        // this.mod.sub('M2', mod3);       // module 하위에 있음
        // this.mod.sub('M1', mod2);
        // this.mod.super('M1', mod1);

        // 속성 설정
        this.prop.a = 'a'

        // 해결자 설정
        // this.resolver.setPattern('src/**', 'src/**');
        // this.resolver.setPattern('src/inc/**', 'out/**', 'out/com*');
        // this.resolver.setPattern('out/*', 'src/**');

        // 강제 의존성 설정
        
        // 콜백 이벤트 설정
        this.onLoaded = (auto) => {
            // 강제 의존성 설정
            auto.src['m3.html'].addDepend(auto.src['102-3.webp']);    // 객체로 추가
            // 확장
            auto.setDepend('src/m3.html', '/out/bar.css');
        };
        this.onBatch = function (entry) {
            console.log('onBatch 이벤트 처리');
        };
        this.onBatched = function (entry) {
            console.log('onBatched 이벤트 처리');
        };

        // 템플릿 설정

        // 메타모델 설정

        // 인터페이스 설정 (마지막)
        this._implements(IAuto);
    }
}

module.exports = Auto;
