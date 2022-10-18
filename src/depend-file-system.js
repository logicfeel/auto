const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');

/**
 * 의존성 파일시스템
 */
class DependFileSystem {
    
    //public
    isStatic = null;
    fullPath = '';
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
    get baseDir() {
        throw new Error(' baseDir 프로퍼티를 정의해야 합니다.');
    }
    get basePath() {
        throw new Error(' basePath 프로퍼티를 정의해야 합니다.');
    }
    constructor(auto) {
        this._auto = auto;
    }
}

/**
 * 가상폴더 클래스
 */
class VirtualFolder extends DependFileSystem {

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
    get baseDir() {
        return this.fullPath;
    }
    get basePath() {
        return this.fullPath;
    }

    constructor(auto, subPath) {
        super(auto);
        
        // 필수 검사 필요!!
        this.fullPath = subPath;
    }

}

/**
 * 비텍스트파일 클래스
 */
class NonTextFile extends DependFileSystem {
    
    // public
    location = null;
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
    get baseDir() {
        return path.dirname(this.basePath);
    }
    get basePath() {
        return path.relative(this._auto.dir, this.fullPath);
    }

    constructor(auto, fullPath, location) {
        super(auto);

        this.fullPath = fullPath;
        this.location = location;
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
    
    // TODO:: owner 명칭 변경 (오타) !!
    constructor(onwer) {
        super(onwer);
    }
}

/**
 * 메타컬렉션 클래스
 */
 class MetaCollection extends PropertyCollection {
    
    // TODO:: owner 명칭 변경 (오타) !!
    constructor(onwer) {
        super(onwer);
    }
}

exports.DependFileSystem = DependFileSystem;
exports.VirtualFolder = VirtualFolder;
exports.NonTextFile = NonTextFile;
exports.TextFile = TextFile;
exports.FileCollection = FileCollection;
exports.MetaCollection = MetaCollection;