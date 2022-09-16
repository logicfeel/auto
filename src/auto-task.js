const fs = require('fs');
const path = require('path');
// const SourceBatch = require('./source-batch');
const { SourceBatch } = require('./source-batch');
// const a = require('./source-batch');

// CommondJS 와 ES 모듈과 동시에 사용할 수 없다.
// import fs from 'fs';
// import path from 'path';
// import SourceBatch from './source-batch';

class AutoTask {

    // public
    entry = null;
    batch = null;
    // batch = a.SourceBatch.getInstance();
    // protected
    static _instance = null;
    // private
    #__dir = null;

    constructor() {
        this.batch = SourceBatch.getInstance();
        this.batch._task = this;
    }

    // static 사용
    // static getInstance(dir) {
    //     // 검사
    //     if (this._instance === null && typeof dir !== 'string') {
    //         throw new Error(' start [dir] request fail...');
    //     }
    //     if (this._instance === null) {
    //         this._instance = new this();
    //         this._instance.#__dir = dir;
    //     }
    //     return this._instance;
    // }

    static create(dir) {
        if (typeof dir !== 'string' || dir.length === 0) {
            throw new Error(' start [dir] request fail...');
        }
        this._instance = new this();
        this._instance.#__dir = dir;
        return this._instance;
    }
    static getInstance() {
        if (this._instance === null) {
            throw new Error(' 태스크가 생성되지 않았습니다. [dir] request fail...');
        }
        return this._instance;
    }

    // 내부에 사용
    // static getInstance(dir) {
    //     if (typeof this._instance === 'undefined' && typeof dir === 'string') {
    //         this._instance = new this();
    //         this._instance.__dir = dir;
    //     } else if (this._instance === null && typeof dir !== 'string') {
    //         throw new Error(' start [dir] request fail...');
    //     }
    //     return this._instance;
    // }

    /**
     * 엔트리 오토만 재배치 한다.
     * 파일 변경 감시수 자동 업데이트에 활용함
     */
    do_update() {

    }
    
    /**
     * 강제로 전체를 오토를 dist 한다.
     */
    do_dist() {
        
        // 로딩
        this._load();

        // 대상 오토 조회
        let list = this.entry._getAllList(true);

        for (let i = 0; i < list.length; i++) {
            list[i].readSource(true, false);
        }

        // 의존성 로딩 및 설정
        for (let i = 0; i < list.length; i++) {
            list[i].resolver.load();
            list[i].resolver.resolve();
            // this.batch.add(list[i].src);
            this.batch.add(list[i].src, this.entry.LOC.DIS, true);
        }

        // 저장
        // this.batch.isRoot = true;
        // this.batch.save(this.entry.LOC.DIS, true);
        this.batch.defaultPath = 2;     // 기본절대경로
        // this.batch.save(this.entry.LOC.DIS);
        this.batch.save();
    }

    /**
     * 제외 모듈 : 엔트리모듈, sub모듈, super모듈(상위포함)
     * 처리 모듈 : 제외 모듈의 포함이 안되면서, /dist 폴더가 없는 경우
     */
    do_depend() { 
        // 로딩
        this._load();

        /**
         * TODO:: 대상 오토의 1차 의존성의 구조까지 로딩해야함
         * 확인필요 !!
         */
        let all = this.entry._getAllList();    // 엔트리는 제외
        let dist = [];

        // 대상 오토 조회
        let list = this.entry._getDependList();

        /**
         * - 구조만 불러와도 배치는 할 수 있다.
         */

        // 이부분은 정의 역활을 한다.
        for (let i = 0; i < list.length; i++) {
            list[i].readSource(true, false);
        }

        // 의존성 로딩 및 설정
        for (let i = 0; i < list.length; i++) {
            list[i].resolver.load();
            list[i].resolver.resolve();     // 참조(_ref) 연결됨
            this.batch.add(list[i].src);    // target 연결됨
        }

        // 구조 예시!!
        // for (let i = 0; i < list.length; i++) {
        //     list[i].resolver.load();
        //     list[i].resolver.resolve();     // 참조(_ref) 연결됨
        //     this.batch.add(list[i].src, this.entry.LOC.DEP);
        // }


        // 저장
        // this.batch.isRoot = true;
        // this.batch.save(this.entry.LOC.DEP, true);        
        // this.batch.defaultPath = 1;      // 기본상대경로
        this.batch.defaultPath = 2;         // 기본절대경로
        this.batch.save(this.entry.LOC.DEP);            
    }

    do_install() {
        // 로딩
        this._load();

        // 대상 오토 조회
        let list = this.entry._getAllList(true);

        for (let i = 0; i < list.length; i++) {
            list[i].readSource(true, true);
        }

        // 의존성 로딩 및 설정
        for (let i = 0; i < list.length; i++) {
            list[i].resolver.load();
            list[i].resolver.resolve();
            this.batch.add(list[i].src);
            this.batch.add(list[i].out);
        }

        // 저장
        // this.batch.save(true);
        // this.batch.install
        // this.batch.rootDir = this.entry.LOC.INS;
        this.batch.isRoot = false;  // insall 뒤부터
        this.batch.defaultPath = 2;         // 기본절대경로
        // this.batch.save(this.entry.LOC.DEP, false);  // 절대경로
        this.batch.save(this.entry.LOC.INS);  // 절대경로
    }

    do_reset() {
        
        let dir, entry, delPath;

        // 로딩
        this._load();
        // 배치 파일 삭제
        this.batch.clear();
        
        // 디렉토리 삭제        
        entry = this.entry;
        dir = entry.dir;

        delPath = dir +path.sep+ entry.LOC.DIS;
        if (fs.existsSync(delPath)) fs.rmSync(delPath, { recursive: true });
        delPath = dir +path.sep+ entry.LOC.DEP;
        if (fs.existsSync(delPath)) fs.rmSync(delPath, { recursive: true });
        delPath = dir +path.sep+ entry.LOC.INS;
        if (fs.existsSync(delPath)) fs.rmSync(delPath, { recursive: true });
        delPath = dir +path.sep+ entry.LOC.PUB;
        if (fs.existsSync(delPath)) fs.rmSync(delPath, { recursive: true });

        // 대상 오토 조회
        let list = this.entry._getAllList(true);
        for (let i = 0; i < list.length; i++) {
            delPath = list[i].dir +path.sep+ entry.LOC.DIS;
            if (fs.existsSync(delPath)) fs.rmSync(delPath, { recursive: true });
        }
    }

    // entry 오토 로드
    _load() {
        console.log('_load()....');
        // 현재 폴더의 auto.js 파일 로딩
        let entryFile  = this.#__dir + '/auto.js'
        // 다양한 조건에 예외조건을 수용해야함
        const EntryAuto = require(entryFile);
        // 타입 검사해야함
        this.entry = new EntryAuto();
        
        this.batch._batchFile = this.entry._file;        
    }
}

// module.exports = AutoTask;
// exports = AutoTask;
exports.AutoTask = AutoTask;
// exports.call = AutoTask;


