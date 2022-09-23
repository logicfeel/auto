
const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');

class OriginalSource {
    
    // public
    fullPath = '';
    location = null;
    data = null;
    // protected
    _auto = null;
    _ref = [];
    _target = null;
    // private

    // property
    get name() {
        return path.basename(this.fullPath);
    }
    get subDir() {
        return path.dirname(this.subPath);
    }
    get subPath() {
        return path.relative(this._auto.dir + path.sep + this.location, this.fullPath);
    }
    get baseDir() {
        return path.dirname(this.basePath);
    }
    get basePath() {
        return path.relative(this._auto.dir, this.fullPath);
    }

    constructor(auto, fullPath, location) {
        
        let top;
        // 필수 검사 필요!!
        this._auto = auto;
        this.fullPath = fullPath;
        this.location = location;
    }

    /**
     * 참조객체 등록
     * @param {*} src 참조 대상 원본소스
     * @param {*} list 참조 위치 객체
     */
    _addReference(src, list) {
        this._ref.push({
            src: src,
            list: list
        });
    }

    /**
     * 타겟 설정
     * @param {*} tar 
     */
    _setTarget(tar) {
        this._target = tar;
    }
}

class SourceCollection extends PropertyCollection {
     
    constructor(owner) {
        super(owner);
    }

    /**
     * 위치 정치 정보에 따른 addLocation()
     * @param {*} location 
     * @param {*} opt 
     */
    addLocation(location, opt) {

        const _this = this;
        const dir = this._onwer.dir +'/'+ location
        const sep = path.sep;


        // 내부 함수
        function _addPath(path, dir = '') {

            let arr, org, alias;
    
            arr = fs.readdirSync(path);
    
            for (let i = 0; i < arr.length; i++) {
                
                // REVIEW:: 비동기 성능이슈 있음
                
                // 대상 파일의 필터  TODO::
                if (fs.statSync(path +'/'+ arr[i]).isFile()) {
                    // 컬렉션에 등록
                    alias = dir + arr[i];
                    org = new OriginalSource(_this._onwer, path + sep + arr[i], location);
                    _this.add(alias, org);
                } else if (fs.statSync(path + sep + arr[i]).isDirectory()) {
                    _addPath(path + sep + arr[i], arr[i], dir);
                }
            }
        }
        // 폴더가 있는경우만
        if (fs.existsSync(dir)) _addPath(dir);
    }

    fillData() {
        
        let filePath;
        
        for (let i = 0; i < this.list.length; i++) {
            filePath = this.list[i].fullPath;
            this.list[i].data = fs.readFileSync(filePath,'utf-8');
        }        
    }
}


module.exports = { OriginalSource, SourceCollection };