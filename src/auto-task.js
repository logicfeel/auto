
class AutoTask {

    _instance = null;
    __dirname = __dirname;
    
    entry = null;

    constructor() {
    }

    static getInstance(dirname) {
        if (typeof this._instance === 'undefined') {
            this._instance = new AutoTask();
        }
        this._instance.__dirname = dirname;

        return this._instance;
    }

    _load() {
        console.log('_load()....');
        // 현재 폴더의 auto.js 파일 로딩
        let entryFile  = this.__dirname + '/auto.js'
        // 다양한 조건에 예외조건을 수용해야함
        const EntryAuto = require(entryFile);
        // 타입 검사해야함
        this.entry = new EntryAuto();
    }

    do_dist() {
        // 로딩
        this._load();
    }
}

module.exports = AutoTask;
