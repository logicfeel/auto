const SourceBatch = require('./source-batch');
const path = require('path');

class AutoTask {

    // public
    entry = null;
    batch = SourceBatch.getInstance(this);
    // protected
    static _instance = null;
    // private
    __dir = null;

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
            this._instance.__dir = dir;
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

        /**
         * 1. 오토를 재귀함수로 가져오는 방법과
         * 2. 태스크에서 일괄적으로 가져오는 방법 
         * 중 선택해야함
         */
        // function _loadAll(auto) {

        // }

        // 로딩
        this._load();

        // src, out 읽기
        this.entry.readSource(true);
        
        for (let i = 0; i < this.entry.mod.count; i++) {
            // this.entry.mod[i].
        }

        // 의존성 설정
        this.entry._resolver.resolve();

        // 소스 배치
        this.batch.add(this.entry.src, 'dist');

        // 저장
        this.batch.save();

    }

    // entry 오토 로드
    _load() {
        console.log('_load()....');
        // 현재 폴더의 auto.js 파일 로딩
        let entryFile  = this.__dir + '/auto.js'
        // 다양한 조건에 예외조건을 수용해야함
        const EntryAuto = require(entryFile);
        // 타입 검사해야함
        this.entry = new EntryAuto();
    }


}

module.exports = AutoTask;
