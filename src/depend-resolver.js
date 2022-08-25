const path = require('path');

// 해결자..
class DependResolver {
    
    // protectd
    _auto = null;
    _org = [];
    _ref = [];

    constructor(owner) {
        this._auto = owner;
    }

    load() {
        this._getOriginal();
        this._getRefer();
    }

    __getPath(src, location, alias = '') {
        // 임시 객체
        let objPath = {
            location: location,
            alias: alias,
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
        let alias = '';
        // src 가져오기        
        for (let i = 0; i < this._auto.src.count; i++) {
            this._ref.push(this.__getPath(this._auto.src[i], 'src'));
        }
        // out 가져오기
        for (let i = 0; i < this._auto.out.count; i++) {
            this._ref.push(this.__getPath(this._auto.out[i], 'out'));
        }
        // dep 가져오기
        for (let i = 0; i < this._auto.dep.count; i++) {       
            alias = this._auto.dep.properties[0];   // 별칭 얻기
            for (let ii = 0; ii < this._auto.dep[i].src.count; ii++) {
                this._ref.push(this.__getPath(this._auto.src[ii], 'dep', alias));
            }
        }
    }

    // 소스에 대한 참조 목록 가져오기
    __getReferPath(org) {
        
        let arr = [];
        let relativePath = null;
        let src;

        // 내부함수
        function getKey(src, keyPath) {
            let key = {
                path: keyPath,
                src: src
            };
            return key;
        }

        if (org.location === 'src') {
            for (let i = 0; this._ref.length; i++) {
                src = this._ref[i].src;
                if (['src', 'out'].indexOf(this._ref[i].location) > -1) {
                    // 절대경로 추가
                    arr.push(getKey(src, src.basePath));
                    // 상대경로 추가
                    relativePath = path.relative(org.src.fullPath, src.fullPath);
                    arr.push(getKey(src, relativePath));
                } else if (this._ref[i].location === 'dep') {
                    // TODO:: 별칭 정보를 확인해서 삽입
                }
            }
        } else if (org.location === 'out') {
            for (let i = 0; this._ref.length; i++) {
                src = this._ref[i].src;
                if (['out'].indexOf(this._ref[i].location) > -1) {
                    // 절대경로 추가
                    arr.push(getKey(src, src.basePath));
                    // 상대경로 추가
                    relativePath = path.relative(org.fullPath, src.fullPath);
                    arr.push(getKey(src, relativePath));
                }
            }
        }
        return arr;
    }

    // 의존성 처리
    resolve() {
        
        let arr, target, content, index, keyword;

        // 내부함수
        function getRef(target, index, length) {
            let refObj = {
                target: keyPath,
                index: src,
                length: length
            };
            return refObj;
        }

        // 전체 소스 조회
        for (let i = 0; this._org.length; i++) {
            arr = this.__getReferPath(this._org[i]);
            content = this._org[i].src.content;

            for (let ii = 0; arr.length; ii++) {
                target = his._org[i].src;
                keyword = arr[ii];
                index = conent.indexOf(keyword);
                // 참조 조회
                if (index > -1) {
                    this._org[i].src._ref.push(refObj(target, index, keyword.length));
                }
            }
        }
    }
}

module.exports = DependResolver;