const {Automation} = require('../../src/automation');


class Auto extends Automation {
    constructor() {
        super(__dirname);

        // 오토 가져오기
        this.vir.add('aaa/bbb');

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
            auto.src['inc/left.css'].addDepend(auto.src['m1.html']);    // 객체로 추가
            // 확장
            auto.setDepend('src/inc/left.css', 'm1.html');
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
    }
}

module.exports = Auto;
