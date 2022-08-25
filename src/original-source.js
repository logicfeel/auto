
const fs = require('fs');
const path = require('path');
const { MetaElement, PropertyCollection, MetaObject } = require('entitybind');

class OriginalSource {
    
    // protected
    _auto = null;
    _ref = [];
    // public
    content = null;
    fullPath = '';
    basePath = '';

    constructor(onwer, fullPath) {
        // 필수 검사 필요!!
        this._auto = onwer;
        this.fullPath = fullPath;
        // TODO:: win, unix 방식 경로 설정가능하게!!
        this.basePath = '/'+ path.relative(this._auto.__dir, this.fullPath);
    }
}

class SourceCollection extends PropertyCollection {
    
    constructor(onwer) {
        super(onwer);
    }


    /**
     * Path 정보를 통해서 컬렉션을 등록한다.
     * @param {*} path 
     * @param {*} isSub 
     * @param {*} opt 
     */
    addPath(path, isSub = true, opt) {

        const _this = this;

        // 내부 함수
        function _addPath(path, dir = '') {

            let arr;
            let org;
    
            arr = fs.readdirSync(path);
    
            for (let i = 0; i < arr.length; i++) {
                
                // REVIEW:: 비동기 성능이슈 있음
                
                // 대상 파일의 필터  TODO::
                if (fs.statSync(path +'/'+ arr[i]).isFile()) {
                    // 컬렉션에 등록
                    org = new OriginalSource(_this._onwer, path +'/'+ arr[i]);
                    _this.add(dir + arr[i], org);
                } else if (isSub && fs.statSync(path +'/'+arr[i]).isDirectory()) {
                    _addPath(path + '/' + arr[i], arr[i] + '/', dir);
                }
            }
        }
        
        _addPath(path);
    }

    fillSource() {
        
        let filePath;
        
        for (let i = 0; i < this.list.length; i++) {
            filePath = this.list[i].fullPath;
            this.list[i].content = fs.readFileSync(filePath,'utf-8');
        }        
    }
}


module.exports = { OriginalSource, SourceCollection };