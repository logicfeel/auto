const path = require('path');
const fs = require('fs');
// const a = require('./auto-task');
const { NonTextFile, TextFile, VirtualFolder } = require('./base-path');

/**
 * 소스배치 클래스
 */
class SourceBatch {
    // public
    isRoot = true;
    pathType = 0;    // (0:자동, 1:상대, 2:절대)
    // protected
    static _instance = null;
    _batchFile = [];
    _filter = [];
    _task = null;
    // private
    #_list = [];

    constructor() {
    }

    static getInstance() {
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
            tar = new TargetSource(ori, location, isSave);
            ori._setTarget(tar);    // _target 설정
            this.#_list.push(tar);
        }
    }

    /**
     * 전처리와 후처리 나누어야 함
     */
    save() {

        // 이벤트 발생
        this._task.entry._onBatch(this._task.entry);

        for (let i = 0; i < this.#_list.length; i++) {
            // TextFile 만 콘텐츠 설정
            if (this.#_list[i]._orignal instanceof TextFile) {
                this.#_list[i].setData(this.isRoot);
            }
        }

        // TODO:: 중복제거

        // 타겟 저장
        this.#_saveFile();

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
        this.#_list = [];
    }

    /**
     * 배치파일 목록 얻기
     * @returns {arr}
     */
    getBatchList() {
        
        let rArr = [];

        for (let i = 0; i < this.#_list.length; i++) {
            rArr.push(
                {
                    ori: this.#_list[i]._orignal.fullPath,
                    tar: this.#_list[i].fullPath
                }
            );
        }
        return rArr;
    }

    /**
     * 배치파일 저장
     */
    #_saveFile() {

        let isExists, dirname, savePath, data, orignal;
        const _this = this;
        // TODO:: try 로 예외 처리함
        for (let i = 0; i < this.#_list.length; i++) {
            
            if (this.#_list[i].savePath !== null) {
                orignal = this.#_list[i]._orignal;
                 
                // 텍스트 파일의 경우
                if (orignal instanceof TextFile) {
                    savePath = this.#_list[i].savePath;
                    data = this.#_list[i].data;
                    dirname = path.dirname(savePath);   
                    isExists = fs.existsSync(dirname);  // 디렉토리 검사
                    if(!isExists) {
                        fs.mkdirSync(dirname, {recursive: true} );  // 디렉토리 만들기
                    }
                    fs.writeFileSync(savePath, data, 'utf8');       
                    this.#_addBatchFile(savePath);  // 배치 로그 등록
                
                    // 비텍스트 파일의 경우
                } else if (orignal instanceof NonTextFile) {
                    savePath = this.#_list[i].savePath;
                    dirname = path.dirname(savePath);
                    isExists = fs.existsSync(dirname);  // 디렉토리 검사
                    if(!isExists) {
                        fs.mkdirSync(dirname, {recursive: true} ); // 디렉토리 만들기
                    }
                    // 복사
                    fs.copyFileSync(orignal.fullPath, savePath)
                    this.#_addBatchFile(savePath);   

                // (가상) 폴더의 경우
                } else if (orignal instanceof VirtualFolder) {
                    savePath = this.#_list[i].savePath;
                    isExists = fs.existsSync(savePath);
                    if(!isExists) {
                        fs.mkdirSync(savePath, {recursive: true} ); // 디렉토리 만들기
                    }
                }
            }
        }
        // 배치 로그 저장
        this.#_saveBatchFile();
    }

    /**
     * 배치파일저장소 저장
     */
    #_saveBatchFile() {
        // batchFile
        let data = JSON.stringify(this._batchFile);
        fs.writeFileSync(this._task.entry.dir +path.sep+ '__BATCH_FILE.json', data, 'utf8');   
    }

    /**
     * 배치파일저장소에 저장파일 로그 추가
     * @param {str} savePath 
     */
    #_addBatchFile(savePath) {
        if (this._batchFile.indexOf(savePath) < 0) this._batchFile.push(savePath);
        console.log('SAVE : ' + savePath);
    }
}

/**
 * 대상소스 클래스
 */
class TargetSource {
        
    // public
    savePath    = null;
    fullPath    = null;
    location    = null;
    dir         = null;
    data        = null;
    // protected
    _orignal    = null;
    _owner      = null;
    _batch      = SourceBatch.getInstance();

    // property
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

    constructor(ori, location, isSave) {
        this._orignal = ori;
        this.location = location;
        this.#_initPath(isSave);
    }

    /**
     * 소스 내용(data) 설정
     * @param {*} isRoot 절대경로시 location 경로 포함 여부 (install 시점)
     */
    setData(isRoot = true) {
        
        let ori, data, arrObj = [], list, change, refSrc, localDir;
        let dir, entry;
        let type, absolute, relative;

        ori = this._orignal;
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
                
                type = this._batch.pathType === 0 ? list.type : this._batch.pathType;

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
        this.#_replaceData(data, arrObj);
    }

    /**
     * fullPath, savePath, dir 속성을 설정한다.
     * @param {boolean} isSave 
     */
    #_initPath(isSave) {

        let auto, src, useAuto, entry, alias, savePath;
        let location;
        // const AutoTask = require('./auto-task');
        entry = this._batch._task.entry;

        src = this._orignal;
        auto = src._auto;
        location = this.location;

        if (location == entry.LOC.DIS) {
            if (entry === src._auto) {
                savePath = auto.dir + path.sep + entry.LOC.DIS + path.sep + src.subPath;
                
            } else {    // 하위 오토의 경우
                useAuto = auto._owner;
                alias = useAuto.name +'-'+ auto.alias;
                savePath = auto.dir + path.sep + entry.LOC.DIS + path.sep + alias + path.sep + src.subPath;
            }
            this.dir = auto.dir;
            this.fullPath = savePath;
        
        } else if (location == entry.LOC.DEP) {
            alias = auto.alias;
            savePath = entry.dir + path.sep + entry.LOC.DEP + path.sep + alias + path.sep + src.subPath;
            this.dir = entry.dir;
            this.fullPath = savePath;
        
        } else if (location == entry.LOC.INS) {
            // TODO:: 컨첸츠 중복 검사 및 제거 알고니즘 추가해야함
            alias = auto.alias ? auto.name + path.sep + auto.alias : auto.name;
            savePath = entry.dir + path.sep + entry.LOC.INS + path.sep + alias + path.sep + src.subPath;
            this.dir = entry.dir;
            this.fullPath = savePath;          
        }
        if (isSave) this.savePath = this.fullPath;
    }    

    /**
     * 파일내용(data) 을 배열에 맞게 교체한다.
     * @param {*} data 
     * @param {*} arrObj 
     * @returns 
     */
    #_replaceData(data, arrObj) {
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

exports.SourceBatch = SourceBatch;
exports.TargetSource = TargetSource;