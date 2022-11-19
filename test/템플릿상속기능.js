

class AutoTemplate {
    
    #dirs = [];

    constructor() {}
    /**
     * 초기화
     */
    init() {

    }
    build() {
        this.init();    // 초기화 호출함
    }
}

class TopTemplate extends AutoTemplate {
    constructor() {
        super();
        dir = __dirname;    // 필수!
    }
}

class LeafTemplate extends TopTemplate {
    constructor() {
        super();
        dir = __dirname;    // 필수!
    }
}


/*__________________________________________*/
// 1> Template 독립사용시
// index.js 에서
var t = new AutoTemplate();
t.dir = __dirname;  // [선택] 필요시 경로 설정됨
t.build();      // 소스 출판됨




console.log(0)