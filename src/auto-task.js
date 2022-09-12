const SourceBatch = require('./source-batch');
const path = require('path');

class AutoTask {

    // public
    entry = null;
    batch = SourceBatch.getInstance(this);
    // protected
    static _instance = null;
    // private
    #__dir = null;

    constructor() {
    }

    // static 사용
    static getInstance(dir) {
        // 검사
        if (this._instance === null && typeof dir !== 'string') {
            throw new Error(' start [dir] request fail...');
        }
        if (this._instance === null) {
            this._instance = new this();
            this._instance.#__dir = dir;
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
            this.batch.add(list[i].src);
        }

        // 저장
        // this.batch.isRoot = true;
        // this.batch.save(this.entry.LOC.DIS, true);
        this.batch.defaultPath = 2;     // 기본절대경로
        this.batch.save(this.entry.LOC.DIS);
    }

    do_depend() { 
        // 로딩
        this._load();

        /**
         * TODO:: 대상 오토의 1차 의존성의 구조까지 로딩해야함
         * 확인필요 !!
         */
        // 대상 오토 조회
        let list = this.entry._getDependList();

        for (let i = 0; i < list.length; i++) {
            list[i].readSource(true, false);
        }

        // 의존성 로딩 및 설정
        for (let i = 0; i < list.length; i++) {
            list[i].resolver.load();
            list[i].resolver.resolve();
            this.batch.add(list[i].src);
        }

        // 저장
        // this.batch.isRoot = true;
        // this.batch.save(this.entry.LOC.DEP, true);        
        // this.batch.defaultPath = 1;      // 기본상대경로
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
        // this.batch.isRoot = false;  // insall 뒤부터
        this.batch.defaultPath = 2;         // 기본절대경로
        // this.batch.save(this.entry.LOC.DEP, false);  // 절대경로
        this.batch.save(this.entry.LOC.INS);  // 절대경로
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
    }
}

module.exports = AutoTask;
