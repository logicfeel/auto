const path = require('path');

// 해결자..
class DependResolver {
    
    // protectd
    _auto = null;
    _org = [];
    _refer = [];

    constructor(owner) {
        this._auto = owner;
    }

    load() {
        this._getOriginal();
        this._getRefer();
    }

    __getPath(src, location) {
        // 임시 객체
        let objPath = {
            location: location,
            src: src
        };    
        return objPath;
    }

    // 해결대상 가져오기
    _getOriginal() {
        // src 가져오기
        for (let i = 0; i < this._auto.src.count; i++) {
            this._org.push(this.__getPath(this._auto.src[i], 'src'));
        }
        // out 가져오기
        for (let i = 0; i < this._auto.out.count; i++) {
            this._org.push(this.__getPath(this._auto.out[i], 'out'));
        }
    }

    // 참조대상 가져오기
    _getRefer() {
        // src 가져오기        
        for (let i = 0; i < this._auto.src.count; i++) {
            this._refer.push(this.__getPath(this._auto.src[i], 'src'));
        }
        // out 가져오기
        for (let i = 0; i < this._auto.out.count; i++) {
            this._refer.push(this.__getPath(this._auto.out[i], 'out'));
        }
        // dep 가져오기
        for (let i = 0; i < this._auto.dep.count; i++) {       
            for (let ii = 0; ii < this._auto.dep[i].src.count; ii++) {
                this._refer.push(this.__getPath(this._auto.src[ii], 'dep'));
            }
        }
    }

    // 소스에 대한 참조 목록 가져오기
    __getPathKey(org) {
        
    }

    // 의존성 처리
    resolve() {}
}

module.exports = DependResolver;