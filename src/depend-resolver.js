const path = require('path');

// 의존성 해결자
class DependResolver {
    
    // protectd
    _auto = null;
    _org = [];
    _ref = [];

    constructor(auto) {
        this._auto = auto;
    }

    load() {
        this._readOriginal();
        this._readRefer();
    }

    // 의존성 처리
    resolve() {
        
        let arr, src, data, keyword;
        let list = [];

        // 내부함수
        // function createRefObj(src, list) {
        //     let refObj = {
        //         src: src,
        //         list: list,
        //     };
        //     return refObj;
        // }

        // 원본 소스 조회
        for (let i = 0; i < this._org.length; i++) {
            arr = this.#getReferPath(this._org[i]);
            data = this._org[i].src.data;
            // 참조 대상 조회
            for (let ii = 0; ii < arr.length; ii++) {
                // 대상의 상대, 절대 경로
                list = [];  // 초기화
                src = arr[ii].src;
                for (let iii = 0; iii < arr[ii].path.length; iii++) {
                    keyword = arr[ii].path[iii];    
                    list = list.concat(this.#getMatchPath(keyword, data));    // 벼열 합침
                }
                // 참조가 있으면 등록
                if (list.length > 0) {
                    // this._org[i].src._ref.push(createRefObj(src, indexArr));
                    this._org[i].src._addReference(src, list);
                }                
            }
        }
    }

    // 해결대상 가져오기
    _readOriginal() {
        // src 가져오기
        for (let i = 0; i < this._auto.src.count; i++) {
            this._org.push(this.#createPath(this._auto.src[i], 'src'));
        }
        // out 가져오기
        for (let i = 0; i < this._auto.out.count; i++) {
            this._org.push(this.#createPath(this._auto.out[i], 'out'));
        }
    }

    // 참조대상 가져오기
    _readRefer() {
        let alias = '';
        // src 가져오기        
        for (let i = 0; i < this._auto.src.count; i++) {
            this._ref.push(this.#createPath(this._auto.src[i], 'src'));
        }
        // out 가져오기
        for (let i = 0; i < this._auto.out.count; i++) {
            this._ref.push(this.#createPath(this._auto.out[i], 'out'));
        }
        // dep 가져오기
        for (let i = 0; i < this._auto.dep.count; i++) {       
            alias = this._auto.dep.properties[0];   // 별칭 얻기
            for (let ii = 0; ii < this._auto.dep[i].count; ii++) {
                this._ref.push(this.#createPath(this._auto.dep[i][ii], 'dep', alias));
            }
        }
    }

    /**
     * 원본, 참조 OrignalSource 객체 생성
     * @param {*} src 
     * @param {*} location 
     * @param {*} alias 
     * @returns {object}
     */
    #createPath(src, location, alias = '') {
        // 임시 객체
        let objPath = {
            location: location,
            alias: alias,
            src: src
        };    
        return objPath;
    }

    /**
     * _ref 참조경로에 대한 상대경로와 절대경로를 배열로 리턴
     * @param {*} org 
     * @returns 
     */
    #getReferPath(org) {
        
        let arr = [];
        let relativePath = null;
        let src, dir, basePath, aliasPath;

        // 내부함수
        function createKeyObj(src, ...keyPath) {
            let key = {
                path: keyPath,
                src: src
            };
            return key;
        }

        if (org.location === 'src') {
            for (let i = 0; i < this._ref.length; i++) {
                src = this._ref[i].src;
                if (['src', 'out'].indexOf(this._ref[i].location) > -1) {
                    // 절대경로 
                    basePath = path.sep + src.basePath;
                    dir = path.dirname(org.src.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, src.fullPath);
                    arr.push(createKeyObj(src, basePath, relativePath));
                } else if (this._ref[i].location === 'dep') {
                    // 절대경로  (가상경로)
                    aliasPath = path.sep + this._auto.LOC.DEP + path.sep + this._ref[i].alias + path.sep + src.subPath;
                    dir = path.dirname(org.src.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, this._auto.dir + path.sep + aliasPath);
                    arr.push(createKeyObj(src, aliasPath, relativePath));
                }
            }
        } else if (org.location === 'out') {
            for (let i = 0; i < this._ref.length; i++) {
                src = this._ref[i].src;
                if (['out'].indexOf(this._ref[i].location) > -1) {
                    // 절대경로 
                    basePath = path.sep + src.basePath;
                    // 상대경로 
                    dir = path.dirname(org.src.fullPath);
                    relativePath = path.relative(dir, src.fullPath);
                    arr.push(createKeyObj(src, basePath, relativePath));
                }
            }
        }
        return arr;
    }


    /**
     * 경로키로 내용(data)를 매칭 목록 객체를 얻는다.
     * 매칭 객체 {idx, key, line, col }
     * @param {*} pathKey 
     * @param {*} data 
     * @returns 
     */
    #getMatchPath(pathKey, data) {
        
        let reg
        let rArr = [];
        let index;
        let str = pathKey;
        let part, line, arrLine = [], column;
        
        str = str.replaceAll('\\', "\\\\");
        //str = str.replaceAll('/', '\/');
        str = str.replaceAll('.', '\\.');
    
        str =  "(?:[^\\w\\\\/\\.])" + str + "(?:[^\\w\\\\/\\.])";
        
        reg = RegExp(str, 'gi');
    
        while(reg.exec(data)) {
            if (reg.lastIndex === 0) break;

            index = reg.lastIndex - pathKey.length - 1
            // line, column 구하기
            part = data.substring(0, index);   // 내용 조각
            arrLine = part.split('\n');
            line = arrLine.length;
            column = arrLine[line - 1].length;
            // if (line > 0) column = arrLine[line - 1].length;
            // else column = index;

            rArr.push({
                idx: index,
                key: pathKey,
                line: line,
                col: column,
            });

            // console.log(data)
            console.log(`index:${index} ${line}:line column:${column} key:${pathKey}`)
        }
    
        return rArr;
    }

    
}

module.exports = DependResolver;