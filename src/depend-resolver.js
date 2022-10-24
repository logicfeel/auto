const path = require('path');
const mm = require('micromatch');

class DependResolver {
    
    // protectd
    _auto = null;
    _list = [];
    _paths = [];
    //private
    #_patterns = [];

    constructor(auto) {
        this._auto = auto;
        // this.#_patterns.push({target: '**', include: '**'});
    }

    load() {
        this._readOriginal();
        this._readReference();
    }

    // 의존성 처리
    resolve() {
        
        let arr, basePath, data, keyword;
        let list = [];
        // 원본 소스 조회
        for (let i = 0; i < this._list.length; i++) {
            arr = this.#_getPathList(this._list[i]);
            data = this._list[i].origin.data;
            // 참조 대상 조회
            for (let ii = 0; ii < arr.length; ii++) {``
                // 대상의 상대, 절대 경로
                list = [];  // 초기화
                basePath = arr[ii].basePath;
                for (let iii = 0; iii < arr[ii].paths.length; iii++) {
                    keyword = arr[ii].paths[iii].info;    
                    list = list.concat(this.#_getMatch(keyword, data, arr[ii].paths[iii].type));    // 벼열 합침
                }
                // 참조가 있으면 등록
                if (list.length > 0) {
                    this._list[i].origin._addDepend(basePath, list);
                }
            }
        }
    }

    /**
     * 포함할 경로 설정
     * @param {*} target 대상 원보 glob 패턴
     * @param {*} include 포함할 패턴
     * @param {*} exclude 제외할 패ㄴ
     */
    setPattern(target, include, exclude) {
        this.#_patterns.push({
            target: target,
            include: include,
            exclude: exclude,
        });
    }

    getPattern(localPath) {
        
        let target = [], include = [], exclude =[];
        let arr = [];

        if (this._getList(localPath) < 0) {
            return arr;
        }

        // 소스에 포함되는 패턴 조회
        for(let i = 0; i < this.#_patterns.length; i++) {
            if (mm.isMatch(localPath, this.#_patterns[i].target)) {
                target.push(this.#_patterns[i].target);
                include.push(this.#_patterns[i].include);
                exclude.push(this.#_patterns[i].exclude);
            }
        }

        // 전체 적용패턴이 없을 경우 모두 리턴
        if (target.length === 0) return this._getPaths();

        // include 패턴 적용
        arr = mm.match(this._getPaths(), include);
        // exclude 패턴 적용
        arr = mm.not(arr, exclude);

        return arr;
    }

    getPatternObj(localPath) { 
        
        let arr = [];
        let pattern = this.getPattern(localPath);

        // 대상에 정의된 패턴이 없으면 전체 리턴
        if (pattern.length === 0) return this._paths;
        
        for (let i = 0; i < this._paths.length; i++) {
            if (pattern.indexOf(this._paths[i].path) > -1 ) arr.push(this._paths[i]);  
        }
        return arr;
    }

    /**
     * 참조 경로 배열 리턴
     * @returns 
     */
    _getPaths(isObj) {
        
        let arr = [];

        for (let i = 0; i < this._paths.length; i++) {
            arr.push(this._paths[i].path);
        }
        return arr;
    } 


    /**
     * 원본 경로 배열 리턴
     * @returns 
     */
     _getList(isObj) {
        
        let arr = [];

        for (let i = 0; i < this._list.length; i++) {
            arr.push(this._list[i].path);
        }
        return arr;
    } 


    /**
     * patterns : 패턴
     * 대상패턴, 포함패턴[*], 제외패턴[*]
     * src/*.js,  **
     * 파일에 대한 패턴이 중복되는 이슈가 있다.
     *  - 경로를 기준으로 대상패턴을 조회한다.
     *  - 대상에 대한 패턴을 조회하여 적합한 파일을 찾는다.
     *  - list별 paths를 가져외서 의존성을 해결한다.
     */

    // 해결대상 가져오기
    _readOriginal() {
        
        function createObject(basePath, location, alias = '') {           
             let objPath = {
                path: basePath.localPath,
                origin: basePath,
                location: location,
                include: ['*.*'],
                exclude: [],
            };    
            return objPath;
        }

        // src 가져오기
        for (let i = 0; i < this._auto.src.count; i++) {
            this._list.push(createObject(this._auto.src[i], 'src'));
        }
        // out 가져오기
        for (let i = 0; i < this._auto.out.count; i++) {
            this._list.push(createObject(this._auto.out[i], 'out'));
        }
    }

    // 참조대상 가져오기
    _readReference() {

        let alias = '';

        function createObject(basePath, location, alias = '') {
            let objPath = {
                path: basePath.localPath,
                origin: basePath,
                location: location,
                alias: alias,
            };    
            return objPath;
        }

        // src 가져오기        
        for (let i = 0; i < this._auto.src.count; i++) {
            this._paths.push(createObject(this._auto.src[i], 'src'));
        }
        // out 가져오기
        for (let i = 0; i < this._auto.out.count; i++) {
            this._paths.push(createObject(this._auto.out[i], 'out'));
        }
        // dep 가져오기
        for (let i = 0; i < this._auto.dep.count; i++) {       
            alias = this._auto.dep.properties[0];   // 별칭 얻기
            for (let ii = 0; ii < this._auto.dep[i].count; ii++) {
                this._paths.push(createObject(this._auto.dep[i][ii], 'dep', alias));
            }
        }
        // vir 가져오기
        for (let i = 0; i < this._auto.vir.count; i++) {
            this._paths.push(createObject(this._auto.vir[i], 'vir'));
        }
    }
 
    // #_createObject(basePath, location, alias = '') {
    //     let objPath = {
    //         origin: basePath,
    //         location: location,
    //         alias: alias,
    //     };    
    //     return objPath;
    // }

    /**
     * _ref 참조경로에 대한 상대경로와 절대경로를 배열로 리턴
     * @param {*} obj 
     * @returns 
     */
    #_getPathList(obj) {
        // 
        let arr = [];
        let relativePath = null;
        let basePath, dir, localPath, aliasPath;
        let paths = [];

        // 내부함수 
        function createPathList(basePath, ...paths) {
            let key = {
                basePath: basePath,
                paths: paths,   // {type: 1 절대| 2 상대,info: }
            };
            return key;
        }

        paths = this.getPatternObj(obj.path);

        if (obj.location === 'src') {
            for (let i = 0; i < paths.length; i++) {
                basePath = paths[i].origin;
                if (['src', 'out'].indexOf(paths[i].location) > -1) {
                    // 절대경로 
                    localPath = path.sep + basePath.localPath;
                    dir = path.dirname(obj.origin.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, basePath.fullPath);
                    // arr.push(createPathList(basePath, localPath, relativePath));
                    arr.push(createPathList(basePath, { type: 1, info: localPath }, { type: 2, info: relativePath }));
                } else if (paths[i].location === 'dep') {
                    // 절대경로  (가상경로)
                    aliasPath = path.sep + this._auto.LOC.DEP + path.sep + paths[i].alias + path.sep + src.subPath;
                    dir = path.dirname(obj.origin.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, this._auto.dir + path.sep + aliasPath);
                    // arr.push(createPathList(basePath, aliasPath, relativePath));
                    arr.push(createPathList(basePath, { type: 1, info: aliasPath }, { type: 2, info: relativePath }));
                }
            }
        } else if (obj.location === 'out') {
            for (let i = 0; i < paths.length; i++) {
                basePath = paths[i].origin;
                if (['out'].indexOf(paths[i].location) > -1) {
                    // 절대경로 
                    localPath = path.sep + basePath.localPath;
                    // 상대경로 
                    dir = path.dirname(obj.origin.fullPath);
                    relativePath = path.relative(dir, basePath.fullPath);
                    // arr.push(createPathList(basePath, localPath, relativePath));
                    arr.push(createPathList(basePath, { type: 1, info: localPath }, { type: 2, info: relativePath }));
                }
            }
        }
        return arr;
    }

    /**
     * 경로키로 내용(data)를 매칭 목록 객체를 얻는다.
     * 매칭 객체 {idx, key, line, col }
     * @param {*} strPath 
     * @param {*} data 
     * @param {*} type 절대, 상대 
     * @returns 
     */
    #_getMatch(strPath, data, type = null) {
        
        let reg
        let rArr = [];
        let index;
        let str = strPath;
        let part, line, arrLine = [], column;
        
        str = str.replaceAll('\\', "\\\\");
        //str = str.replaceAll('/', '\/');
        str = str.replaceAll('.', '\\.');
    
        str =  "(?:[^\\w\\\\/\\.])" + str + "(?:[^\\w\\\\/\\.])";
        
        reg = RegExp(str, 'gi');
    
        while(reg.exec(data)) {
            if (reg.lastIndex === 0) break;

            index = reg.lastIndex - strPath.length - 1
            // line, column 구하기
            part = data.substring(0, index);   // 내용 조각
            arrLine = part.split('\n');
            line = arrLine.length;
            column = arrLine[line - 1].length;
            // if (line > 0) column = arrLine[line - 1].length;
            // else column = index;

            rArr.push({
                idx: index,
                key: strPath,
                line: line,
                col: column,
                type: type,
            });

            // console.log(data)
            console.log(`index:${index} ${line}:line column:${column} key:${strPath}`)
        }
        return rArr;
    }
}

exports.DependResolver = DependResolver;