
const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');

class OriginalSource {
    
    // public
    content = null;
    fullPath = '';
    location = null;
    // protected
    _auto = null;
    _ref = [];
    _target = null;
    // private

    // basePath = '';
    // subDir = null;
    // name = null;

    // constructor(onwer, fullPath, path) {
    //     // 필수 검사 필요!!
    //     this._auto = onwer;
    //     this.fullPath = fullPath;
    //     // TODO:: win, unix 방식 경로 설정가능하게!!
    //     this.basePath = '/'+ path.relative(this._auto.__dir, this.fullPath);
    //     this.path = path;
    // }

    // 프로퍼티
    get name() {
        return path.basename(this.fullPath);
    }
    get subDir() {
        return path.dirname(this.subPath);
    }
    get subPath() {
        return path.relative(this._auto.__dir + path.sep + this.location, this.fullPath);
    }
    get baseDir() {
        return path.dirname(this.basePath);
    }
    get basePath() {
        return path.relative(this._auto.__dir, this.fullPath);
    }

    constructor(onwer, fullPath, location) {
        
        let top;
        // 필수 검사 필요!!
        this._auto = onwer;
        this.fullPath = fullPath;
        this.location = location;

        // TODO:: win, unix 방식 경로 설정가능하게!!
        // this.basePath = '/'+ path.relative(this._auto.__dir +'/'+ topDir, this.fullPath);
        // this.path = path;
    }
}

class SourceCollection extends PropertyCollection {
     
    // private
     #sep = path.sep;

    constructor(onwer) {
        super(onwer);
    }


    /**
     * Path 정보를 통해서 컬렉션을 등록한다.
     * @param {*} path 
     * @param {*} isSub 
     * @param {*} opt 
     */
    // addPath(path, isSub = true, opt) {

    //     const _this = this;

    //     // 내부 함수
    //     function _addPath(path, dir = '') {

    //         let arr, org, alias;
    
    //         arr = fs.readdirSync(path);
    
    //         for (let i = 0; i < arr.length; i++) {
                
    //             // REVIEW:: 비동기 성능이슈 있음
                
    //             // 대상 파일의 필터  TODO::
    //             if (fs.statSync(path +'/'+ arr[i]).isFile()) {
    //                 // 컬렉션에 등록
    //                 alias = dir + arr[i];
    //                 org = new OriginalSource(_this._onwer, path +'/'+ arr[i], alias);
    //                 _this.add(alias, org);
    //             } else if (isSub && fs.statSync(path +'/'+arr[i]).isDirectory()) {
    //                 _addPath(path + '/' + arr[i], arr[i] + '/', dir);
    //             }
    //         }
    //     }
        
    //     _addPath(path);
    // }

    addDir(location, opt) {

        const _this = this;
        const dir = this._onwer.__dir +'/'+ location
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

    fillSource() {
        
        let filePath;
        
        for (let i = 0; i < this.list.length; i++) {
            filePath = this.list[i].fullPath;
            this.list[i].content = fs.readFileSync(filePath,'utf-8');
        }        
    }
}


module.exports = { OriginalSource, SourceCollection };