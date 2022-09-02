const path = require('path');
const fs = require('fs');
const AutoTask = require('./auto-task');

// 배치 관리자
class SourceBatch {

    // protected
    _instance = null;
    // private
    __list = [];
    __storage = []; // 저장 위치
    #autoTask;

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
     * @param {*} src SourceCollection 
     */
    add(collection, location) {
        let org, tar;        
        // TODO:: 타입 검사

        for(let i = 0; i < collection.count; i++) {
            tar = new TargetSource(collection[i], location);
            org =  collection[i];
            org._target = tar;
            this.__list.push(tar);
        }
    }

    /**
     * 전처리와 후처리 나누어야 함
     */
    save() {
        // 경로 설정
        this.setFullPath();
        
        // 콘텐츠 수정
        this.setContent(true);

        // 타겟 저장
        this.saveFile();
    }

    // 동일 내용의 경우 중복 제거 포함해야 함
    setFullPath() {
        let auto, src, useAuto, alias, saveDir;

        for (let i = 0; i < this.__list.length; i++) {
            
            if (this.__list[i].location == 'dist') {
                src = this.__list[i]._orignal;
                auto = src._auto;
                // 엔트리의 경우
                if (this.#autoTask.entry === src._auto && src.location === src._auto.DIR.SRC) {
                    // dir + location(DIS) + subPath
                    saveDir = auto.__dir + path.sep + auto.DIR.DIS + path.sep + src.subPath;
                // 하위 오토의 경우
                } else {
                    // dir + location(DIS) + 사용처명-별칭 + subPath
                    useAuto = auto._owner;
                    alias = auto.name +'-'+ auto.alias;
                    saveDir = auto.__dir + path.sep + auto.DIR.DIS + path.sep + alias + path.sep + src.subPath;
                }
                this.__list[i].fullPath = saveDir;
            }
        }

    }

    // 경로해결 후 저장
    setContent(isRelative) {
        
        let org, content, arrObj = [], list, change, refSrc;
        
        for (let i = 0; i < this.__list.length; i++) {
            org = this.__list[i]._orignal;
            content = org.content;
            arrObj = []; // 초기화

            for (let ii = 0; ii < org._ref.length; ii++) {
                refSrc = org._ref[ii].src;
                // 타겟소스가 없을시
                if (refSrc._target === null || refSrc._target.fullPath === null) {
                    // 상대경로 (오토기준)
                    if (isRelative) {
                        change = path.relative(this.__list[i].baseDir, refSrc.basePath);       
                    } else {
                        change = path.sep + refSrc.basePath;
                    }
                } else {
                    // 상대경로 (오토기준)
                    if (isRelative) {
                        change = path.relative(this.__list[i].baseDir, refSrc._target.basePath);       
                    } else {
                        // change = path.sep + refSrc.basePath;
                        change = path.sep + refSrc._target.basePath;
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
            this.__list[i].content = this._replacePath(content, arrObj);
        }
    }

    saveFile() {

        let isExists, dirname, fullPath, content;
        const _this = this;

        for (let i = 0; i < this.__list.length; i++) {
            fullPath = this.__list[i].fullPath;
            content = this.__list[i].content;
            dirname = path.dirname(fullPath);
            // 디렉토리 만들기
            isExists = fs.existsSync(dirname);
            if(!isExists) {
                fs.mkdirSync(dirname, {recursive: true} );
            }
            // TODO:: try 로 예외 처리함
            fs.writeFileSync(fullPath, content, 'utf8');   

            // fs.writeFile(fullPath, content, 'utf8', function(error){ 
            //     console.log('write :'+ fullPath);
            // });   
        }
    }

    getBathList() {
        
        let rArr = [];

        for (let i = 0; i < this.__list.length; i++) {
            rArr.push(this.__list[i].basePath);
        }
        return rArr;
    }

    clear() {}

    /**
     * 
     * @param {*} content 
     * @param {*} arrObj 
     * @returns 
     */
    _replacePath(content, arrObj) {
        var obj
        var base_idx = 0, idx = 0;
        var org = content;
        var org_prev = '', org_next = ''

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
    location = null;
    fullPath = null;
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
        return path.relative(this._orignal._auto.__dir + path.sep + this.location, this.fullPath);
    }
    get baseDir() {
        return path.dirname(this.basePath);
    }
    get basePath() {
        return path.relative(this._orignal._auto.__dir, this.fullPath);
    }

    constructor(org, location) {
        this._orignal = org;
        this.location = location;
    }
}

module.exports = SourceBatch;