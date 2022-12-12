const fs = require('fs');
const path = require('path');
const isBinaryPath = require('is-binary-path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');
/**
 * 의존성 파일시스템
 */
class OriginalPath {
    
    /*_______________________________________*/        
    //public
    // location = null;
    // fullPath = '';
    /**
     * null : 이름변경 O, 내용변경 O
     * true : 이름변경 X, 내용변경 X
     * false : 이름변경 X, 내용변경 O
     */
    isStatic = null;
    comment = '';   // 파일 설명
    
    /*_______________________________________*/        
    // protected
    _auto = null;
    _target = null;
    
    /*_______________________________________*/        
    // private
    #location   = null;
    #dir        = null;
    
    /*_______________________________________*/        
    // property
    get location() {
        return this.#location;
    }
    get dir() {
        return this.#dir;
    }
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
    
    /**
     * 생성자
     * @param {*} auto 
     * @param {*} location 
     * @param {*} dir 
     */
    constructor(auto, location, dir) {
        this._auto = auto;
        this.#location = location;
        this.#dir = dir;
    }

    /*_______________________________________*/        
    // protected method

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
class VirtualFolder extends OriginalPath {

    /*_______________________________________*/        
    // private
    #fullPath = null;

    /*_______________________________________*/        
    // property
    get fullPath() {
        return this.#fullPath;
    }
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

    /**
     * VirtualFolder 생성자
     * @extends OriginalPath
     * @param {*} auto 소유하는 auto
     * @param {*} localPath 
     * @param {*} dir 
     */
    constructor(auto, localPath, dir) {
        super(auto, 'vir', dir);
        
        // 필수 검사 필요!!
        this.#fullPath = localPath;
    }

}

/**
 * 비텍스트파일 클래스
 */
class NonTextFile extends OriginalPath {
    
    /*_______________________________________*/        
    // public
    
    /*_______________________________________*/        
    // protected
    _dep = [];
    
    /*_______________________________________*/        
    // private
    #fullPath = null;
    
    /*_______________________________________*/        
    // property
    get fullPath() {
        return this.#fullPath;
    }
    get name() {
        return path.basename(this.fullPath);
    }
    get subDir() {
        return path.dirname(this.subPath);
    }
    get subPath() {
        return path.relative(this.dir + path.sep + this.location, this.fullPath);
    }
    get localDir() {
        return path.dirname(this.localPath);
    }
    get localPath() {
        return path.relative(this.dir, this.fullPath);
    }

    /**
     * 생성자
     * @extends OriginalPath
     * @param {*} auto 
     * @param {*} fullPath 
     * @param {*} location 
     * @param {*} dir 
     */
    constructor(auto, fullPath, location, dir) {
        super(auto, location, dir);

        this.#fullPath = fullPath;
    }

    /*_______________________________________*/        
    // public method

    /**
     * 참조객체 등록
     * @param {*} src 참조 대상 원본소스
     * @param {*} list 참조 위치 객체
     */
     addDepend(ref, pos) {
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

    /*_______________________________________*/        
    // public
    data = null;

    /**
     * 생성자
     * @extends NonTextFile
     * @param {*} auto 
     * @param {*} fullPath 
     * @param {*} location 
     * @param {*} dir 
     */
    constructor(auto, fullPath, location, dir) {
        super(auto, fullPath, location, dir);
    }
}

/**
 * 메타 컬렉션
 */
 class FileCollection extends PropertyCollection {
    
    /**
     * 생성자
     * @class 
     * @extends PropertyCollection
     * @param {*} owner 
     */
    constructor(owner) {
        super(owner);
    }

    /*_______________________________________*/        
    // public method

    /**
     * 지정위치의 파일들 추가 (src, out)
     * @param {*} location 
     * @param {*} opt 
     */
    addLocation(location, opt) {

        const _this = this;
        const sep = path.sep;
        const dirs = this._onwer.dirs;
        let dir = '', bDir = '';

        // 내부 함수
        function _addPath(path, dir = '', baseDir) {

            let arr, file, alias, idx;
    
            arr = fs.readdirSync(path);
    
            for (let i = 0; i < arr.length; i++) {
                
                // REVIEW:: 비동기 성능이슈 있음
                
                // 대상 파일의 필터  TODO:: 
                // TODO: 템플릿 파일은 제외해야야함
                if (fs.statSync(path +'/'+ arr[i]).isFile()) {
                    // 컬렉션에 등록
                    alias = dir === '' ? arr[i] : dir + sep + arr[i];
                    if (isBinaryPath(path +'/'+ arr[i])) {
                        file = new NonTextFile(_this._onwer, path + sep + arr[i], location, baseDir);
                    } else {
                        file = new TextFile(_this._onwer, path + sep + arr[i], location, baseDir);
                    }
                    
                    idx = _this.indexOfName(alias);  // 중복이름 검사
                    if (idx > -1) _this[idx] = file;  // 내용 교체
                    else _this.add(alias, file);
                    
                } else if (fs.statSync(path + sep + arr[i]).isDirectory()) {
                    _addPath(path + sep + arr[i], dir, baseDir);
                }
            }
        }

        for (let i = 0; i < dirs.length; i++) {
            dir = dirs[i] + path.sep + location;
            bDir = dirs[i];
            if (fs.existsSync(dir)) _addPath(dir, '', bDir);
        }
        // 폴더가 있는경우만
        // if (fs.existsSync(dir)) _addPath(dir);
    }


    /**
     * 파일 data 채우기
     */
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
 class FolderCollection extends PropertyCollection {
    
    /**
     * 생성자
     * @param {*} owner 
     */
    constructor(owner) {
        super(owner);
    }

    /*_______________________________________*/        
    // public method

    /**
     * 가상폴더 추가
     * @param {string} vFolder 
     */
    add(vFolder) {
        
        let obj;

        obj = new VirtualFolder(this._onwer, vFolder, this._onwer.dir);
        super.add(vFolder, obj);
    }
}

exports.OriginalPath = OriginalPath;
exports.VirtualFolder = VirtualFolder;
exports.NonTextFile = NonTextFile;
exports.TextFile = TextFile;
exports.FileCollection = FileCollection;
exports.FolderCollection = FolderCollection;