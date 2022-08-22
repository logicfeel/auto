
class AutoTask {

    // private
    __dir = null;
    // protected
    _instance = null;
    // public
    entry = null;

    constructor() {
    }

    static getInstance(dir) {
        if (typeof this._instance === 'undefined') {
            this._instance = new AutoTask();
        }
        this._instance.__dir = dir;

        return this._instance;
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

    do_dist() {
        // 로딩
        this._load();

        // src, out 읽기
        this.entry.readSource();
    }
}

module.exports = AutoTask;
