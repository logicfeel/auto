
const fs = require('fs');
const path = require('path');
const {MetaElement, PropertyCollection, MetaObject} = require('entitybind');

class Automation {
    
    // private
    _dir = null;
    // protected
    _install = null;
    _resolve = null;
    _auto = null;
    _package = null;
    // public
    mod = new AutoCollection(this);
    src = new SourceCollection(this);      // 소스
    

    constructor(dir) {
        console.log('Automation load..')

        this._dir = dir;

        // *.json 로딩
        let installPath;
        let resolvePath;
        let autoPath;
        let packagePath;

        installPath = this._dir + '/install.json';
        resolvePath = this._dir + '/resolve.json';
        packagePath = this._dir + '/package.json';

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
}



class AutoCollection extends PropertyCollection {

    // protected
    _super = [];
    _sub = [];
    _onwer = null;

    // public
    name = null;

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
        if (this._valid(obj)) super.add(alias, obj);
    }
    
    sub(alias, obj) {
        this.add(alias, obj);
        // 별칭 이름 등록
        this._sub.push(alias);
        // 의존 모듈 등록
        // this._onwer.dep[`${obj.package.name}.${alias}`] = obj;
    }
    
    super(alias, obj) {
        this.add(alias, obj);
        // 별칭 이름 등록
        this._super.push(alias);
        // 의존 모듈 등록  하위로 
        // this._onwer.dep[`${obj.package.name}.${alias}`] = obj;
        // 
    }

    select(seloector) {}

    select(seloector, obj) {}
   
}

module.exports = Automation;