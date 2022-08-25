
const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');
const DependResolver = require('./depend-resolver');
const { SourceCollection } = require('./original-source');

class Automation {
    
    // private
    __dir = null;
    // protected
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

        this.name = this._package.name;
    }

    readSource(isFill) {
        this.src.addPath(this.PATH.SRC);
        this.out.addPath(this.PATH.OUT);
        if (isFill) {
            this.src.fillSource();
            this.out.fillSource();
        }
        // 의존서 해결자 가져오기
        this._resolver.load();

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
    _owner = null;

    // public
    name = null;

    constructor(owner) {
        super(owner);
    
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
        if (this._valid(obj)) super.add(alias, obj);
    }
    
    sub(alias, obj) {
        this.add(alias, obj);
        // 별칭 이름 등록
        this._sub.push(alias);
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
    
    constructor(owner) {
        super(owner);
    }
}

module.exports = Automation;