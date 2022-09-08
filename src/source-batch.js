const path = require('path');
const fs = require('fs');
// const AutoTask = require('./auto-task');

// 배치 관리자
class SourceBatch {

    // public
    isRoot = true;
    defaultPath = 1;    // (0:자동, 1:상대, 2:절대)
    // protected
    _instance = null;
    _filter = [];
    // private
    #list = [];
    #autoTask;
    #storage = []; // 저장 위치

    constructor() {
    }

    // static getInstance(task) {
    //     if (typeof this._instance === 'undefined') {
    //         this._instance = new this();
    //     }
    //     return this._instance;
    // }
    static getInstance(task) {
        if (typeof this._instance === 'undefined' && typeof task === 'object') {
            this._instance = new this();
            this._instance.#autoTask = task;
        } else if (this._instance === null && typeof task !== 'object') {
            throw new Error(' start [task] request fail...');
        }
        return this._instance;
    }

    /**
     * 배치할 소스 추가
     * @param {*} collection SourceCollection 
     */
    // add(collection, location) {
    add(collection) {
        let org, tar;        
        // TODO:: 타입 검사

        for(let i = 0; i < collection.count; i++) {
            // tar = new TargetSource(collection[i], location);
            org = collection[i];
            tar = new TargetSource(org);
            org._target = tar;
            this.#list.push(tar);
        }
    }

    /**
     * 전처리와 후처리 나누어야 함
     */
    // save(location, isRelative = false) {
    save(location) {
        // 경로 설정
        this.setPath(location);
        
        // 콘텐츠 수정
        // this.setData(isRelative);
        this.setData();

        // 타겟 저장
        this.saveFile();
    }

    // 
    /**
     * 저장할 경로 설정
     * TODO:: 동일 내용의 경우 중복 제거 포함해야 함
     */
    setPath(location) {

        let auto, src, useAuto, entryAuto, alias, savePath;

        entryAuto = this.#autoTask.entry;

        for (let i = 0; i < this.#list.length; i++) {
            
            src = this.#list[i]._orignal;
            auto = src._auto;
            this.#list[i].location = location;

            if (location == entryAuto.LOC.DIS) {
                // src = this.#list[i]._orignal;
                // auto = src._auto;
                // 엔트리의 경우
                if (entryAuto === src._auto && src.location === entryAuto.LOC.SRC) {
                    // dir + location(DIS) + subPath
                    savePath = auto.dir + path.sep + entryAuto.LOC.DIS + path.sep + src.subPath;
                    // 하위 오토의 경우
                } else {
                    // dir + location(DIS) + 사용처명-별칭 + subPath
                    useAuto = auto._owner;
                    alias = useAuto.name +'-'+ auto.alias;
                    savePath = auto.dir + path.sep + entryAuto.LOC.DIS + path.sep + alias + path.sep + src.subPath;
                }
                this.#list[i].dir = auto.dir;
                this.#list[i].fullPath = savePath;
            
            } else if (location == entryAuto.LOC.DEP) {
                // src = this.#list[i]._orignal;
                // entryAuto = this.#autoTask.entry;
                // auto = this.#list[i]._orignal._auto;
                alias = auto.alias;
                savePath = entryAuto.dir + path.sep + entryAuto.LOC.DEP + path.sep + alias + path.sep + src.subPath;
                this.#list[i].dir = entryAuto.dir;
                this.#list[i].fullPath = savePath;
            
            } else if (location == entryAuto.LOC.INS) {
                // TODO:: 컨첸츠 중복 검사 및 제거 알고니즘 추가해야함
                // src = this.#list[i]._orignal;
                // entryAuto = this.#autoTask.entry;
                // auto = this.#list[i]._orignal._auto;               

                alias = auto.alias ? auto.name + path.sep + auto.alias : auto.name;
                savePath = entryAuto.dir + path.sep + entryAuto.LOC.INS + path.sep + alias + path.sep + src.subPath;
                this.#list[i].dir = entryAuto.dir;
                this.#list[i].fullPath = savePath;          
            }
        }
    }

    // setData(isRelative) {
    setData() {
        
        let org, data, arrObj = [], list, change, refSrc, localPath;
        let dir;

        for (let i = 0; i < this.#list.length; i++) {
            org = this.#list[i]._orignal;
            data = org.data;
            arrObj = []; // 초기화

            for (let ii = 0; ii < org._ref.length; ii++) {
                refSrc = org._ref[ii].src;
                // 1) 타겟소스가 없을 경우
                if (refSrc._target === null || refSrc._target.fullPath === null) {
                    // 상대경로 (오토기준)
                    if (this.defaultPath === 1) {
                        dir = path.dirname(this.#list[i].fullPath);
                        change = path.relative(dir, refSrc.fullPath);       
                    } else {
                        // change = path.sep + refSrc.basePath;
                        
                        // 엔트리의 경우
                        if (this.#autoTask.entry === refSrc._auto) {
                            if (this.isRoot) change = path.sep + refSrc.basePath;           // root 기준 절대경로
                            else change = path.sep + refSrc.subPath;                        // location 기준 절대경로       
                        
                        // 하위의 경우
                        } else {
                            // 앤트리 하위 여부 검사
                            if ( refSrc._auto.dir.indexOf(this.#autoTask.entry.dir) < 0) {
                                throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                            }
                            localPath = path.relative(this.#autoTask.entry.dir, refSrc._auto.dir);
                            change = path.sep + localPath + path.sep + refSrc.basePath;
                            // if (this.isRoot) change = path.sep + refSrc.basePath;           // root 기준 절대경로
                            // else change = path.sep + refSrc.subPath;                        // location 기준 절대경로       

                        }
                    }
                
                // 2) 타겟소스가 있을 경우
                } else {
                    // 상대경로 (오토기준)
                    if (this.defaultPath === 1) {
                        dir = path.dirname(this.#list[i].fullPath);
                        change = path.relative(dir, refSrc._target.fullPath);       
                    } else {
                        // change = path.sep + refSrc._target.basePath;

                        // 엔트리의 경우
                        if (this.#autoTask.entry === refSrc._auto) {
                            if (this.isRoot) change = path.sep + refSrc._target.basePath;   // root 기준 절대경로
                            else change = path.sep + refSrc._target.subPath;                // location 기준 절대경로       
                        
                        // 하위의 경우
                        } else {
                            // 앤트리 하위 여부 검사
                            if ( refSrc._target.dir.indexOf(this.#autoTask.entry.dir) < 0) {
                                throw new Error(' 절대경로를 사용할려면 하위오토는 앤트리 오토의 하위에 있어야 합니다. fail...');
                            }
                            
                            localPath = path.relative(this.#autoTask.entry.dir, refSrc._target.dir);
                            if (this.isRoot) {
                                if (localPath.length === 0) change = path.sep + refSrc._target.basePath;
                                else change = path.sep + localPath + path.sep + refSrc._target.basePath;    
                            } else {
                                if (localPath.length === 0) change = path.sep + refSrc._target.subPath;
                                else change = path.sep + localPath + path.sep + refSrc._target.subPath;                                    
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
            this.#list[i].data = this.#replacePath(data, arrObj);
        }
    }

    saveFile() {

        let isExists, dirname, fullPath, data;
        const _this = this;

        for (let i = 0; i < this.#list.length; i++) {
            fullPath = this.#list[i].fullPath;
            data = this.#list[i].data;
            dirname = path.dirname(fullPath);
            // 디렉토리 만들기
            isExists = fs.existsSync(dirname);
            if(!isExists) {
                fs.mkdirSync(dirname, {recursive: true} );
            }
            // TODO:: try 로 예외 처리함
            fs.writeFileSync(fullPath, data, 'utf8');   

            // fs.writeFile(fullPath, content, 'utf8', function(error){ 
            //     console.log('write :'+ fullPath);
            // });   
        }
    }

    getBatchList() {
        
        let rArr = [];

        for (let i = 0; i < this.#list.length; i++) {
            rArr.push(this.#list[i].basePath);
        }
        return rArr;
    }

    clear() {}

    /**
     * 
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


class TargetSource {
    
    // public
    fullPath = null;
    location = null;
    data = null;
    dir = null;
    // protected
    _orignal = null;

    // 프로퍼티
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

    // constructor(org, location) {
    constructor(org) {
        this._orignal = org;
        // this.location = location;
    }
}

module.exports = SourceBatch;