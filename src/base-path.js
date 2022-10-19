const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');

/**
 * 의존성 파일시스템
 */
class BasePath {
    
    //public
    location = null;
    fullPath = '';
    /**
     * null : 이름변경 O, 내용변경 O
     * true : 이름변경 X, 내용변경 X
     * false : 이름변경 X, 내용변경 O
     */
    isStatic = null;
    // protected
    _auto = null;
    _target = null;

    // property
    get name() {
        throw new Error(' name 프로퍼티를 정의해야 합니다.');
    }
    get subDir() {
        throw new Error(' subDir 프로퍼티를 정의해야 합니다.');
    }
    get subPath() {
        throw new Error(' subPath 프로퍼티를 정의해야 합니다.');
    }
    get localDir() {
        throw new Error(' localDir 프로퍼티를 정의해야 합니다.');
    }
    get localPath() {
        throw new Error(' localPath 프로퍼티를 정의해야 합니다.');
    }
    constructor(auto, location) {
        this._auto = auto;
        this.location = location;
    }

    /**
     * 타겟 설정
     * @param {*} tar 
     */
     _setTarget(tar) {
        this._target = tar;
    }
}

/**
 * 가상폴더 클래스
 */
class VirtualPath extends BasePath {

    // property
    get name() {
        return null;
    }
    get subDir() {
        return this.fullPath;
    }
    get subPath() {
        return this.fullPath;
    }
    get localDir() {
        return this.fullPath;
    }
    get localPath() {
        return this.fullPath;
    }

    constructor(auto, localPath) {
        super(auto, 'vir');
        
        // 필수 검사 필요!!
        this.fullPath = localPath;
    }

}

/**
 * 비텍스트파일 클래스
 */
class NonTextFile extends BasePath {
    
    // public

    // protected
    _dep = [];

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
    get localDir() {
        return path.dirname(this.localPath);
    }
    get localPath() {
        return path.relative(this._auto.dir, this.fullPath);
    }

    constructor(auto, fullPath, location) {
        super(auto, location);

        this.fullPath = fullPath;
    }

    /**
     * 참조객체 등록
     * @param {*} src 참조 대상 원본소스
     * @param {*} list 참조 위치 객체
     */
     _addDepend(ref, pos) {
        this._dep.push({
            ref: ref,
            pos: pos
        });
    }
}

/**
 * 텍스트파일 클래스
 */
class TextFile extends NonTextFile {

    // public
    data = null;

    // property

    constructor(auto, fullPath, location) {
        super(auto, fullPath, location);
    }

}

/**
 * 메타 컬렉션
 */
 class FileCollection extends PropertyCollection {
    
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

            let arr, file, alias;
    
            arr = fs.readdirSync(path);
    
            for (let i = 0; i < arr.length; i++) {
                
                // REVIEW:: 비동기 성능이슈 있음
                
                // 대상 파일의 필터  TODO::
                if (fs.statSync(path +'/'+ arr[i]).isFile()) {
                    // 컬렉션에 등록
                    alias = dir + arr[i];
                    file = new TextFile(_this._onwer, path + sep + arr[i], location);
                    _this.add(alias, file);
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

/**
 * 메타컬렉션 클래스
 */
 class MetaCollection extends PropertyCollection {
    
    constructor(owner) {
        super(owner);
    }
}

exports.BasePath = BasePath;
exports.VirtualPath = VirtualPath;
exports.NonTextFile = NonTextFile;
exports.TextFile = TextFile;
exports.FileCollection = FileCollection;
exports.MetaCollection = MetaCollection;