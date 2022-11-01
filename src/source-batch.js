const path = require('path');
const fs = require('fs');
const mm = require('micromatch');
const at = require('./auto-task');
const { NonTextFile, TextFile, VirtualFolder, BasePath } = require('./base-path');

/**
 * 소스배치 클래스
 */
class SourceBatch {
    // public
    pathType = 0;       // (0:자동, 1:상대, 2:절대)
    dupType = 0;        // (0:하위참조, 1:중복제거, 2:중복허용)
    isRoot = true;
    // protected
    static _instance = null;
    _batchFile = [];
    //_filter = [];
    _task = null;
    //_map = [];
    // private
    _list = [];

    constructor() {
    }

    static getInstance() {  // TODO:: 제거 검토
        if (this._instance === null) {
            this._instance = new this();
        }
        return this._instance;
    }

    /**
     * 배치할 소스 추가
     * @param {*} collection SourceCollection 
     * @param {*} location 배치 위치 
     * @param {*} isSave 저장 유무
     */
    // add(collection) {
    add(collection, location, isSave) {

        let ori, tar;        
        // TODO:: 타입 검사

        for(let i = 0; i < collection.count; i++) {
            ori = collection[i];
            tar = new TargetSource(location, ori, isSave);
            ori._setTarget(tar);    // _target 설정
            this._list.push(tar);
        }
    }

    /**
     * 전처리와 후처리 나누어야 함
     */
    save() {

        let autos;

        // 이벤트 발생
        this._task.entry._onBatch(this._task.entry);

        // install map 처리
        autos = this._task.entry._getAllList(true);
        
        // 중복제거 처리
        this.deduplication();

        // 맨 하위부터 처리한다.
        for (let i = 0; i < autos.length; i++) {
            // 초기화 : parent, child
            autos[i].install.init();
            
            // 중복제거 처리
            // autos[i].install.deduplication(this.dupType);

            // 인스톨 설정 처리
            autos[i].install.execute();
        }
        
        for (let i = 0; i < this._list.length; i++) {
            // TextFile 일 경우 콘텐츠 설정
            if (this._list[i]._original instanceof TextFile) {
                this._list[i].setData(this.isRoot);
            }
        }

        // TODO:: 중복제거        

        // 타겟 저장
        this.#saveFile();

        // 이벤트 발생
        this._task.entry._onBatched(this._task.entry);

    }

    /**
     * 배치파일저장소 파일 및 배치생성파일 삭제
     */
    clear() {

        const batchfile = this._task.entry.dir +path.sep+ '__BATCH_FILE.json';
        let fullPath;

        for (let i = 0; i < this._batchFile.length; i++) {
            fullPath = this._batchFile[i];
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
        if (fs.existsSync(batchfile)) fs.unlinkSync(batchfile);
        
        // 속성 초기화
        this.isRoot = true;
        this._batchFile = [];
        this._list = [];
    }

    /**
     * 배치파일 목록 얻기
     * @returns {arr}
     */
    getBatchList() {
        
        let rArr = [];

        for (let i = 0; i < this._list.length; i++) {
            rArr.push(
                {
                    ori: this._list[i]._original.fullPath,
                    tar: this._list[i].fullPath
                }
            );
        }
        return rArr;
    }

    /**
     * 
     * @param {number} depType 비교 깊이 
     */
    deduplication(depType = 0 ) {
        // TODO:: isStatic 처리는 어디서??
        
        /**
         * 방법1. for 유일한 파일 목록을 추출후, for 중복되는 타겟를 찾음
         * 방법2. for 중복 오토를 찾은 후, for 대상타겟 갯수만큼, 비교해서 같으면 합침 [추천]
         * 
         */
        const all = this._task.entry._getAllList(true);
        const dupAuto = [];

        



        // 중복 파일 찾기 (TextFile, NonTextFile)
        for (let i = 0; i < this._list.length; i++) {

        }
        
    }

    /**
     * 배치파일 저장
     */
     #saveFile() {

        let isExists, dirname, fullPath, data, orignal, type, target;
        const _this = this;
        // TODO:: try 로 예외 처리함
        for (let i = 0; i < this._list.length; i++) {
            target = this._list[i];
            if (target.isSave === true && target.isExcept === false) {
                type = target.type;
                orignal = target._original;
                // 텍스트 파일의 경우
                if (type === 30) {
                    fullPath = target.fullPath;
                    data = target.data;
                    dirname = path.dirname(fullPath);   
                    isExists = fs.existsSync(dirname);  // 디렉토리 검사
                    if(!isExists) {
                        fs.mkdirSync(dirname, {recursive: true} );  // 디렉토리 만들기
                    }
                    fs.writeFileSync(fullPath, data, 'utf8');       
                    this.#addBatchFile(fullPath);  // 배치 로그 등록
                
                    // 비텍스트 파일의 경우
                } else if (type === 20) {
                    fullPath = target.fullPath;
                    dirname = path.dirname(fullPath);
                    isExists = fs.existsSync(dirname);  // 디렉토리 검사
                    if(!isExists) {
                        fs.mkdirSync(dirname, {recursive: true} ); // 디렉토리 만들기
                    }
                    // 복사
                    fs.copyFileSync(orignal.fullPath, fullPath)
                    this.#addBatchFile(fullPath);   

                // (가상) 폴더의 경우
                } else if (type === 30) {
                    fullPath = target.fullPath;
                    isExists = fs.existsSync(fullPath);
                    if(!isExists) {
                        fs.mkdirSync(fullPath, {recursive: true} ); // 디렉토리 만들기
                    }
                }
            }
        }
        // 배치 로그 저장
        this.#saveBatchFile();
    }

    /**
     * 배치파일저장소 저장
     */
    #saveBatchFile() {
        // batchFile
        let data = JSON.stringify(this._batchFile);
        fs.writeFileSync(this._task.entry.dir +path.sep+ '__BATCH_FILE.json', data, 'utf8');   
    }

    /**
     * 배치파일저장소에 저장파일 로그 추가
     * @param {str} savePath 
     */
    #addBatchFile(savePath) {
        if (this._batchFile.indexOf(savePath) < 0) this._batchFile.push(savePath);
        console.log('SAVE : ' + savePath);
    }
}

/**
 * 대상소스 클래스
 */
class TargetSource {
        
    // public
    isSave      = null;     // 저장유무, 활성화 상태
    isExcept    = false;    // save 시점에 제외 여부
    referType   = 0;        // 참조하는 타입
    refedType   = 0;        // 참조되어지는 타입
    type        = 0;        // 소스타입
    data        = null;
    // protected
    _original   = null;
    _owner      = null;
    _owned      = [];
    _batch      = SourceBatch.getInstance();

    // private
    #dir        = null;
    #location   = null;
    #fullPath   = null;

    // property
    get fullPath() {
        return this.#fullPath;
    }
    get dir() {
        return this.#dir;
    }
    get location() {
        return this.#location;
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
    set subPath(val) {
        this.#fullPath = this.dir + path.sep + this.location + path.sep + val;
    }
    get localDir() {
        return path.dirname(this.localPath);
    }
    get localPath() {
        return path.relative(this.dir, this.fullPath);
    }
    set owner(val) {
        this._owner = val;      // 소유자
        val._owned.push(this);  // 사용된곳 설정
    }

    constructor(location, ori, isSave) {
        
        let entry = this._batch._task.entry;
        let auto  = null;

        if (ori instanceof BasePath) {
            this._original = ori;    
            auto = ori._auto;
            this.#setType(ori);
        }
        
        this.#location = location;
        this.isSave = isSave;

        this.#initPath();
        if (location === entry.LOC.INS) auto.install.add(this);
    }

    /**
     * 소스 내용(data) 설정
     * @param {*} isRoot 절대경로시 location 경로 포함 여부 (install 시점)
     */
    setData(isRoot = true) {
        
        let ori, data, arrObj = [], list, change, refSrc, localDir;
        let dir, entry;
        let type, absolute, relative;

        ori = this._original;
        data = ori.data;
        arrObj = []; // 초기화
        entry = this._batch._task.entry;

        
        for (let ii = 0; ii < ori._dep.length; ii++) {

            // _dep 객체에 pos 가 존재할 경우만 처리 !!
            if (typeof ori._dep[ii].pos !== 'object') continue;

            refSrc = ori._dep[ii].ref;
            // 1) 타겟소스가 없을 경우
            if (refSrc._target === null || refSrc._target.fullPath === null) {
                
                dir = path.dirname(this.fullPath);  
                relative = path.relative(dir, refSrc.fullPath); // 상대경로 (오토기준)

                if (entry === refSrc._auto) {
                    absolute = path.sep + refSrc.localPath;
                } else {    // 하위의 경우
                    if ( refSrc._auto.dir.indexOf(entry.dir) < 0) { // 앤트리 하위 여부 검사
                        throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                    }
                    localDir = path.relative(entry.dir, refSrc._auto.dir);
                    absolute = path.sep + localDir + path.sep + refSrc.localPath;
                }
            
            // 2) 타겟소스가 있을 경우
            } else {
                
                dir = path.dirname(this.fullPath);
                relative = path.relative(dir, refSrc._target.fullPath);       
               
                if (entry === refSrc._auto) {   // 엔트리의 경우
                    if (isRoot) absolute = path.sep + refSrc._target.localPath;     // root 기준 절대경로
                    else absolute = path.sep + refSrc._target.subPath;              // location 기준 절대경로       
                } else {                        // 엔트리 외(하위)의 경우
                    // 앤트리 하위 여부 검사
                    if ( refSrc._target.dir.indexOf(entry.dir) < 0) {
                        throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                    }
                    localDir = path.relative(entry.dir, refSrc._target.dir);
                    if (localDir.length > 0) {
                        absolute = path.sep + localDir + path.sep + refSrc._target.localPath;    
                    } else {    // 'install', 'depend' 의 경우
                        if (isRoot) absolute = path.sep + refSrc._target.localPath;
                        else absolute = path.sep + refSrc._target.subPath;
                    }
                }             
            }

            for (let iii = 0; iii < ori._dep[ii].pos.length; iii++) {
                list = ori._dep[ii].pos[iii];
                
                // 경로 설정
                if (this._batch.pathType === 0 ) {
                    // type = this.pathType === 0 ? list.type : this.pathType;
                    if (this.referType === 0) {
                        if (ori._dep[ii].ref._target.refedType === 0) {
                            // pos 에서 파싱된 타입 설정
                            type = list.type;
                        } else {
                            // 참조된 대상을 타입 설정
                            type = ori._dep[ii].ref._target.refedType;
                        }
                    } else {
                        // 대상 파일의 참조 타입 설정
                        type = this.referType;
                    }
                } else {
                    // 전체 경로 타입 설정
                    type = this._batch.pathType;    
                }
                
                if (type === 1) change = absolute;
                else change = relative; // 기본상대경로
                // else if (type === 2) change = relative;

                arrObj.push({
                    idx: list.idx,
                    txt: list.key,
                    rep: change,
                });
            }
        }
        // 파일내용 저장
        this.#replaceData(data, arrObj);
    }

    clone() {
        
        let obj = new TargetSource(this.location, this._original, this.isSave);
        
        obj.isSave      = this.isSave;
        obj.isExcept    = this.isExcept;
        obj.referType   = this.referType;
        obj.refedType   = this.refedType;
        obj.data        = this.data;
        obj._original   = this._original;
        obj._owner      = this._owner;
        obj._owned      = this._owned.map( (val) => {return val } );
        obj._owned      = this._owned;
        obj._batch      = this._batch;
        obj.subPath     = this.subPath;

        return obj;
    }

    /**
     * fullPath, dir 속성을 설정한다.
     */
     #initPath() {

        let auto, src, useAuto, entry, alias, fullPath;
        let location;
        // const AutoTask = require('./auto-task');
        entry = this._batch._task.entry;
        

        src = this._original;
        auto = src._auto;
        location = this.location;

        if (location == entry.LOC.DIS) {
            if (entry === src._auto) {
                fullPath = auto.dir + path.sep + entry.LOC.DIS + path.sep + src.subPath;
                
            } else {    // 하위 오토의 경우
                useAuto = auto._owner;
                alias = useAuto.name +'-'+ auto.alias;
                fullPath = auto.dir + path.sep + entry.LOC.DIS + path.sep + alias + path.sep + src.subPath;
            }
            this.#dir = auto.dir;
            this.#fullPath = fullPath;
        
        } else if (location == entry.LOC.DEP) {
            alias = auto.alias;
            fullPath = entry.dir + path.sep + entry.LOC.DEP + path.sep + alias + path.sep + src.subPath;
            this.#dir = entry.dir;
            this.#fullPath = fullPath;
        
        } else if (location == entry.LOC.INS) {
            // TODO:: 컨첸츠 중복 검사 및 제거 알고니즘 추가해야함
            alias = auto.alias ? auto.name + path.sep + auto.alias : auto.name;
            fullPath = entry.dir + path.sep + entry.LOC.INS + path.sep + alias + path.sep + src.subPath;
            this.#dir = entry.dir;
            this.#fullPath = fullPath;          
        }
    }    

    #setType(ori) {
        
        let type = 0;
        
        if (ori instanceof VirtualFolder) this.type = 10;
        if (ori instanceof NonTextFile) this.type = 20;
        if (ori instanceof TextFile) this.type = 30;
        
        return type;
    } 

    /**
     * 파일내용(data) 을 배열에 맞게 교체한다.
     * @param {*} data 
     * @param {*} arrObj 
     * @returns 
     */
    #replaceData(data, arrObj) {
        // replace
        var obj;
        var base_idx = 0, idx = 0;
        var ori_data = data;
        var ori_prev = '', ori_next = '';

        // 배열 정렬
        arrObj.sort(function (a,b) {
            if (a.idx > b.idx) return 1;
            if (a.idx === b.idx) return 0;
            if (a.idx < b.idx) return -1;
        });

        for(var i = 0; i < arrObj.length; i++) {
            obj = arrObj[i];
            // rep 문자열검사
            // txt 문자열 1 이상 
            // idx > 
            if (typeof obj.idx !== 'number' || typeof obj.txt !== 'string') {
                console.warn('객체아님');
                continue;
            }
            idx = obj.idx + base_idx;                                   // 시작 인텍스
            if (ori_data.substr(idx, obj.txt.length) === obj.txt) {     // 검사
                ori_prev = ori_data.slice(0, idx);                      // 앞 문자열
                ori_next = ori_data.slice(idx + obj.txt.length);        // 뒤 문자열
                ori_data = ori_prev + obj.rep + ori_next;
                base_idx = base_idx + obj.rep.length - obj.txt.length;
            } else {
                console.warn('실패 '+ obj);
            }
        }
        this.data = ori_data;
    }
}

/**
 * 인스톨맵 클래스
 */
class InstallMap {
    
    // public
    isOverlap = false;

    // protected
    _auto = null;
    _task = at.AutoTask.getInstance();
    _parent = null;
    _child = [];
    _setup = [];
    _merge = [];
    _rename = [];
    _except = [];
    _list = [];

    get targets() {
        
        let arr = [];

        for (let i = 0; i < this._child.length; i++) {
            arr = arr.concat(this._child[i].targets);
        }
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i].isSave === true) arr.push(this._list[i]);
        }
        return arr;
    }    

    constructor(auto, json) {
        this._auto = auto;
        if (json) this.#load(json);
    }

    add(target) {
        this._list.push(target);
    }
    
    init() {

        const auto = this._auto;

        if (auto._owner && auto._owner.install instanceof InstallMap) {
            this._parent = auto._owner.install;     // 부모 InstallMap 연결
            auto._owner.install._child.push(this);  // 자식 InstallMap 등록
        }
    }

    deduplication(dupType) {
        // TODO:: isStatic 처리는 어디서??

        
    }

    execute() {
        
        if (this._setup.length > 0) this.#execSetup();
        if (this._rename.length > 0) this.#execRename();
        if (this._merge.length > 0) this.#execMerge();
        if (this._except.length > 0) this.#execExcept();
    }

    #load(json) {

        let obj;

        // setup obj
        if (json.setup && Array.isArray(json.setup)) {
            for (let i = 0; i < json.setup.length; i++) {
                if (typeof json.setup[i] === 'object' && typeof json.setup[i].glob === 'string') {
                    this._setup.push(json.setup[i]);
                }
            }
        }
        // merge obj
        if (json.merge && Array.isArray(json.merge)) {
            for (let i = 0; i < json.merge.length; i++) {
                if (typeof json.merge[i] === 'object' && Array.isArray(json.merge[i].paths) && typeof json.merge[i].path === 'string') {
                    this._merge.push(json.merge[i]);
                }
            }
        }
        // rename obj
        if (json.rename && Array.isArray(json.rename)) {
            for (let i = 0; i < json.rename.length; i++) {
                if (typeof json.rename[i] === 'object' && typeof json.rename[i].glob === 'string' && (typeof json.rename[i].path === 'string' || typeof json.rename[i].dir === 'string')) {
                    this._rename.push(json.rename[i]);
                }
            }
        }
        // except obj
        if (json.except && Array.isArray(json.except)) {
            for (let i = 0; i < json.except.length; i++) {
                if (typeof json.except[i] === 'string') this._except.push(json.except[i]);
            }
        }
    }



    #execSetup() {

        let obj, tars = [], arr = [];

        for (let i = 0; i < this._setup.length; i++) {
            
            obj = this._setup[i];
            
            if (typeof obj.glob === 'string' && obj.glob.length > 0) {
                arr = mm.match(this.targets.map((obj) => { return obj.subPath }), obj.glob);
            }
            if (arr.length > 0) {
                tars = this.targets.filter((obj) => { return arr.indexOf(obj.subPath) > -1 })
                
                if (obj.isExcept && typeof obj.isExcept === 'boolean') {
                    tars.map( (o) => { o.isExcept =  obj.isExcept; });
                }

                if (obj.referType && typeof obj.referType === 'number') {
                    tars.map( (o) => { o.referType =  obj.referType; });
                }

                if (obj.refedType && typeof obj.refedType === 'number') {
                    tars.map( (o) => { o.refedType =  obj.refedType; });
                }
            }
        }
    }

    #execMerge() {

        let obj, arr = [];

        for (let i = 0; i < this._merge.length; i++) {
            
            obj = this._merge[i];

            if (typeof obj.glob === 'string' && obj.glob.length > 0) {
                arr = mm.match(this.targets.map((obj) => { return obj.subPath }), obj.glob);
            }
            if (arr.length > 0) {
                tars = this.targets.filter((obj) => { return arr.indexOf(obj.subPath) > -1 })
                
                for (let ii = 0; ii < obj.paths.length; ii++) {
                    
                    /**
                     * - paths 파일 검사 : 폴더 제외
                     * - path 단일 검사
                     * - path 타겟 조회 : 원본임
                     *  - path += paths data 추가
                     *  - paths 의 _owner 설정 => 참조하는 곳 구조 수정해야함
                     *  - isSave = false 처리
                     */

                }
            }
        }
    }

    #execRename() {
        
        let arr = [], obj, tars = [], filename, dir;
        let entry = this._task.entry;

        for (let i = 0; i < this._rename.length; i++) {
            obj = this._rename[i];
            // 동시에 존재시 경고 후 처리 무시
            if (typeof obj.path === 'string' && typeof obj.dir === 'string') {
                console.warn('install.rename 객체에 path, dir 동시에 존재합니다. 하나만 사용하세요.');
                continue;
            }
            
            if (typeof obj.glob === 'string' && obj.glob.length > 0 && (obj.path || obj.dir)) {
                arr = mm.match(this.targets.map((o) => { return o.subPath }), obj.glob);
                // arr = mm.match( this.targetPaths, obj.glob);
            }
            
            if (arr.length > 0) {
                
                // tars = this._getTarget(arr);
                tars = this.targets.filter((o) => { return arr.indexOf(o.subPath) > -1 })
                
                // glob, path 처리
                if (typeof obj.path === 'string' && obj.path.length > 0) {
                    if (arr.length !== 1) {
                        console.warn('install.rename 객체에 path 는 glob 하나마 매칭되어야 합니다.' + arr);
                        continue;                    
                    }
                    // static 검사
                    if (tars[0]._original.isStatic === true) {
                        console.warn('static 파일은 이름은 변경할 수 없습니다.' + tars[0]._original.fullPath);
                        continue;                    
                    }
                    // 경로 조립
                    // tars[0].fullPath = entry.dir + path.sep + entry.LOC.INS + path.sep + obj.path;
                    tars[0].subPath = obj.path;

                // glob, dir 처리
                } else if (typeof obj.dir === 'string' && obj.dir.length > 0) {

                    for (let i = 0; i < tars.length; i++) {
                        // static 검사
                        if (tars[i]._original.isStatic === true) {
                            console.warn('static 파일은 이름은 변경할 수 없습니다.' + tars[i]._original.fullPath);
                            continue;                    
                        }
                        if (tars[i].type === 10) {      // VirtualFolder
                            tars[i].subPath = obj.dir;
                        } else if (tars[i].type === 20 ||  tars[i].type === 30) {   // (Non)TextFile
                            tars[i].subPath = obj.dir + path.sep + tars[i].name;
                        }
                    }
                }
            }
        }
    }

    #execExcept() {

        let str, tars = [], arr = [];

        for (let i = 0; i < this._except.length; i++) {
            str = this._except[i];
            if (typeof str === 'string' && str.length  > 0) {
                arr = mm.match(this.targets.map((obj) => { return obj.subPath }), str);

                if (arr.length > 0) {
                    tars = this.targets.filter((obj) => { return arr.indexOf(obj.subPath) > -1 })
                    tars.map( (o) => { o.isExcept = false; });
                }
            }
        }
    }
}

exports.SourceBatch = SourceBatch;
exports.TargetSource = TargetSource;
exports.InstallMap = InstallMap;
