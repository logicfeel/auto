const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject, Observer } = require('entitybind');
const { DependResolver } = require('./depend-resolver');
const { FileCollection, FolderCollection } = require('./original-path');
const { InstallMap } = require('./source-batch');
const at = require('./auto-task');
/**
 * 오토메이션 클래스
 */
/**
 * 바인드 명령 (상위)
 * @constructs Automation
 */
class Automation {
    
    /*_______________________________________*/
    // public
    // 주요 객체
    /**
     * 오토 모듈 
     * @type {FileCollection} 
     * @public
     */
    mod             = new AutoCollection(this);
    /**
     * src 소스 
     * @type {FileCollection} 
     * @public
     */
    src             = new FileCollection(this);
    /**
     * out 소스 
     * @type {FileCollection} 
     * @public
     */
    out             = new FileCollection(this);
    /**
     * 가상 폴더 컬렉션
     * @type {FileCollection} 
     * @public
     */
    vir             = new FolderCollection(this);
    /**
     * 의존 소스
     * @type {DependCollection} 
     * @public
     */
    dep             = new DependCollection(this);
    /**
     * 메타 컬렉션
     * @type {MetaCollection} 
     * @public
     */
    meta            = new MetaCollection(this);
    /**
     * 의존성 해결자
     * @type {DependResolver} 
     * @public
     */
    resolver        = null;
    /**
     * install 지도
     * @type {InstallMap} 
     * @public
     */
    install         = null;
    
    /**
     * prop 속성
     * @type {Object}
     * @public
     */prop            = {};       
    // 주요 속성
    isStatic        = false;
    isSaveRelation  = false;    // 관계파일 저장 여부
    isFinal         = false;    // 상속 금지 설정
    title           = '';       // 제목(설명)
    /**
     * 상위폴더 위치
     * @public
     */
    LOC = {
        OUT: 'out',
        SRC: 'src',
        DEP: 'dep',
        INS: 'install',
        PUB: 'publish',
        DIS: 'dist',
        VIR: 'vir'
    };
    // 파일명
    FILE = {
        PACKAGE: 'package.json',
        INSTALL: 'install.json',
        RESOLVER: 'resolver.json',
        PROP: 'prop.json',
        LIST: 'List.json',      // 목록 저장 파일명
        MAP: 'Map.json',        // 맵 저장 파일명
    };
    // 주요경로
    PATH = {
        auto: this,    // auto
        get PACKAGE() { return this.auto.dir + path.sep + this.auto.FILE.PACKAGE },
        get INSTALL() { return this.auto.dir + path.sep + this.auto.FILE.INSTALL },
        get RESOLVER() { return this.auto.dir + path.sep + this.auto.FILE.RESOLVER },
        get PROP() { return this.auto.dir + path.sep + this.auto.FILE.PROP }
    };
    /*_______________________________________*/
    // protected
    static _instance    = null;     // 싱글톤 객체 위치
    _isSingleton        = false;    // getInstance 생성시 true 변경됨
    _owner              = null;
    _file               = [];
    _subTitle           = '';      // add 설명
    _task               = at.AutoTask.getInstance();
    /*_______________________________________*/    
    // private
    #modName            = '';
    #dir                = [];
    #alias              = '';
    #modTyped           = 0;
    #event              = new Observer(this, this);
    /*_______________________________________*/        
    // property
    get modName() {
        return this.#modName;
    }
    get alias() {
        return this.#alias;
    }
    set alias(val) {
        this.#alias = val;
    }
    get dir() {
        let size = this.#dir.length;
        if (size === 0) throw new Error(' start [dir] request fail...');
        return this.#dir[size - 1];
    }
    set dir(val) {
        if (this.isFinal === true && this.#dir.length > 0) throw new Error('최종 오토 (상속금지)는 dir 설정할 수 없습니다.');        
        this.#dir.push(val);
        // package, prop, install, resolver.json 로딩
        // setter별 처리
        this.#loadDir(val);
        console.log('Automation load path :: ' + val);
    }
    get dirs() {
        return this.#dir;
    }
    get modTyped() {
        return this.#modTyped;
    }
    set modTyped(val) {
        this.#modTyped = val;
    }
    /*_______________________________________*/        
    // event
    set onLoad(fun) {
        // this.#event.subscribe(fun, 'load');
        this._task.onLoad = fun;
    }
    set onRead(fun) {
        this.#event.subscribe(fun, 'read');
    }
    set onResolve(fun) {
        this.#event.subscribe(fun, 'resolve');
    }
    set onResolved(fun) {
        this.#event.subscribe(fun, 'resolved');
    }
    set onSave(fun) {
        // this.#event.subscribe(fun, 'save');
        this._task.onSave = fun;
    }
    set onSaved(fun) {
        // this.#event.subscribe(fun, 'saved');
        this._task.onSaved = fun;
    }

    /**
     * 생성자 
     */
    constructor() {
        // if (typeof dir === 'string' && dir.length > 0) {
        //     this.dir = dir;
        //     this.#isFinal = true;   // 최종 auto 로 설정
        // }    
        // console.log('Automation load..');
    }

    /**
     * isStatic = true 인 경우 객체 생성
     * @returns {*}
     */
    static getInstance() {
        
        let instance = this._instance;

        if (!instance) {
            instance = new this();
        }
        /**
         * REVIEW:: 특수한 경우여서 생성후 검사한다. static 이슈
         */
        // getInstace() 사용타입 검사
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
        // 이벤트 발생
        this._onRead(this._task.cursor, this);
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
    writeParentObject() {
        // console.log('보모 객체 및 파일 덮어쓰기');

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
     * 객체(오토모듈) 맵 쓰기
     * @param {*} opt 옵션 0: -all, 1: "기본", 2: -detail, 3: -depend
     */
    writeObjectMap(opt = 1) {
        
        let _this = this;

        // modType = 0:entry, 1:mod, 2:sub, 3: super
        // isSubCall
        function createModObject(auto, option, modType = 0, isSubCall = true) {
        
            let obj = {}, child;
            let arrDepend = [];

            obj.name = auto.modName;
            if (auto.alias.length > 0) obj.alias = auto.alias;
            if (auto.title.length > 0) obj.title = auto.title;
            if (auto._subTitle.length > 0) obj.subTitle = auto._subTitle;
            if (auto.isStatic === true) obj.static = true;
            if (modType === 2) obj.sub = true;
            if (modType === 3) obj.super = true;
            if (Array.isArray(auto._interface) && auto._interface.length > 0) {
                obj.interface = [];
                auto._interface.forEach(val => obj.interface.push(val.name));
            }
            // -detail 
            if (option === 2 || option === 3) {
                obj.file = [];
                for (let i = 0; i < auto.src.count; i++) {
                    obj.file.push(auto.src[i].localPath);
                }
                for (let i = 0; i < auto.out.count; i++) {
                    obj.file.push(auto.out[i].localPath);
                }
            }

            if (isSubCall !== true) return obj; // 하위호출 안함

            if (option === 3) {    // option : -depend

                arrDepend = _this._getDependList(false);
                if (arrDepend.length > 0) {
                    child = obj.depend = [];
                    arrDepend.forEach(val => child.push(createModObject(val, option, val.modTyped, false)));
                }
            } else {            // option 0, 1 기본타입
                
                if (auto.mod.count > 0) {
                    child = obj.module = [];
                    for (let i = 0; i < auto.mod.count; i++) {
                        child.push(createModObject(auto.mod[i], option, auto.mod[i].modTyped, true));
                    }
                }
            }
            return obj;
        }

        // 
        function saveFile(option) {
            
            let wriObj = {}, data, saveName;            
            
            wriObj = createModObject(_this, option, 0);  
            saveName = path.basename(_this.FILE.MAP, '.json');
            if (option === 2) saveName += '_Detail';
            if (option === 3) saveName += '_Depend';
            saveName += '_'+ _this.modName + '.json';
            
            data = JSON.stringify(wriObj, null, '\t');
            fs.writeFileSync(_this.dir + path.sep + saveName, data, 'utf8');
        }

        if (opt === 0) {    // 전체 파일 쓰기
            saveFile(1);
            saveFile(2);
            saveFile(3);
            // 함수 추가시 확장함
        } else {            // 단일 파일 쓰기
            saveFile(opt);
        }
    }

    /**
     * 객체(오토모듈) 목록 쓰기
     * @param {*} opt 옵션 0: -all, 1: "기본", 2: -detail,  3: -history
     */
     writeObjectList(opt = 1) {

        let _this = this, list;

        function createModObject(auto, option, modType = 0) {
        
            let obj = {}, child;
            let arrDepend = [];

            function fileInfoObject(file) {
                
                let fileObj = {}, histry = [];
                
                // fileObj.name = file.localPath;
                if (file.isStatic === true) fileObj.static = true;
                if (file.comment.length > 0) fileObj.comment = file.comment;
                if (option === 3) { // --history 옵션
                    fileObj.history = [];
                }
                if (file._auto._owner !== null) {   // auto 이면

                }

                return fileObj;
            }

            obj.name = auto.modName;
            if (auto.alias.length > 0) obj.alias = auto.alias;
            if (auto.title.length > 0) obj.title = auto.title;
            if (auto._subTitle.length > 0) obj.subTitle = auto._subTitle;
            if (auto.isStatic === true) obj.static = true;
            if (modType === 2) obj.sub = true;
            if (modType === 3) obj.super = true;
            if (Array.isArray(auto._interface) && auto._interface.length > 0) {
                obj.interface = [];
                auto._interface.forEach(val => obj.interface.push(val.name));
            }
            // location : 위치
            // -detail, -history
            if (option === 2 || option === 3) {
                obj.file = {};
                for (let i = 0; i < auto.src.count; i++) {
                    obj.file[auto.src[i].localPath] = fileInfoObject(auto.src[i]);
                    
                    // obj.file.push( fileInfoObject(auto.src[i]));
                    // comment : 파일 설명
                }
                for (let i = 0; i < auto.out.count; i++) {
                    obj.file[auto.out[i].localPath] = fileInfoObject(auto.out[i]);
                }
            }
            return obj;
        }

        function saveFile(option) {
            
            let wriList = [], data, saveName;            

            list = _this._getAllList(true);
            for (let i = list.length - 1; i > -1; i--) {
                wriList.push(createModObject(list[i], option));
            }
    
            saveName = path.basename(_this.FILE.LIST, '.json');
            if (option === 2) saveName += '_Detail';
            if (option === 3) saveName += '_History';
            saveName += '_'+ _this.modName + '.json';
            
            data = JSON.stringify(wriList, null, '\t');
            fs.writeFileSync(_this.dir + path.sep + saveName, data, 'utf8');
        }

        if (opt === 0) {    // 전체 파일 쓰기
            saveFile(1);
            saveFile(2);
            saveFile(3);
            // 함수 추가시 확장함
        } else {            // 단일 파일 쓰기
            saveFile(opt);
        }
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
        for (let i = 0; i < this.mod.count; i++) {
            if (this.mod[i].modTyped === 3) {
                list = list.concat(this.mod[i]._getSuperList());
            } else if (this.mod[i].modTyped === 2) {
                list.push(this.mod[i]);
            }
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

        for (let i = 0; i < this.mod.count; i++) {
            if (this.mod[i].modTyped === 3) {
                list = list.concat(this.mod[i]._getSuperList(false));
                list.push(this.mod[i]);
            }
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


    // 소스 읽은 후 호출 이벤트
    _onRead(task, auto) {
        this.#event.publish('read', task, this);
    }
    // 의존성 해결 전 호출 이벤트
    _onResolve(task, auto) {
        this.#event.publish('resolve', task, this);
    }
    // 의존성 해결 후 호출 이벤트
    _onResolved(task, auto) {
        this.#event.publish('resolved', task, this);
    }
    

    /**
     * 오토 경로를 기준으로 로딩
     * package.json, install.json, resolver.json, prop.json
     * @param {string} dir auto 의 경로
     */
    #loadDir(dir) {
        
        let _package, _install, _resolver, _prop;

        // 필수 파일 검사
        if (!fs.existsSync(this.PATH.PACKAGE)) {
            throw new Error('package.json file fail...');
        } else {
            _package = require(this.PATH.PACKAGE);
            this.#modName = _package.name;     // auto.modName 설정
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

    /**
     * 객체 얻기
     * @param {*} p_context 
     * @returns {*}
     */
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
     * @param {*} modType 오토 객체
     */
    add(alias, auto, subTitle = '', modType = 1) {
        if (this._valid(alias, auto)) {
            // auto._owner = this._onwer;   // TODO:: 명칭 바꿔야함

            auto._owner     = this._auto;   // TODO:: 명칭 바꿔야함
            auto._subTitle  = subTitle;
            auto.alias      = alias;
            auto.modTyped   = modType;

            super.add(alias, auto);
            // this[alias]._owner = this._auto;
            // this[alias].alias = alias;
        }
    }
    
    /**
     * sub 로 추가 : 단일 의존성
     * @param {*} alias 
     * @param {*} auto 
     * @param {*} subTitle 
     */
    sub(alias, auto, subTitle = '') {
        this.add(alias, auto, subTitle, 2);
        // 별칭 이름 등록
        this._sub.push(alias);
        // 의존성 등록
        this._onwer.dep.add(alias, auto.src);
    }
    
    /**
     * super 로 추가, 대상의 super 까지 같이 의존함
     * @param {*} alias 
     * @param {*} auto 
     * @param {*} subTitle 
     */
    super(alias, auto, subTitle = '') {
        this.add(alias, auto, subTitle, 3);
        // 별칭 이름 등록
        this._super.push(alias);
        // 의존성 등록
        this._onwer.dep.add(alias, auto.src);
    }

    /**
     * 오토 모듈 조회
     * @param {*} selector 
     * @param {*} obj 
     */
    select(selector, obj) {
        // TODO::
    }

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
    
    /**
     * 생성자
     * @param {*} owner 
     */
    constructor(owner) {
        super(owner);
    }
}

/**
 * 메타컬렉션 클래스
 */
 class MetaCollection extends PropertyCollection {
    
    /**
     * 생성자
     * @param {*} owner 
     */
    constructor(owner) {
        super(owner);
    }
}

exports.Automation = Automation;