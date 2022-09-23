const path = require('path');
const fs = require('fs');

// const {AutoTask} = require('./auto-task');
const a = require('./auto-task');

// 배치 관리자
class SourceBatch {

    // public
    isRoot = true;
    defaultPath = 1;    // (0:자동, 1:상대, 2:절대)
    // protected
    static _instance = null;
    _batchFile = [];
    _filter = [];
    _task = null;
    // private
    #list = [];

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
     */
    // add(collection) {
    add(collection, location, isSave) {

        let org, tar;        
        // TODO:: 타입 검사

        for(let i = 0; i < collection.count; i++) {
            org = collection[i];
            tar = new TargetSource(org, location, isSave);
            // this.setFullPath(tar, isSave);
            // this.setPath()
            // tar = new TargetSource(org);
            org._setTarget(tar);    // _target 설정
            // org._target = tar;      
            this.#list.push(tar);
        }
    }

    /**
     * 전처리와 후처리 나누어야 함
     */
    save() {

        for (let i = 0; i < this.#list.length; i++) {
            this.#list[i].setData(this.isRoot);
        }

        // TODO:: 중복제거

        // 타겟 저장
        this.#saveFile();
    }

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
        this.#list = [];
    }

    getBatchList() {
        
        let rArr = [];

        for (let i = 0; i < this.#list.length; i++) {
            rArr.push(
                {
                    ori: this.#list[i]._orignal.fullPath,
                    tar: this.#list[i].fullPath
                }
            );
        }
        return rArr;
    }

    #saveFile() {

        let isExists, dirname, savePath, data;
        const _this = this;

        for (let i = 0; i < this.#list.length; i++) {
            
            if (this.#list[i].savePath !== null) {
                savePath = this.#list[i].savePath;
                data = this.#list[i].data;
                dirname = path.dirname(savePath);
                // 디렉토리 만들기
                isExists = fs.existsSync(dirname);
                if(!isExists) {
                    fs.mkdirSync(dirname, {recursive: true} );
                }
                // TODO:: try 로 예외 처리함
                fs.writeFileSync(savePath, data, 'utf8');   
    
                // fs.writeFile(fullPath, content, 'utf8', function(error){ 
                //     console.log('write :'+ fullPath);
                // });
                // 배치 로그 등록
                this.#addBatchFile(savePath);    
            }
        }
        // 배치 로그 저장
        this.#saveBatchFile();
    }

    #saveBatchFile() {
        // batchFile
        let data = JSON.stringify(this._batchFile);
        fs.writeFileSync(this._task.entry.dir +path.sep+ '__BATCH_FILE.json', data, 'utf8');   
    }

    #addBatchFile(savePath) {
        if (this._batchFile.indexOf(savePath) < 0) this._batchFile.push(savePath);
        console.log('SAVE : ' + savePath);
    }
}


class TargetSource {
    
    // public
    savePath    = null;
    fullPath    = null;
    location    = null;
    dir         = null;
    data        = null;
    // protected
    _orignal    = null;
    _ref        = null;
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
    get baseDir() {
        return path.dirname(this.basePath);
    }
    get basePath() {
        return path.relative(this.dir, this.fullPath);
    }

    constructor(org, location, isSave) {
        this._orignal = org;
        this.location = location;
        this.#setPath(isSave);
    }

    /**
     * 소스 내용(data) 설정
     * @param {*} isRoot 절대경로시 location 경로 포함 여부 (install 시점)
     */
    setData(isRoot = true, defaultPath = 1) {
        
        let org, data, arrObj = [], list, change, refSrc, localDir;
        let dir, entry;

        org = this._orignal;
        data = org.data;
        arrObj = []; // 초기화
        entry = this._batch._task.entry;

        for (let ii = 0; ii < org._ref.length; ii++) {
            refSrc = org._ref[ii].src;
            // 1) 타겟소스가 없을 경우
            if (refSrc._target === null || refSrc._target.fullPath === null) {
                // 상대경로 (오토기준)
                if (defaultPath === 1) {
                    dir = path.dirname(this.fullPath);
                    change = path.relative(dir, refSrc.fullPath);       
                } else {
                    // change = path.sep + refSrc.basePath;
                    
                    // 엔트리의 경우
                    if (entry === refSrc._auto) {
                        // if (this.isRoot) change = path.sep + refSrc.basePath;           // root 기준 절대경로
                        // else change = path.sep + refSrc.subPath;                        // location 기준 절대경로       
                        change = path.sep + refSrc.basePath;
                    
                    // 하위의 경우
                    } else {
                        // 앤트리 하위 여부 검사
                        if ( refSrc._auto.dir.indexOf(entry.dir) < 0) {
                            throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                        }
                        localDir = path.relative(entry.dir, refSrc._auto.dir);
                        change = path.sep + localDir + path.sep + refSrc.basePath;
                        // if (this.isRoot) change = path.sep + refSrc.basePath;           // root 기준 절대경로
                        // else change = path.sep + refSrc.subPath;                        // location 기준 절대경로       

                    }
                }
            
            // 2) 타겟소스가 있을 경우
            } else {
                // 상대경로 (오토기준)
                if (defaultPath === 1) {
                    dir = path.dirname(this.fullPath);
                    change = path.relative(dir, refSrc._target.fullPath);       
                } else {
                    // change = path.sep + refSrc._target.basePath;

                    // 엔트리의 경우
                    if (entry === refSrc._auto) {
                        if (isRoot) change = path.sep + refSrc._target.basePath;   // root 기준 절대경로
                        else change = path.sep + refSrc._target.subPath;                // location 기준 절대경로       
                    
                    // 하위의 경우
                    } else {
                        // 앤트리 하위 여부 검사
                        if ( refSrc._target.dir.indexOf(entry.dir) < 0) {
                            throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                        }
                        
                        localDir = path.relative(entry.dir, refSrc._target.dir);
                        if (localDir.length > 0) {
                            // if (this.isRoot) {
                            //     change = path.sep + localDir + path.sep + refSrc._target.basePath;    
                            // } else {
                            //     change = path.sep + localDir + path.sep + refSrc._target.subPath;                                    
                            // }                                    
                            change = path.sep + localDir + path.sep + refSrc._target.basePath;    
                        
                        // 'install', 'depend' 의 경우
                        } else {    // install 의 경우
                            if (isRoot) change = path.sep + refSrc._target.basePath;
                            else change = path.sep + refSrc._target.subPath;
                        }
                        // if (this.isRoot) change = path.sep + refSrc._target.basePath;   // root 기준 절대경로
                        // else change = path.sep + refSrc._target.subPath;                // location 기준 절대경로       
                    }
                    // if (this.isRoot) change = path.sep + refSrc._target.basePath;   // root 기준 절대경로
                    // else change = path.sep + refSrc._target.subPath;                // location 기준 절대경로   
                }
                
            }

            for (let iii = 0; iii < org._ref[ii].list.length; iii++) {
                list = org._ref[ii].list[iii];
                arrObj.push({
                    idx: list.idx,
                    txt: list.key,
                    rep: change,
                });
            }
        }
        // 파일내용 저장
        this.data = this.#replacePath(data, arrObj);
    }
    
    /**
     * fullPath, savePath, dir 속성을 설정한다.
     * @param {boolean} isSave 
     */
    #setPath(isSave) {

        let auto, src, useAuto, entry, alias, savePath;
        let location;
        // const AutoTask = require('./auto-task');
        entry = this._batch._task.entry;

        // for (let i = 0; i < this.#list.length; i++) {
            
        src = this._orignal;
        auto = src._auto;
        // this.#list[i].location = location;
        location = this.location;

        if (location == entry.LOC.DIS) {
            // src = this.#list[i]._orignal;
            // auto = src._auto;
            // 엔트리의 경우
            // if (entryAuto === src._auto && src.location === entryAuto.LOC.SRC) {
            if (entry === src._auto) {
                // dir + location(DIS) + subPath
                savePath = auto.dir + path.sep + entry.LOC.DIS + path.sep + src.subPath;
                // 하위 오토의 경우
            } else {
                // dir + location(DIS) + 사용처명-별칭 + subPath
                useAuto = auto._owner;
                alias = useAuto.name +'-'+ auto.alias;
                savePath = auto.dir + path.sep + entry.LOC.DIS + path.sep + alias + path.sep + src.subPath;
            }
            this.dir = auto.dir;
            this.fullPath = savePath;
        
        } else if (location == entry.LOC.DEP) {
            // src = this.#list[i]._orignal;
            // entryAuto = this.#autoTask.entry;
            // auto = this.#list[i]._orignal._auto;
            alias = auto.alias;
            savePath = entry.dir + path.sep + entry.LOC.DEP + path.sep + alias + path.sep + src.subPath;
            this.dir = entry.dir;
            this.fullPath = savePath;
        
        } else if (location == entry.LOC.INS) {
            // TODO:: 컨첸츠 중복 검사 및 제거 알고니즘 추가해야함
            // src = this.#list[i]._orignal;
            // entryAuto = this.#autoTask.entry;
            // auto = this.#list[i]._orignal._auto;               

            alias = auto.alias ? auto.name + path.sep + auto.alias : auto.name;
            savePath = entry.dir + path.sep + entry.LOC.INS + path.sep + alias + path.sep + src.subPath;
            this.dir = entry.dir;
            this.fullPath = savePath;          
        }
        // }

        if (isSave) this.savePath = this.fullPath;
    }    


    /**
     * 파일내용(data) 을 배열에 맞게 교체한다.
     * @param {*} data 
     * @param {*} arrObj 
     * @returns 
     */
     #replacePath(data, arrObj) {
        var obj
        var base_idx = 0, idx = 0;
        var org = data;
        var org_prev = '', org_next = ''

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
            idx = obj.idx + base_idx;                           // 시작 인텍스
            if (org.substr(idx, obj.txt.length) === obj.txt) {  // 검사
                org_prev = org.slice(0, idx);                   // 앞 문자열
                org_next = org.slice(idx + obj.txt.length);     // 뒤 문자열
                org = org_prev + obj.rep + org_next;
                base_idx = base_idx + obj.rep.length - obj.txt.length;
            } else {
                console.warn('실패 '+ obj);
            }
        }
        return org;
    }
}

// module.exports = SourceBatch;
exports.SourceBatch = SourceBatch;
// exports.call = SourceBatch;

