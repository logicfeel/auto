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
    static isStatic    = false;
    mod         = new AutoCollection(this);
    src         = new FileCollection(this);
    out         = new FileCollection(this);
    vir         = new FolderCollection(this);
    dep         = new DependCollection(this);
    meta        = new MetaCollection(this);
    
    resolver        = null;
    install         = null;
    prop            = {};
    isSaveRelation  = false;
    LOC = {
        OUT: 'out',
        SRC: 'src',
        DEP: 'dep',
        INS: 'install',
        PUB: 'publish',
        DIS: 'dist',
        VIR: 'vir'
    };
    FILE = {
        PACKAGE: 'package.json',
        INSTALL: 'install.json',
        RESOLVER: 'resolver.json',
        PROP: 'prop.json'
    };
    PATH = {
        auto: this,    // auto
        get PACKAGE() { return this.auto.dir + path.sep + this.auto.FILE.PACKAGE },
        get INSTALL() { return this.auto.dir + path.sep + this.auto.FILE.INSTALL },
        get RESOLVER() { return this.auto.dir + path.sep + this.auto.FILE.RESOLVER },
        get PROP() { return this.auto.dir + path.sep + this.auto.FILE.PROP }
    };
    // protected
    static _instance    = null;     // 싱글톤 객체 위치
    _isSingleton        = false;    // getInstance 생성시 true 변경됨
    _owner              = null;
    // _install    = null;     // 삭제대상
    // _auto       = null;     // 삭제대상
    // _package    = null;     // 삭제대상
    // _resolve    = null;     // 삭제대상
    _file           = [];
    
    // private
    #name           = '';
    #dir            = [];
    #alias          = '';
    #event          = new Observer(this, this);
    #isFinal        = false;    // 상속 금지 설정
    
    // static #instance = null;

    // property
    get dir() {
        let size = this.#dir.length;
        if (size === 0) throw new Error(' start [dir] request fail...');
        return this.#dir[size - 1];
    }
    set dir(val) {
        if (this.#isFinal === true) throw new Error('최종 오토 (상속금지)는 dir 설정할 수 없습니다.');        
        this.#dir.push(val);
        // package, prop, install, resolver.json 로딩
        // setter별 처리
        this.#loadDir(val);
    }
    get dirs() {
        return this.#dir;
    }
    get name() {
        return this.#name;
    }
    get alias() {
        return this.#alias;
    }
    set alias(val) {
        this.#alias = val;
    }
    // event
    set onLoaded(fun) {
        this.#event.subscribe(fun, 'loaded');  // 소스 로딩후
    }
    set onBatch(fun) {
        this.#event.subscribe(fun, 'batch');
    }
    set onBatched(fun) {
        this.#event.subscribe(fun, 'batched');
    }

    /**
     * 생성자 
     * @param {*} dir auth 의 위치 : __dirname 지정
     */
    //  constructor(dir) {
    //     console.log('Automation load..');

    //     let installPath;
    //     let resolvePath;
    //     let autoPath;
    //     let packagePath;
    //     let filePath;

    //     this.#dir = dir;

    //     // *.json 로딩
    //     installPath = this.#dir + path.sep + 'install.json';
    //     resolvePath = this.#dir + path.sep + 'resolve.json';
    //     autoPath    = this.#dir + path.sep + 'auto.json';
    //     packagePath = this.#dir + path.sep + 'package.json';
    //     filePath    = this.#dir + path.sep + '__BATCH_FILE.json';

    //     // 선택 파일검사
    //     if (fs.existsSync(installPath)) this._install = require(installPath);
    //     if (fs.existsSync(resolvePath)) this._resolve = require(resolvePath);
    //     if (fs.existsSync(autoPath)) this._auto = require(autoPath);
    //     if (fs.existsSync(filePath)) this._file = require(filePath);
        
    //     // 필수 파일검사
    //     if (!fs.existsSync(packagePath)) {
    //         throw new Error('package.json file fail...');
    //     } else {
    //         this._package = require(packagePath);
    //     }
    //     this.install = new InstallMap(this, this._install);
    // }
    constructor(dir) {
        
        const _this = this;
        
        console.log('Automation load..');
        
        
 
    
        if (typeof dir === 'string' && dir.length > 0) {
            this.dir = dir;
            this.#isFinal = true;   // 최종 auto 로 설정
        }

        // this.PATH = {
        //     get PACKAGE(){ return _this.dir + path.sep + 'package.json' }
        // };
    
    }

    static getInstance() {
        
        let instance = this._instance;

        if (!instance) {
            instance = new this();
        }
        /**
         * REVIEW:: 특수한 경우여서 생성후 검사한다. static 이슈
         */
        if (instance.isStatic !== true) {
            throw new Error(' static 으로 설정된 auto만 사용할수 있습니다. new 을 사용해서 생성.');
        }
        instance._isSingleton = true;   // add 시점에 검사함
        return instance;
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
     * 강제 의존성 설정
     * @param {string | array} oriPath 원본 경로
     * @param {string | array} depPath 의존 경로
     * @param {object} pos 
     */
    setDepend(oriPath, depPath, pos) {
        // TODO::
    }

    /**
     * 부모의 객체를 가져와 파일로 쓰다
     *  install, resolver, prop, src, out
     */
    coverParentObject() {
        console.log('보모 객체 및 파일 덮어쓰기');

        let data, dirname;

        function copySource(collection, dir) {
            
            let  fullPath, savePath;
            
            for (let i = 0; i < collection.count; i++) {
                fullPath = collection[i].fullPath;
                savePath = dir + path.sep + collection[i].localPath;
                if (!fs.existsSync(savePath)) {
                    dirname = path.dirname(savePath);   
                    if(!fs.existsSync(dirname)) {
                        fs.mkdirSync(dirname, {recursive: true} );  // 디렉토리 만들기
                    }
                    fs.copyFileSync(fullPath, savePath);
                }
            }    
        }

        if (!fs.existsSync(this.PATH.INSTALL)) {
            data = JSON.stringify(this.install.getObject(), null, '\t');
            fs.writeFileSync(this.PATH.INSTALL, data, 'utf8');             
        }
        if (!fs.existsSync(this.PATH.RESOLVER)) {
            data = JSON.stringify(this.resolver.getObject(), null, '\t');
            fs.writeFileSync(this.PATH.RESOLVER, data, 'utf8');             
        }
        if (!fs.existsSync(this.PATH.PROP)) {
            data = JSON.stringify(this._getpropObject(), null, '\t');
            fs.writeFileSync(this.PATH.PROP, data, 'utf8');             
        }
        // src, out 가져오기
        copySource(this.src, this.dir);
        copySource(this.out, this.dir);        
    }

    /**
     * prop 객체 가져오기
     */
    _getpropObject() {
        return this.prop;
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
        this.#event.publish('loaded', this);
    }
    _onBatch(entry) {
        this.#event.publish('batch', entry);
    }
    _onBatched(entry) {
        this.#event.publish('batched', entry); 
    }

    // 폴더에 
    #loadDir(dir) {
        
        // let packagePath;
        // let installPath;
        // let resolvePath;
        // let propPath;
        // let filePath;
        let _package, _install, _resolver, _prop;

        // *.json 로딩
        // packagePath = dir + path.sep + this.FILE.PACKAGE;
        // installPath = dir + path.sep + this.FILE.INSTALL;
        // resolvePath = dir + path.sep + this.FILE.RESOLVER;
        // propPath    = dir + path.sep + this.FILE.PROP;
        
        // TODO:: 위치 찾아야함
        // 엔트리에서 로딩해야함
        // filePath    = dir + path.sep + '__BATCH_FILE.json';
        // if (fs.existsSync(filePath)) this._file = require(filePath);

        // 필수 파일 검사
        if (!fs.existsSync(this.PATH.PACKAGE)) {
            throw new Error('package.json file fail...');
        } else {
            _package = require(this.PATH.PACKAGE);
            this.#name = _package.name;     // auto.name 설정
        }

        // 선택 파일 검사
        /**
         * 파일이 존재하면 새로 만들어고(덮어씀), 파일이 없으면 기존 객체 사용
         */
        if (fs.existsSync(this.PATH.INSTALL)) _install = require(this.PATH.INSTALL);
        if (this.install === null || _install) this.install = new InstallMap(this, _install);

        if (fs.existsSync(this.PATH.RESOLVER)) _resolver = require(this.PATH.RESOLVER);
        if (this.resolver === null || _resolver) this.resolver = new DependResolver(this, _resolver);

        if (fs.existsSync(this.PATH.PROP)) _prop = require(this.PATH.PROP);
        if (_prop) this.prop = _prop;
    }
}

/**
 * 오토컬렉션 클래스
 */
 class AutoCollection extends PropertyCollection {

    // protected
    _super = [];
    _sub = [];
    _auto = null;

    // TODO:: _W.Collection 에서 owner 명칭 변경 (오타) !!
    constructor(owner) {
        super(owner);
        this._auto = owner;
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
            // auto._owner = this._onwer;   // TODO:: 명칭 바꿔야함

            auto._owner = this._auto;   // TODO:: 명칭 바꿔야함
            auto.alias = alias;
            super.add(alias, auto);
            
            // this[alias]._owner = this._auto;
            // this[alias].alias = alias;

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
        // static 검사
        if (auto.isStatic == true && auto._isSingleton !== true) {
            throw new Error('static auto 는 getInstance() 를 통해서 생성해야 합니다. ');
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