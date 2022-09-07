
const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');
const DependResolver = require('./depend-resolver');
const { SourceCollection } = require('./original-source');

/**
 * 오토 클래스
 */
class Automation {
    
    // public
    mod         = new AutoCollection(this);
    src         = new SourceCollection(this);
    out         = new SourceCollection(this);
    dep         = new DependCollection(this);
    resolver    = new DependResolver(this);
    LOC = {     // location
        OUT: 'out',
        SRC: 'src',
        DEP: 'dep',
        INS: 'install',
        PUB: 'publish',
        DIS: 'dist'
    };
    // protected
    _owner      = null;
    _install    = null;
    _auto       = null;
    _package    = null;
    _resolve    = null;
    // private
    #dir      = null;
    #alias    = null;

    // property
    get dir() {
        return this.#dir;
    }
    get name() {
        return this._package.name;
    }
    get alias() {
        return this.#alias;
    }
    set alias(val) {
        this.#alias = val;
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

        this.#dir = dir;

        // *.json 로딩
        installPath = this.#dir + path.sep + 'install.json';
        resolvePath = this.#dir + path.sep + 'resolve.json';
        autoPath    = this.#dir + path.sep + 'auto.json';
        packagePath = this.#dir + path.sep + 'package.json';

        // 선택 파일검사
        if (fs.existsSync(installPath)) this._install = require(installPath);
        if (fs.existsSync(resolvePath)) this._resolve = require(resolvePath);
        if (fs.existsSync(autoPath)) this._auto = require(autoPath);
        
        // 필수 파일검사
        if (!fs.existsSync(packagePath)) {
            throw new Error('package.json file fail...');
        } else {
            this._package = require(packagePath);
        }

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
     * 오토모듈이 의존하는 sub, super(상위 super 포함)의 목록
     * @param {boolean} isSelf 자신 포함 여부
     * @returns {arrary}
     */
    _getDependList(isSelf) {
        
        let list = [];
        let prop, auto;
        
        if (isSelf) list.push(this);    // 자신포함

        // sub 가져오기
        for (let i = 0; i < this.mod._sub.length; i++) {
            prop = this.mod._sub[i];
            auto = this.mod[prop];
            list.push(auto);
        }
        // super 가져오기
        list = list.concat(this._getSuperList());
        return list;
    }

    /**
     * 오토모듈이 의존하는 super(상위 super 포함)의 목록
     * @param {boolean} isSelf 자신 포함 여부
     * @returns {arrary}
     */
    _getSuperList(isSelf) {

        let list = [];
        let prop, auto;

        if (isSelf) list.push(this);    // 자신포함

        for (let i = 0; i < this.mod._super.length; i++) {
            prop = this.mod._super[i];
            auto = this.mod[prop];
            list.push(auto);
            list = list.concat(auto._getSuperList());
        }
        return list;
    }

    /**
     * 전체 오토모듈 목록
     * @param {boolean} isSelf 자신 포함 여부
     * @returns {arrary}
     */
    _getAllList(isSelf) {
        let list = [];
        let prop, auto;
        
        if (isSelf) list.push(this);    // 자신포함
        
        for (let i = 0; i < this.mod.count; i++) {
            auto = this.mod[i];
            list.push(auto);
            list = list.concat(auto._getAllList());
        }
        return list;
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

    // _getSuperList() {
        
    //     let arr = [];
    //     let elm;
    //     let obj;

    //     for(let i = 0; i < this._super.length; i++) {
    //         elm = this[this._super[i]];
    //         if (elm.mod._super.length > 0) {
    //             arr = arr.concat(elm.mod._getSuperList());
    //         }
    //         obj = {
    //             key: `${elm.package.name}.${this._super[i]}`,
    //             value: elm
    //         };
    //         arr.push(obj);
    //     }
    //     return arr;
    // }



    // getDependList() {
        
    //     let arr = [];
    //     let elm;
    //     let obj;

    //     for(let i = 0; i < this._sub.length; i++) {
    //         elm = this[this._sub[i]];
    //         obj = {
    //             key: `${elm.package.name}.${this._sub[i]}`,
    //             value: elm
    //         }
    //         arr.push(obj);
    //     }
    //     arr = arr.concat(this._getSuperList());
    //     return arr;
    // }

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
    }

    select(selector, obj) {}   
}

class DependCollection extends PropertyCollection {
    
    // TODO:: owner 명칭 변경 (오타) !!
    constructor(onwer) {
        super(onwer);
    }
}

module.exports = Automation;