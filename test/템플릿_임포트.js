class TempA {
    constructor() {
        
        // 긱체로 지정하는 방식
        this.export = {};                       // 출력 방식
        this.part['aaa/bbb'].export = true;     // 속성으로 설정
    }
    
    export(key) {
        // part, data, helper 구성
        // this.compile(대상소스);
        return function(key) {
            let template = this.compile(/** key 대상파일, 내용 */);
            let page  = template(this.data);            
            return page;
        }
    }
}


class TempB {
    constructor() {
        this.import(object);
    }
    import(obj) {
        // obj 의 템플릿 유무 검사후
        // for obj 조회해서 함수 형태로 가져옴
        this['별칭.상위패치명'] = function() {/** 상위 functionc 삽입됨 */};
    }
}