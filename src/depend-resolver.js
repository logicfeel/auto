const fs = require('fs');
const path = require('path');
const mm = require('micromatch');
const at = require('./auto-task');

class DependResolver {
    
    /*_______________________________________*/        
    // protectd
    _auto = null;
    _list = [];
    _paths = [];
    _task = at.AutoTask.getInstance();
    // _entry = this._task.entry;
    /*_______________________________________*/        
    //private
    #patterns = [];

    constructor(auto, json) {
        this._auto = auto;
        if (json) this.#load(json);
        // this.#patterns.push({target: '**', include: '**'});
    }

    /**
     * 객체 얻기
     * @returns {this}
     */
    getObject() {

        var obj = { pattern: []};
        
        this.#patterns.forEach( val => { obj.pattern.push(val) });
        return obj; 
    }

    /**
     * 해결대상과 해결참조 읽기 (불러오기)
     */
    read() {
        this._readOriginal();
        this._readReference();
    }

    /**
     * 의존성 처리
     */
    resolve() {
        
        let arr, OriginalPath, data, keyword;
        let list = [];
        const entry = this._task.entry;
        
        // 이벤트 발생
        this._auto._onResolve(this._task.cursor, this._auto);

        // 원본 소스 조회
        for (let i = 0; i < this._list.length; i++) {
            arr = this.#getPathList(this._list[i]);
            data = this._list[i].origin.data;
            // 참조 대상 조회
            for (let ii = 0; ii < arr.length; ii++) {
                // 대상의 상대, 절대 경로
                list = [];  // 초기화
                OriginalPath = arr[ii].OriginalPath;
                for (let iii = 0; iii < arr[ii].paths.length; iii++) {
                    keyword = arr[ii].paths[iii].info;    
                    // list = list.concat(this.#getMatch(keyword, data, arr[ii].paths[iii].type));    // 벼열 합침
                    list = list.concat(this.#getMatch(keyword, data, arr[ii].paths[iii].type, this._list[i].origin.name));    // REVIEW:: 디버깅시 
                }
                // 참조가 있으면 등록
                if (list.length > 0) {
                    this._list[i].origin.addDepend(OriginalPath, list);
                }
            }
        }
        
        // 관계파일 자동 저장시
        if (this._auto === entry && entry.isSaveRelation === true) this.saveRelation();

        // 이벤트 발생
        this._auto._onResolved(this._task.cursor, this._auto);
    }

    /**
     * 의존성 정보 저장 : __Relation.json
     */
    saveRelation() {

        const entry = this._task.entry;
        const saveName = this._task.FILE.RELATION;
        let obj = {};
        
        // 내부함수 : relation.json 객체 생성
        function createRelation(collection, obj) {
            
            let elem, name, oriPath, depPath;
            
            for (let i = 0; i < collection.count; i++) {
                elem = collection[i];
                oriPath = collection[i].localPath;
                obj[oriPath] = {};
                elem._dep.forEach(v => {
                    depPath = v.ref.localPath;
                    obj[oriPath][depPath] = [];
                    if (v.pos) {
                        // 정렬
                        v.pos.sort(function (a,b) {
                            if (a.idx > b.idx) return 1;
                            if (a.idx === b.idx) return 0;
                            if (a.idx < b.idx) return -1;
                        });
                        // 샆입
                        v.pos.forEach(vv => {
                            obj[oriPath][depPath].push({
                                idx: vv.idx,
                                line: vv.line,
                                key: vv.key
                            });
                        });
                    }
                });
            }
        }
        
        createRelation(entry.out, obj); // out 관계 객체 생성
        createRelation(entry.src, obj); // src 관계 객체 생성
        
        console.log(`${saveName} 파일 저장`);
        let data = JSON.stringify(obj, null, '\t');
        fs.writeFileSync(entry.dir + path.sep + saveName, data, 'utf8'); 
    }

    /**
     * 포함할 경로 설정
     * @param {*} target 대상 원보 glob 패턴
     * @param {*} include 포함할 패턴
     * @param {*} exclude 제외할 패ㄴ
     */
    setPattern(target, include, exclude) {
        this.#patterns.push({
            target: target,
            include: include,
            exclude: exclude,
        });
    }

    /**
     * src, out, vir 경로에 대한 패턴 경로 얻기 : _paths[*]
     * @param {string} localPath 
     * @returns {array<string>}
     */
    getPattern(localPath) {
        
        let target = [], include = [], exclude =[];
        let arr = [], list;

        list = this._getList(localPath);
        if (list.length < 0) {
            return arr;
        }

        // 소스에 포함되는 패턴 조회
        for(let i = 0; i < this.#patterns.length; i++) {
            if (mm.isMatch(localPath, this.#patterns[i].target)) {
                target.push(this.#patterns[i].target);
                include.push(this.#patterns[i].include);
                exclude.push(this.#patterns[i].exclude);
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

    /**
     * src, out, vir 경로에 대한 패턴 객체 얻기 : _paths[*]
     * @param {string} localPath 
     * @returns {array<string>}}
     */
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
     * @returns {array}
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
     * @returns {array}
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

    /**
     * 원본 읽기 (해결대상)
     */
    _readOriginal() {
        
        function createObject(OriginalPath, location, alias = '') {           
             let objPath = {
                path: OriginalPath.localPath,
                origin: OriginalPath,
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

    /**
     * 참조대상 읽기
     */
    _readReference() {

        let alias = '';

        function createObject(OriginalPath, location, alias = '') {
            let objPath = {
                path: OriginalPath.localPath,
                origin: OriginalPath,
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
            alias = this._auto.dep.properties[i];   // 별칭 얻기
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
     * 설정파일 로딩
     * @param {JSON} json 
     */
    #load(json) {
     
        let obj;

        if (json && Array.isArray(json.pattern)) {
            for (let i = 0; i < json.pattern.length; i++) {
                obj = json.pattern[i];
                if (obj.target && (obj.include || obj.exclude)) this.#patterns.push(obj);
            }
        }
    }

    /**
     * _ref 참조경로에 대한 상대경로와 절대경로를 배열로 리턴
     * @param {*} obj 
     * @returns {array}
     */
    #getPathList(obj) {
        // 
        let arr = [];
        let relativePath = null;
        let OriginalPath, dir, localPath, aliasPath;
        let paths = [];

        // 내부함수 
        function createPathList(OriginalPath, ...paths) {
            let key = {
                OriginalPath: OriginalPath,
                paths: paths,   // {type: 절대(1), 상대(2), 사용자(3) | info: }
            };
            return key;
        }

        paths = this.getPatternObj(obj.path);

        /**
         * src 참조위치 : src, out, dep
         * out 참조위치 : out (자신만 참조) <= 너무 폐쇠적인 구조임
         */
        // if (obj.location === 'src') {
        //     for (let i = 0; i < paths.length; i++) {
        //         OriginalPath = paths[i].origin;
        //         if (['src', 'out'].indexOf(paths[i].location) > -1) {
        //             // 절대경로 
        //             localPath = path.sep + OriginalPath.localPath;
        //             dir = path.dirname(obj.origin.fullPath);
        //             // 상대경로 
        //             relativePath = path.relative(dir, OriginalPath.fullPath);
        //             // arr.push(createPathList(OriginalPath, localPath, relativePath));
        //             arr.push(createPathList(OriginalPath, { type: 1, info: localPath }, { type: 2, info: relativePath }));
        //         } else if (paths[i].location === 'dep') {
        //             // 절대경로  (가상경로)
        //             aliasPath = path.sep + this._auto.LOC.DEP + path.sep + paths[i].alias + path.sep + OriginalPath.subPath;
        //             dir = path.dirname(obj.origin.fullPath);
        //             // 상대경로 
        //             relativePath = path.relative(dir, this._auto.dir + path.sep + aliasPath);
        //             // arr.push(createPathList(OriginalPath, aliasPath, relativePath));
        //             arr.push(createPathList(OriginalPath, { type: 1, info: aliasPath }, { type: 2, info: relativePath }));
        //         }
        //     }
        // } else if (obj.location === 'out') {
        //     for (let i = 0; i < paths.length; i++) {
        //         OriginalPath = paths[i].origin;
        //         if (['out'].indexOf(paths[i].location) > -1) {
        //             // 절대경로 
        //             localPath = path.sep + OriginalPath.localPath;
        //             // 상대경로 
        //             dir = path.dirname(obj.origin.fullPath);
        //             relativePath = path.relative(dir, OriginalPath.fullPath);
        //             // arr.push(createPathList(OriginalPath, localPath, relativePath));
        //             arr.push(createPathList(OriginalPath, { type: 1, info: localPath }, { type: 2, info: relativePath }));
        //         }
        //     }
        // }
        if (obj.location === 'src' || obj.location === 'out') {
            for (let i = 0; i < paths.length; i++) {
                OriginalPath = paths[i].origin;
                if (['src', 'out'].indexOf(paths[i].location) > -1) {
                    // 절대경로 
                    localPath = path.sep + OriginalPath.localPath;
                    dir = path.dirname(obj.origin.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, OriginalPath.fullPath);
                    // arr.push(createPathList(OriginalPath, localPath, relativePath));
                    arr.push(createPathList(OriginalPath, { type: 1, info: localPath }, { type: 2, info: relativePath }));
                } else if (paths[i].location === 'dep') {
                    // 절대경로  (가상경로)
                    aliasPath = path.sep + this._auto.LOC.DEP + path.sep + paths[i].alias + path.sep + OriginalPath.subPath;
                    dir = path.dirname(obj.origin.fullPath);
                    // 상대경로 
                    relativePath = path.relative(dir, this._auto.dir + path.sep + aliasPath);
                    // arr.push(createPathList(OriginalPath, aliasPath, relativePath));
                    arr.push(createPathList(OriginalPath, { type: 1, info: aliasPath }, { type: 2, info: relativePath }));
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
     * @param {*} filename? 파일명 로그용 
     * @returns {array}
     */
    #getMatch(strPath, data, type = null, filename) {
        
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
            console.log(`${filename} :: idx:${index} line:${line} column:${column} key:${strPath}`)
        }
        return rArr;
    }
}

exports.DependResolver = DependResolver;