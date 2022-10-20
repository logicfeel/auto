const path = require('path');

class DependResolver {
    
    // protectd
    _auto = null;
    _list = [];
    _paths = [];

    constructor(auto) {
        this._auto = auto;
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
                    keyword = arr[ii].paths[iii];    
                    list = list.concat(this.#_getMatchList(keyword, data));    // 벼열 합침
                }
                // 참조가 있으면 등록
                if (list.length > 0) {
                    this._list[i].origin._addDepend(basePath, list);
                }                
            }
        }
    }

    // 해결대상 가져오기
    _readOriginal() {
        
        function createObject(basePath, location, alias = '') {
            let objPath = {
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

    /**
     * 원본, 참조 OrignalSource 객체 생성
     * @param {*} basePath 
     * @param {*} location 
     * @param {*} alias 
     * @returns {object}
     */    
    #_createObject(basePath, location, alias = '') {
        let objPath = {
            origin: basePath,
            location: location,
            alias: alias,
        };    
        return objPath;
    }

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

        // 내부함수 
        function createPathList(basePath, ...paths) {
            let key = {
                basePath: basePath,
                paths: paths
            };
            return key;
        }

        if (obj.location === 'src') {
            for (let i = 0; i < this._paths.length; i++) {
                basePath = this._paths[i].origin;
                if (['src', 'out'].indexOf(this._paths[i].location) > -1) {
                    // 절대경로 
                    localPath = path.sep + basePath.localPath;
                    dir = path.dirname(obj.origin.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, basePath.fullPath);
                    arr.push(createPathList(basePath, localPath, relativePath));
                } else if (this._paths[i].location === 'dep') {
                    // 절대경로  (가상경로)
                    aliasPath = path.sep + this._auto.LOC.DEP + path.sep + this._paths[i].alias + path.sep + src.subPath;
                    dir = path.dirname(obj.origin.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, this._auto.dir + path.sep + aliasPath);
                    arr.push(createPathList(basePath, aliasPath, relativePath));
                }
            }
        } else if (obj.location === 'out') {
            for (let i = 0; i < this._paths.length; i++) {
                basePath = this._paths[i].origin;
                if (['out'].indexOf(this._paths[i].location) > -1) {
                    // 절대경로 
                    localPath = path.sep + basePath.localPath;
                    // 상대경로 
                    dir = path.dirname(obj.origin.fullPath);
                    relativePath = path.relative(dir, basePath.fullPath);
                    arr.push(createPathList(basePath, localPath, relativePath));
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
     * @returns 
     */
    #_getMatchList(strPath, data) {
        
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
            });

            // console.log(data)
            console.log(`index:${index} ${line}:line column:${column} key:${strPath}`)
        }
        return rArr;
    }
}

exports.DependResolver = DependResolver;