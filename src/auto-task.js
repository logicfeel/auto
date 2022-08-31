const SourceBatch = require('./source-batch');
const path = require('path');

class AutoTask {

    // public
    entry = null;
    batch = SourceBatch.getInstance();
    // protected
    _instance = null;
    // private
    __dir = null;


    constructor() {
    }

    // 내부에 사용
    static getInstance(dir) {
        if (typeof this._instance === 'undefined') {
            this._instance = new this();
        }
        this._instance.__dir = dir;
        return this._instance;
    }

    
    do_dist() {
        // 로딩
        this._load();

        // src, out 읽기
        this.entry.readSource(true);

        // 의존성 설정
        this.entry._resolver.resolve();

        // 소스 배치
        this.batch.add(this.entry.src, 'dist');

        // 저장
        this.batch.save();

    }

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
