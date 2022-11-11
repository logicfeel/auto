const fs = require('fs');
const path = require('path');
const { SourceBatch } = require('./source-batch');

/**
 * 오토태스크 클래스
 */
class AutoTask {
    // public
    entry = null;
    batch = null;
    cursor = '';
    FILE = {     // location
        RELATION: '__Relation.json',
    };
    // batch = a.SourceBatch.getInstance();
    // protected
    static _instance = null;
    // private
    #dir = null;

    constructor() {
        this.batch = SourceBatch.getInstance();
        this.batch._task = this;
    }

    static create(dir) {
        if (typeof dir !== 'string' || dir.length === 0) {
            throw new Error(' start [dir] request fail...');
        }
        this._instance = new this();
        this._instance.#dir = dir;
        return this._instance;
    }
    
    static getInstance() {
        if (this._instance === null) {
            throw new Error(' 태스크가 생성되지 않았습니다. [dir] request fail...');
        }
        return this._instance;
    }

    /**
     * 상속한 모듈을 복제한다.
     */
    do_clone() {

    }

    /**
     * 엔트리 오토만 재배치 한다.
     * 파일 변경 감시수 자동 업데이트에 활용함
     */
    do_update() {
        this.cursor = 'UPDATE';
    }
    
    /**
     * 강제로 전체를 오토를 dist 한다.
     */
    do_dist() {
        this.cursor = 'DIST';
        
        // 로딩
        this._load();

        // 대상 오토 조회
        let list = this.entry._getAllList(true);

        for (let i = 0; i < list.length; i++) {
            list[i].readSource(true, false);
        }

        // 의존성 로딩 및 설정
        for (let i = 0; i < list.length; i++) {
            list[i].resolver.read();
            list[i].resolver.resolve();
            this.batch.addCollection(list[i].src, this.entry.LOC.DIS, true);
        }

        // 저장
        this.batch.pathType = 2;     // 기본절대경로
        this.batch.save();
    }

    /**
     * 제외 모듈 : 엔트리모듈, sub모듈, super모듈(상위포함)
     * 처리 모듈 : 제외 모듈의 포함이 안되면서, /dist 폴더가 없는 경우
     */
    do_depend() { 
        this.cursor = 'DEPEND';

        // 로딩
        this._load();

        /**
         * TODO:: 대상 오토의 1차 의존성의 구조까지 로딩해야함
         * 확인필요 !!
         */
        let all = this.entry._getAllList();    // 엔트리는 제외
        let dep = this.entry._getDependList();

        /**
         * - 구조만 불러와도 배치는 할 수 있다.
         */

        // 이부분은 정의 역활을 한다.
        for (let i = 0; i < all.length; i++) {
            all[i].readSource(true, false);
        }

        // 의존성 로딩 및 설정
        for (let i = 0; i < all.length; i++) {
            all[i].resolver.read();
            all[i].resolver.resolve();
            
            // 기타 모듈
            if (dep.indexOf(all[i]) < 0) {
                this.batch.addCollection(all[i].src, this.entry.LOC.DIS);
            
            // 의존성 모듈
            } else {
                this.batch.addCollection(all[i].src, this.entry.LOC.DEP);
            }
        }
        // 저장
        // this.batch.isRoot = true;        // 절대경로시 entry 폴더 기준
        this.batch.pathType = 1;      // 기본상대경로
        // this.batch.pathType = 2;         // 기본절대경로
        this.batch.save();            
    }

    do_install() {
        this.cursor = 'INSTALL';
        // 로딩
        this._load();

        // 대상 오토 조회
        let list = this.entry._getAllList(true);

        for (let i = 0; i < list.length; i++) {
            list[i].readSource(true, true);
        }

        // 의존성 로딩 및 설정
        for (let i = 0; i < list.length; i++) {
            list[i].resolver.read();
            list[i].resolver.resolve();
            this.batch.addCollection(list[i].src, this.entry.LOC.INS);
            this.batch.addCollection(list[i].out, this.entry.LOC.INS);
            this.batch.addCollection(list[i].vir, this.entry.LOC.INS);
        }

        // 저장
        this.batch.isRoot = false;       // 절대경로시 'install' 폴더
        // this.batch.pathType = 1;      // 전체절대경로
        // this.batch.pathType = 2;         // 기본절대경로
        this.batch.save();
    }

    do_relation() {
        this.cursor = 'RELATION';
        // 로딩
        this._load();

        // 대상 오토 조회
        let list = this.entry._getAllList(true);

        for (let i = 0; i < list.length; i++) {
            list[i].readSource(true, true);
        }

        this.entry.isSaveRelation = true;
        // 의존성 로딩 및 설정
        for (let i = 0; i < list.length; i++) {
            list[i].resolver.read();
            list[i].resolver.resolve();
        }
    }

    do_cover(auto = this.entry) {
        this.cursor = 'RELATION';
        // 로딩
        this._load();

        auto.readSource(true, true);``
        auto.writeParentObject();
    }

    do_reset() {
        
        let dir, entry, delPath;

        this.cursor = 'RESET';
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
        let entryFile  = this.#dir + '/auto.js'
        // 다양한 조건에 예외조건을 수용해야함
        const EntryAuto = require(entryFile);
        // 타입 검사해야함
        this.entry = new EntryAuto();
        
        this.batch._batchFile = this.entry._file;        
    }
}

exports.AutoTask = AutoTask;