const Automation = require('../../src/automation');
let Mod1 = require('../m1/auto');
let Mod1_1 = require('./module/m1/auto');

let mod1 = new Mod1();
let mod2 = new Mod1();
let mod3 = new Mod1_1();


class Auto extends Automation {
    
    kkk = 10
    
    constructor() {
        super(__dirname);

        // 오토 가져오기
        // this.mod.sub('M1', mod1);
        // this.mod.sub('M1', mod2);
        // this.mod.super('M1', mod1);
        this.mod.sub('M1', mod3);

        // 인스톨 경로 설정
        // 앤트리 설정 영억
        // this._install.root = this.LOC.INS;  // 기준 상대 경로
        // this._install.absolute = false;     // 기본 경로설정 : depend, dist, instll 에서 사용
        this._install.defautPath = 0;       // 기본경로 방식 (0:자동, 1:상대, 2:절대)
        // this._install.pathType = 0;         // 경로방식 여부(0:자동, 1:상대, 2:절대)
        this._install.sub = false;          // 하위 로드 여부
        this._install.strict = false;       // 이름 엄격검사 유무
        this._install.over = false;         // 중복제거 유무
        // 하위 설정 영역
        this._install.change = [
            // 순차적으로 처리됨
            {
                dir: 'mod1/area',           // 디렉토리 변경
                rename: ''
            },
            {
                file: 'style.css',          // 파일명 변경
                rename: 'sss.css'
            },
            {
                path: 'mod2/m2.html',       // 완전경로 변경
                rename: 'mod2/m2-2.html',
                absolute: true,             // 절대 경로
                refer: true,                // 참조대상에서 변경 
            }
            // 맨뒤에 map() 콜백 처리됨
        ];
        this._install.map = [
            function(path) {console.log(2)}
        ];

        // 속성 설정
        // 템플릿 설정
        // 메타모델 설정
        // 인터페이스 설정 (마지막)

    }
}

module.exports = Auto;