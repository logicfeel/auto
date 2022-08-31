
// 배치 관리자
class SourceBatch {

    // protected
    _instance = null;
    // private
    __list = [];
    __storage = []; // 저장 위치

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
    add(collection, location) {
        
        // TODO:: 타입 검사

        for(let i = 0; i < collection.count; i++) {
            this.__list.push(
                {
                    src: collection[i],
                    location: location,
                    savePath: null,
                    content: null,
                }
            );
        }
    }

    save() {
        
        let autoDir, saveDir, auto, src, useAuto, alias;

        for (let i = 0; i < this.__list.length; i++) {
            
            if (this.__list[i].location == 'dist') {
                // TODO::
                // 엔트리의 경우
                // 하위의 경우 : autoDir + dist + 사용처 + 별칭
                /**
                 * 소스의 auto 경롤르 기준으로 /dist 에 위치 지정
                 */
                auto = this.__list[i].src._auto;
                src = this.__list[i].src;
                autoDir = auto.__dir;
                useAuto = auto._owner !== null ? auto._owner._package.name : '';
                // alias = src.
                saveDir = autoDir +'/dist'
            }
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
}


module.exports = SourceBatch;