const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject, Observer } = require('entitybind');
const { DependResolver } = require('./depend-resolver');
const { FileCollection, FolderCollection } = require('./base-path');
const { InstallMap } = require('./source-batch');

/**
 * 오토메이션 클래스
 */
class Automation {
    
    // public
    mod         = new AutoCollection(this);
    src         = new FileCollection(this);
    out         = new FileCollection(this);
    vir         = new FolderCollection(this);
    dep         = new DependCollection(this);
    meta        = new MetaCollection(this);
    resolver    = new DependResolver(this);
    install     = null;
    LOC = {     // location
        OUT: 'out',
        SRC: 'src',
        DEP: 'dep',
        INS: 'install',
        PUB: 'publish',
        DIS: 'dist',
        VIR: 'vir'
    };
    prop = {};
    // protected
    _owner      = null;
    _install    = null;
    _auto       = null;
    _package    = null;
    _resolve    = null;
    _file       = [];
    // private
    #_dir      = [];
    #_alias    = null;
    #_event    = new Observer(this, this);

    // property
    get dir() {
        return this.#_dir;
    }
    get name() {
        return this._package.name;
    }
    get alias() {
        return this.#_alias;
    }
    set alias(val) {
        this.#_alias = val;
    }
    // event
    set onLoaded(fun) {
        this.#_event.subscribe(fun, 'loaded');  // 소스 로딩후
    }
    set onBatch(fun) {
        this.#_event.subscribe(fun, 'batch');
    }
    set onBatched(fun) {
        this.#_event.subscribe(fun, 'batched');
    }

    /**
     * 생성자 
     * @param {*} dir auth 의 위치 : __dirname 지정
     */
     constructor(dir) {
        console.log('Automation load..');

        let installPath;
        let resolvePath;
        let autoPath;
        let packagePath;
        let filePath;

        this.#_dir = dir;

        // *.json 로딩
        installPath = this.#_dir + path.sep + 'install.json';
        resolvePath = this.#_dir + path.sep + 'resolve.json';
        autoPath    = this.#_dir + path.sep + 'auto.json';
        packagePath = this.#_dir + path.sep + 'package.json';
        filePath    = this.#_dir + path.sep + '__BATCH_FILE.json';

        // 선택 파일검사
        if (fs.existsSync(installPath)) this._install = require(installPath);
        if (fs.existsSync(resolvePath)) this._resolve = require(resolvePath);
        if (fs.existsSync(autoPath)) this._auto = require(autoPath);
        if (fs.existsSync(filePath)) this._file = require(filePath);
        
        // 필수 파일검사
        if (!fs.existsSync(packagePath)) {
            throw new Error('package.json file fail...');
        } else {
            this._package = require(packagePath);
        }
        this.install = new InstallMap(this, this._install);
    }

    /**
     * 소스 읽기 (src, out)
     * @param {boolean} isSrc false: 구조 로딩, true 구조/데이터 로딩
     * @param {boolean} isOut false: 구조 로딩, true 구조/데이터 로딩
     */
     readSource(isSrc, isOut) {
        if (typeof isSrc === 'boolean') {
            this.src.addLocation(this.LOC.SRC);
            if (isSrc === true) this.src.fillData();
        }
        if (typeof isOut === 'boolean') {
            this.out.addLocation(this.LOC.OUT);
            if (isOut === true) this.out.fillData();
        }
    }

    /**
     * 오토의 기본경로 설정
     * @param {string} dir auto 경로 : __dirname 기본으로 사용함
     */
    setDir(dir) {
        // TODO::
    }

    /**
     * 강제 의존성 설정
     * @param {string | array} oriPath 원본 경로
     * @param {string | array} depPath 의존 경로
     * @param {object} pos 
     */
    setDepend(oriPath, depPath, pos) {
        // TODO::
    }

    /**
     * 오토모듈이 의존하는 sub, super(상위 super 포함)의 목록
     * 최하위(Leaf)에서 호출처까지 순차인 목록
     * @param {boolean} isSelf 최상위 호출처(오토) 포함 여부
     * @returns {arrary}
     */
    _getDependList(isSelf) {
        
        let list = [], prop, auto;
        
        // sub 가져오기
        for (let i = 0; i < this.dep.count; i++) {
            auto = this.dep[i]._onwer;
            prop = this.dep.propertyOf(i);
            if (this.mod._super.indexOf(prop) < 0) list.push(auto); // sub 가져오기
            else list = list.concat(this._getSuperList());  // super 가져오기
        }

        if (isSelf === null || isSelf === true) list.push(this);    // 자신포함
        return list;
    }

    /**
     * 오토모듈이 의존하는 super(상위 super 포함)의 목록
     * 최하위(Leaf)에서 호출처까지 순차인 목록
     * @param {boolean} isSelf 최상위 호출처(오토) 포함 여부
     * @returns {arrary}
     */
    _getSuperList(isSelf = null) {

        let list = [], prop, auto;

        for (let i = 0; i < this.mod._super.length; i++) {
            list = list.concat(auto._getSuperList());
            prop = this.mod._super[i];
            auto = this.mod[prop];
            list.push(auto);
        }
        if (isSelf === null || isSelf === true) list.push(this);    // 자신포함
        return list;
    }

    /**
     * 전체 오토 목록 
     * 최하위(Leaf)에서 호출처까지 순차인 목록
     * @param {boolean} isSelf 최상위 호출처(오토) 포함 여부
     * @returns {arrary}
     */
    _getAllList(isSelf = null) {

        let list = [], auto;
               
        for (let i = 0; i < this.mod.count; i++) {
            auto = this.mod[i];
            if (auto.mod.count > 0) list = list.concat(auto._getAllList());
            else list.push(auto);
        }
        if (isSelf === null || isSelf === true) list.push(this);    // 자신포함
        return list;
    }


    // 이벤트 호출
    _onLoaded() {
        this.#_event.publish('loaded', this);
    }
    _onBatch(entry) {
        this.#_event.publish('batch', entry);
    }
    _onBatched(entry) {
        this.#_event.publish('batched', entry); 
    }
}

/**
 * 오토컬렉션 클래스
 */
 class AutoCollection extends PropertyCollection {

    // protected
    _super = [];
    _sub = [];

    // TODO:: _W.Collection 에서 owner 명칭 변경 (오타) !!
    constructor(owner) {
        super(owner);
    }

    getObject(p_context) {

        let obj     = {};

        for (let prop in this) {
            if (this[prop] instanceof MetaElement) {
                obj[prop] = this[prop].getObject(p_context);
            } else if (prop.substring(0, 1) !== '_') {
                obj[prop] = this[prop];
            }
        }
        return obj;                      
    }

    
    
    /**
     * 오토를 mod 에 추가한다.
     * @param {*} alias 별칭
     * @param {*} auto 오토 객체
     */
    add(alias, auto) {
        if (this._valid(alias, auto)) {
            auto._owner = this._onwer;   // TODO:: 명칭 바꿔야함
            auto.alias = alias;
            super.add(alias, auto);
        } 
    }
    
    sub(alias, auto) {
        this.add(alias, auto);
        // 별칭 이름 등록
        this._sub.push(alias);
        // 의존성 등록
        this._onwer.dep.add(alias, auto.src);
    }
    
    super(alias, auto) {
        this.add(alias, auto);
        // 별칭 이름 등록
        this._super.push(alias);
        // 의존성 등록
        this._onwer.dep.add(alias, auto.src);
    }

    select(selector, obj) {}

    /**
     * 별칭 중복 검사 및 버전 검사
     * 
     * @param {*} alias 오토 별칭
     * @param {*} auto 오토 객체
     * @return {boolean}
     */
     _valid(alias, auto) {
        // 별칭 중복 검사
        if (super.indexOfName(alias) > -1) {
            throw new Error(' 별칭 중복 오류!! ');
        }
        /**
         * TODO::
         * 엔트리 오토를 기준으로 semmver로 정해진 버전 검사
         */
        return true;
    }
}

/**
 * 의존성컬렉션 클ㅐㅡ
 */
class DependCollection extends PropertyCollection {
    
    constructor(owner) {
        super(owner);
    }
}

/**
 * 메타컬렉션 클래스
 */
 class MetaCollection extends PropertyCollection {
    
    constructor(owner) {
        super(owner);
    }
}

exports.Automation = Automation;