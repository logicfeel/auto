/**
 * 템플릿을 독립적으로 사용하는 경우
 */
class AutoTemplate {
    
    baseDir = '';
    srcDir = '';
    
    BASE = {
        SRC: 'src',
        BASE: 'template',
    };
    DIR = {
        DATA: 'data',
        PART: 'part',
        HELP: 'help',   // helper
    }
    PATH = {
        _owner: this,
        get DATA() { return this._owner.PATH.BASE +'/'+ this._owner.DIR.DATA }, 
        get PART() { return this._owner.PATH.BASE +'/'+ this._owner.DIR.PART }, 
        get HELP() { return this._owner.PATH.BASE +'/'+ this._owner.DIR.HELP }, 
    };

    constructor(baseDir, srcDir = baseDir) {
        // 관련 폴더를 설정함
        this.PATH = baseDir;    // 소스 경로
        this.SRC = srcDir;  // 해석 경로
        // 세부적 경로정보가 다를 경우 하위에서 재정의함
    }
}
/*__________________________________________*/
// 독립 모듈
class Template extends AutoTemplate {
    constructor(srcDir) {
        super(__dirname, srcDir);
        // 이곳에 기본 소스경로 파일을 가지고 있다.
    }
}

/*__________________________________________*/
// index.js 에서 독립적 사용
var at = new Template(__dirname);
// 각종 설정들
at.aa = 1;
at.load(/** 가져올 파일 */);
at.build();


/*__________________________________________*/
// 공통 정의
class Automation {
    constructor() {        
    }
    setDir(dir) {
        // 기본 템플릿 설정
        this.template = new AutoTemplate(dir);
    }
}
/*__________________________________________*/
// Automation 에서 덮어쓰기
let autoTemp = new Template(__dirname);
autoTemp.aa = 2; // 속성 설정

class Auto extends Automation {
    constructor() {
        super();
        
        this.template = autoTemp; // 덮어쓰기
    }
}
