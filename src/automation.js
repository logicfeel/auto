
const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');
const DependResolver = require('./depend-resolver');
const { SourceCollection } = require('./original-source');

class Automation {
    
    // private
    __dir = null;
    __alias = null;
    // protected
    _owner = null;  // 소유자
    _install = null;
    _auto = null;
    _package = null;
    _resolver = new DependResolver(this);
    // public
    mod = new AutoCollection(this);
    src = new SourceCollection(this);
    out = new SourceCollection(this);
    dep = new DependCollection(this);
    PATH = {};
    DIR = {
        OUT: 'out',
        SRC: 'src',
        DEP: 'dep',
        INS: 'install',
        PUB: 'publish',
        DIS: 'dist'
    };

    // 프로퍼티
    get name() {
        return this._package.name;
    }
    
    get alias() {
        return this.__alias;
    }
    set alias(val) {
        this.__alias = val;
    }

    constructor(dir) {
        console.log('Automation load..')

        this.__dir = dir;
        // PATH 설정
        this.PATH.SRC = this.__dir + '/src'
        this.PATH.OUT = this.__dir + '/out'
        this.PATH.DEP = this.__dir + '/dep'

        // *.json 로딩
        let installPath;
        let resolvePath;
        let autoPath;
        let packagePath;

        installPath = this.__dir + '/install.json';
        resolvePath = this.__dir + '/resolve.json';
        packagePath = this.__dir + '/package.json';

        // 파일검사
        // 선ㅐ
        if (fs.existsSync(installPath)) this._install = require(installPath);
        if (fs.existsSync(resolvePath)) this._resolve = require(resolvePath);
        if (fs.existsSync(autoPath)) this._auto = require(autoPath);
        // 필수
        if (!fs.existsSync(packagePath)) {
            throw new Error('package.json file fail...');
        } else {
            this._package = require(packagePath);
        }

    }

    // readSource(isFill) {
    //     // this.src.addPath(this.PATH.SRC);
    //     // this.out.addPath(this.PATH.OUT);
    //     this.src.addDir(this.DIR.SRC);
    //     this.out.addDir(this.DIR.OUT);
    //     if (isFill) {
    //         this.src.fillSource();
    //         this.out.fillSource();
    //     }
    //     // 의존서 해결자 가져오기
    //     this._resolver.load();
    // }

    /**
     * 
     * @param {boolean} isSrc false: 구조 로딩, true 구조/데이터 로딩
     * @param {boolean} isOut false: 구조 로딩, true 구조/데이터 로딩
     */
    readSource(isSrc, isOut) {
        if (typeof isSrc === 'boolean') {
            this.src.addDir(this.DIR.SRC);
            if (isSrc === true) this.src.fillSource();
        }
        if (typeof isOut === 'boolean') {
            this.out.addDir(this.DIR.OUT);
            if (isOut === true) this.out.fillSource();
        }
    }

    _getDependList() {
        
        let list = [];
        let prop, auto;
        
        // sub 가져오기
        for (let i = 0; i < this.mod._sub.length; i++) {
            prop = this.mod._sub[i];
            list.push(this.mod[prop]);
        }
        // super 가져오기
        list = list.concat(this._getSuperList());
        return list;
    }

    _getSuperList() {

        let list = [];
        let prop, auto;

        for (let i = 0; i < this.mod._super.length; i++) {
            prop = this.mod._super[i];
            auto = this.mod[prop];
            list.push(auto);
            list = list.concat(auto._getSuperList());
        }
        return list;
    }

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

    /**
     * 
     */
    __readPath() {

    }
}



class AutoCollection extends PropertyCollection {

    // protected
    _super = [];
    _sub = [];
    // _owner = null;

    // public
    name = null;

    // TODO:: owner 명칭 변경 (오타) !!
    constructor(onwer) {
        super(onwer);
    
    }
    
    _getSuperList() {
        
        let arr = [];
        let elm;
        let obj;

        for(let i = 0; i < this._super.length; i++) {
            elm = this[this._super[i]];
            if (elm.mod._super.length > 0) {
                arr = arr.concat(elm.mod._getSuperList());
            }
            obj = {
                key: `${elm.package.name}.${this._super[i]}`,
                value: elm
            };
            arr.push(obj);
        }
        return arr;
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


    getDependList() {
        
        let arr = [];
        let elm;
        let obj;

        for(let i = 0; i < this._sub.length; i++) {
            elm = this[this._sub[i]];
            obj = {
                key: `${elm.package.name}.${this._sub[i]}`,
                value: elm
            }
            arr.push(obj);
        }
        arr = arr.concat(this._getSuperList());
        return arr;
    }

    /**
     * 오토의 버전 검사
     * 엔트리 오토를 기준으로 semmver로 정해진 버전 검사
     * @param {*} obj 오토 객체
     */
    _valid(obj) {
        return true;
    }
    
    /**
     * 오토를 mod 에 추가한다.
     * @param {*} alias 별칭
     * @param {*} obj 오토 객체
     */
    add(alias, obj) {
        if (this._valid(obj)) {
            obj._owner = this._onwer;   // TODO:: 명칭 바꿔야함
            obj.alias = alias;
            super.add(alias, obj);
        } 
    }
    
    sub(alias, obj) {
        this.add(alias, obj);
        // 별칭 이름 등록
        this._sub.push(alias);
        // 의존성 등록
        this._onwer.dep.add(alias, obj.src);
        // 의존 모듈 등록
        // this._owner.dep[`${obj.package.name}.${alias}`] = obj;
    }
    
    super(alias, obj) {
        this.add(alias, obj);
        // 별칭 이름 등록
        this._super.push(alias);
        // 의존 모듈 등록  하위로 
        // this._owner.dep[`${obj.package.name}.${alias}`] = obj;
        // 
    }

    select(seloector) {}

    select(seloector, obj) {}
   
}

class DependCollection extends PropertyCollection {
    
    // TODO:: owner 명칭 변경 (오타) !!
    constructor(onwer) {
        super(onwer);
    }
}

module.exports = Automation;