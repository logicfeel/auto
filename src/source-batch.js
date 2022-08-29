
// 배치 관리자
class SourceBatch {

    // protected
    _instance = null;
    // private
    __list = [];

    constructor() {
    }

    static getInstance() {
        if (typeof this._instance === 'undefined') {
            this._instance = new this();
        }
        return this._instance;
    }

    /**
     * 배치할 소스 추가
     * @param {*} src SourceCollection 
     */
    add(collection) {
        
        // TODO:: 타입 검사

        for(let i = 0; i < collection.count; i++) {
            this.__list.push(collection[i].src);
        }
        
    }

    clear() {}
}


module.exports = SourceBatch;