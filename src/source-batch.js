const path = require('path');
const fs = require('fs');
const mm = require('micromatch');
const at = require('./auto-task');
const { NonTextFile, TextFile, VirtualFolder, OriginalPath } = require('./original-path');

/**
 * 소스배치 클래스
 */
class SourceBatch {
    /*_______________________________________*/        
    // public
    pathType = 0;       // (0:자동, 1:절대, 2:상대)
    dupType = 1;        // (0:하위참조, 1:중복제거, 2:중복허용)
    isAlias = false;    // 설치시 별칭 포함 여부
    isRoot = true;
    
    /*_______________________________________*/        
    // protected
    static _instance = null;
    _batchFile = [];
    //_filter = [];
    _task = null;
    //_map = [];
    
    /*_______________________________________*/        
    // private
    _list = [];

    constructor() {
    }

    /*_______________________________________*/        
    // public method

    /**
     * TODO:: 제거 검토
     * @returns {this}
     */
    static getInstance() {  
        if (this._instance === null) {
            this._instance = new this();
        }
        return this._instance;
    }

    /**
     * 배치할 소스 추가 (컬렉션)
     * @param {*} collection SourceCollection 
     * @param {*} location 배치 위치 
     * @param {*} isSave 저장 유무
     */
    addCollection(collection, location) {

        let ori, tar;        
        // TODO:: 타입 검사
        for(let i = 0; i < collection.count; i++) {
            ori = collection[i];
            tar = new TargetSource(location, ori);
            ori._setTarget(tar);    // _target 설정
            this._list.push(tar);
        }
    }
    
    /**
     * 배칠할 소스 추가  (단일)
     * @param {*} tar 
     */
    add(tar) {
        if (tar instanceof TargetSource) this._list.push(tar);
    }

    /**
     * 전처리와 후처리 나누어야 함
     */
    save() {

        let autos;

        function getMergeData(tar, isRoot) {
            
            let data = '';
            // 자식 순환 조회
            for (let i = 0; i < tar._owned.length; i++) {
                if (tar._owned[i].isMerge === true) data += getMergeData(tar._owned[i], isRoot) + '\n';
                data += tar._owned[i].setData(isRoot) + '\n';
            }
            return data;
        }

        // 이벤트 발생
        this._task._onSave();

        // install map 처리
        autos = this._task.entry._getAllList(true);
        
        if (this._task.cursor === 'INSTALL') {
            // 중복제거 처리
            this.#deduplication(this.dupType);
            
            // 단일오토 별칭 경로 제거
            if (this.isAlias === false) this.#removeAlias();

            // 맨 하위부터 처리한다.
            for (let i = 0; i < autos.length; i++) {
                // 초기화 : parent, child
                autos[i].install.init();
                
                // 인스톨 설정 처리
                // autos[i].install.execute();
            }

            for (let i = 0; i < autos.length; i++) {
                // 초기화 : parent, child
                // autos[i].install.init();
                
                // 인스톨 설정 처리
                autos[i].install.execute();
            }

        }

        for (let i = 0; i < this._list.length; i++) {
            // TextFile 일 경우 콘텐츠 설정
            if (this._list[i]._original instanceof TextFile) {
                this._list[i].setData(this.isRoot);
            }
            // 병합 파일 처리
            if (this._list[i].isMerge === true)  {
                this._list[i].data = getMergeData(this._list[i], this.isRoot);
            }
        }

        // 타겟 저장
        this.#saveFile();

        // 이벤트 발생
        this._task._onSaved();
    }

    /**
     * 배치파일저장소 파일 및 배치생성파일 삭제
     */
    clear() {

        const batchfile = this._task.entry.dir +path.sep+ '__SaveFile.json';
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
     * @returns {array}
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
     * 경로 검사
     * @param {string} fullPath 
     * @returns {*}
     */
    validPath(fullPath) {
        for(let i = 0; i < this._list.length; i++)  {
            if (this._list[i].fullPath === fullPath) return false;
        }
        return true;
    }

    /**
     * 파일경로 중복발생시 새파일이름,이름_숫자
     * @param {string} fullPath 
     * @returns {*}
     */
    newFileName(fullPath) {
        
        let obj, filename;
        let delimiter = '_'; 

        obj = path.parse(fullPath);

        for(let i = 1; i < 100; i++)  { // 100개로 제한
            filename = obj.name + delimiter + i + obj.ext;
            if (this.validPath(obj.dir + path.sep + filename)) return filename;
        }
        console.warn('[실패 newFileName()] ' + fullPath );
        return obj.name;    // 원래 이름 리턴
    }

    /*_______________________________________*/        
    // private method

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
        let data = JSON.stringify(this._batchFile, null, '\t');
        fs.writeFileSync(this._task.entry.dir +path.sep+ '__SaveFile.json', data, 'utf8');   
    }

    /**
     * 배치파일저장소에 저장파일 로그 추가
     * @param {str} savePath 
     */
    #addBatchFile(savePath) {
        if (this._batchFile.indexOf(savePath) < 0) this._batchFile.push(savePath);
        console.log('SAVE : ' + savePath);
    }

    /**
     * 중복된 타겟소스를 제거후 별칭 경로를 제거한다.
     * @param {number} depType 0 자동, 1 전체중복제거, 2 전체중복허용
     * 방법1. for 중복 오토를 찾은 후, for 대상타겟 갯수만큼, 비교해서 같으면 합침 [추천]
     * 방법2. for 유일한 파일 목록을 추출후, for 중복되는 타겟를 찾음
     */
     #deduplication(depType) {
        // TODO:: isStatic 처리는 어디서??
        
        const all = this._task.entry._getAllList(true);
        let list = [];
        let dupAuto = [];
        let dupTar;
        let newTar;
        let _this = this;
        // let arrTarget = [];

        if (depType === 1) {
            list = all;
        } else if (depType === 0) {
            all.forEach( v, i => { 
                if (v.install.isOverlap === false) list.push(v);
            });
        } else return;

        // 중복 auto 조회
        list.forEach((v, i) => {
            if (list.some((vv, ii) => {
                return i !== ii && v instanceof vv.constructor && !dupAuto.find( vvv => {
                    return vvv.name === v.name; // REVIEW:: 인스턴스타입으로 변경 필요 검토 ??
                });
            })) dupAuto.push(v);    // 중복된 auto 삽입
        });

        dupAuto.forEach(auto => {
            this._list.forEach(tar => {
                // 대상 찾기
                if (tar._original._auto === auto) {
                    dupTar = [];    // 초기화
                    this._list.forEach(dup => {
                        // 대상과 원본경로가 같은 소스 찾기
                        if (tar !== dup && dup._original.fullPath === tar._original.fullPath) {
                            // 텍스트가 아니거나 텍스트이면서 data 가 같은 경우 
                            if (tar.type !== 30 || (tar.type === 30 && tar.data === dup.data)) {
                                dupTar.push(dup);
                            }
                        }
                    });

                    // 중복이 있는 경우
                    if (dupTar.length > 0) {
                        newTar = tar.clone();
                        newTar.subPath = auto.modName + path.sep + tar._original.subPath;    // set 에 설정
                        _this.add(newTar);
                        // 부모 변경
                        tar.owner = newTar;
                        tar.isSave = false;
                        dupTar.forEach(val => { 
                            val.owner = newTar;
                            val.isSave = false;
                        });
                    }
                }
            });
        });
    }

    /**
     * 경로 및 파일 중복 제거시, 모듈명 + 별칭 >> 모듈명으로 변경
     */
    #removeAlias() {
        
        const all = this._task.entry._getAllList(false); // entry 는 별칭이 없으므로
        let dupAuto = [], singleAuto = [];
        let sigleTar = [];
        
        // 중복 오토 조회
        all.forEach((v, i) => {
            if (all.some((vv, ii) => {
                return i !== ii && v instanceof vv.constructor && !dupAuto.find( vvv => {
                    return vvv.name === v.name;
                });
            })) dupAuto.push(v);        // 중복된 auto 삽입
        });
        
        // 단일 오토 조회
        all.forEach( v => {
            if (dupAuto.some( vv => {
                return !(v instanceof vv.constructor);
            })) singleAuto.push(v);    // 단일 auto 삽입
        });

        singleAuto.forEach(auto => {
            this._list.forEach(tar => {
                // 대상 찾기
                if (tar._original._auto === auto) {
                    tar.subPath  = auto.modName + path.sep + tar._original.subPath;
                }
            });
        });

        console.log(1)
    }
}

/**
 * 대상소스 클래스
 */
class TargetSource {
        
    /*_______________________________________*/
    // public
    isSave      = true;     // 저장유무, 활성화 상태
    isExcept    = false;    // save 시점에 제외 여부
    isMerge     = false;    // 병합 여부
    referType   = 0;        // 참조하는 타입
    refedType   = 0;        // 참조되어지는 타입
    type        = 0;        // 소스타입
    data        = null;
    
    /*_______________________________________*/
    // protected
    _original   = null;
    _owner      = null;
    _owned      = [];
    _batch      = SourceBatch.getInstance();

    /*_______________________________________*/
    // private
    #dir        = null;
    #location   = null;
    #fullPath   = null;

    /*_______________________________________*/
    // property
    get fullPath() {
        // return this.#fullPath;
        return this._owner === null ? this.#fullPath : this._owner.fullPath;
    }
    get dir() {
        // return this.#dir;
        return this._owner === null ? this.#dir : this._owner.dir;
    }
    set dir(val) {
        // this.#dir = val;
        if (this._owner === null) this.#dir = val;
        else this._owner.dir = val;
    }
    get location() {
        // return this.#location;
        return this._owner === null ? this.#location : this._owner.location;
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
        // this.#fullPath = this.dir + path.sep + this.location + path.sep + val;
        if (this._owner === null) this.#fullPath = this.#dir + path.sep + this.#location + path.sep + val;
        else this._owner.subPath = val;
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
    get owner() {
        return this._owner;
    }

    /**
     * 
     * @param {*} location 
     * @param {*} ori?  선택사항 
     */
    constructor(location, ori) {
        
        let entry = this._batch._task.entry;
        let auto  = null;

        this.#location = location;
        
        if (ori instanceof OriginalPath) {
            this._original = ori;    
            auto = ori._auto;
            this.#setType(ori);
            this.#initPath();
            if (location === entry.LOC.INS) auto.install.add(this);
        }
    }

    /*_______________________________________*/        
    // public method

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
                    if ( refSrc.dir.indexOf(entry.dir) < 0) { // 앤트리 하위 여부 검사
                        throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                    }
                    localDir = path.relative(entry.dir, refSrc.dir);
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
        return this.data;
    }

    /**
     * 타겟소스 복제본 리턴
     * @returns {this}
     */
    clone() {
        
        let obj = new TargetSource(this.location, this._original);
        
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

    /*_______________________________________*/        
    // private method

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
                alias = useAuto.modName +'-'+ auto.alias;
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
            alias = auto.alias ? auto.modName + path.sep + auto.alias : auto.modName;
            fullPath = entry.dir + path.sep + entry.LOC.INS + path.sep + alias + path.sep + src.subPath;
            this.#dir = entry.dir;
            this.#fullPath = fullPath;          
        }
    }    

    /**
     * 타입 설정
     * @param {OriginalPath} ori 
     * @returns {*}
     */
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
    
    /*_______________________________________*/        
    // public
    isOverlap = false;

    /*_______________________________________*/        
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

    /*_______________________________________*/      
    // property  
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

    /*_______________________________________*/        
    // public method

    // 객체 얻기
    getObject() {

        var obj = {};
        
        for (var prop in this) {
            if (['_setup', '_merge', '_except', '_global', '_rename', 'isOverlap'].indexOf(prop) > -1) {
                obj[prop.replace('_', '')] = this[prop];            
            }
        }
        return obj; 
    }

    /**
     * 타겟소스 추가
     * @param {TargetSource} target 
     */
    add(target) {
        this._list.push(target);
    }
    
    /**
     * 인스톨맵 초기화 : _parent, _child 설정
     */
    init() {

        const auto = this._auto;

        if (auto._owner && auto._owner.install instanceof InstallMap) {
            this._parent = auto._owner.install;     // 부모 InstallMap 연결
            auto._owner.install._child.push(this);  // 자식 InstallMap 등록
        }
    }

    /**
     * 인트롤맵 처리 : 세팅 >> 이름변경 >> 병합 >> 제외
     */
    execute() {
        
        if (this._setup.length > 0) this.#execSetup();
        if (this._rename.length > 0) this.#execRename();
        if (this._merge.length > 0) this.#execMerge();
        if (this._except.length > 0) this.#execExcept();
    }

    /*_______________________________________*/        
    // private method

    /**
     * json 객체를 통해 객체 가져오기 (생성시)
     * @param {JSON} json 
     */
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

    /**
     * setup 실행
     */
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

    /**
     * 이름변경 실행 
     *  - 단일 파일명 변경
     *  - 복수 경로 변경 (폴더)
     */
    #execRename() {
        
        let arr = [], obj, tars = [];
        let entry = this._task.entry;
        const batch = this._task.batch;
        let fullPath, subPath;

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
                    subPath = obj.path;
                    fullPath = tars[0].dir + path.sep + tars[0].location + path.sep + subPath;
                    // 중복검사
                    if (!batch.validPath(fullPath)) {
                        subPath = path.dirname(subPath) + path.sep + batch.newFileName(fullPath);
                        console.warn('[중복파일 이름재정의] ' + fullPath + ' >> ' + subPath)
                    }
                    tars[0].subPath = subPath;

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
                        } else if (tars[i].type === 20 ||  tars[i].type === 30) {   // TextFile & NonTextFile
                            
                            subPath = obj.dir + path.sep + tars[i].name;
                            fullPath = tars[i].dir + path.sep + tars[i].location + path.sep + subPath;
                            // 중복검사
                            if (!batch.validPath(fullPath)) {
                                subPath = path.dirname(subPath) + path.sep + batch.newFileName(fullPath);
                                console.warn('[중복파일 이름재정의] ' + fullPath + ' >> ' + subPath)
                            }
                            tars[i].subPath = subPath;
                        }
                    }
                }
            }
        }
    }

    /**
     * 파일 머지는 특수한 경우이다. 타겟소스의 타입이 텍스트의 경우만 유효하다.
     */
    #execMerge() {

        let obj, arr = [], tars = [], newTar;
        const entry = this._task.entry;
        const batch = this._task.batch;

        for (let i = 0; i < this._merge.length; i++) {
            
            obj = this._merge[i];

            // 유효성 검사
            if (typeof Array.isArray(obj.paths) && obj.paths.length > 0 && typeof obj.path === 'string' && obj.path.length > 0) {
                obj.paths.forEach(v => {
                    if (typeof v === 'string' && v.length > 0) arr.push(v);
                });
            }
            if (arr.length > 0) {

                arr.forEach(v => {
                    let find = this.targets.find(vv => { return vv.subPath === v });
                    if (find) tars.push(find);
                });

                if (tars.length > 0) {
                    newTar = new TargetSource(entry.LOC.INS, null);
                    newTar.dir = entry.dir;
                    newTar.type = 30;
                    newTar.subPath = obj.path;
                    newTar.data  = '';
                    newTar.isMerge = true;

                    tars.forEach(v => {
                        if (v.type === 30) {
                            newTar.data += v._original.data + '\n'; // TODO:: 삭제해야함 isMerge = true
                            v.owner = newTar;
                            v.isSave = false;    
                        }
                    });
                    batch.add(newTar);
                }                
            }
        }
    }

    /**
     * install 시 제외 파일 설정
     */
    #execExcept() {

        let str, tars = [], arr = [];

        for (let i = 0; i < this._except.length; i++) {
            str = this._except[i];
            if (typeof str === 'string' && str.length  > 0) {
                arr = mm.match(this.targets.map((obj) => { return obj.subPath }), str);

                if (arr.length > 0) {
                    tars = this.targets.filter((obj) => { return arr.indexOf(obj.subPath) > -1 })
                    tars.map( (o) => { o.isExcept = true; });
                }
            }
        }
    }
}

exports.SourceBatch = SourceBatch;
exports.TargetSource = TargetSource;
exports.InstallMap = InstallMap;
