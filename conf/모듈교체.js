/**
 * 컴포넌트를 생성해서 오토에 지정하면
 */
 class AutoChange extends Automation {
    constructor() {
        // 기본 오토 추가
        this.mod.add('view1', require('view2'));
        // sub 로 오토 추가
        this.mod.sub('view1', require('view2'));
        // super 로 오토 추가
        this.mod.super('view1', require('view2'));
        // 즉시 삽입 : 이름은 자동으로 매칭
        this.mod.add(require('view2'));
        

        // 네임스페이스 지정
        this.namespace = 'logic.component.mssql';
        this.name = 'asp_View'
        // 사용시 : mssql 이름공간의 오토를 찾아낸다.
        var c = this.ns.logic.component.mssql;
        // 사용시 : component 이름공간 하위의 오토를 찾아낸다.
        var c = this.ns.logic.component;

        // 교체 방법 1 : 셀렉터 교칙 이용
        // view 자식중 db
        this.change('view1 > db', require('new_db'));
        // view 자손중 db
        this.change('view1 db', require('new_db'));
        // db 형제중 db2
        this.change('db ~ db2', require('new_db'));
        // npm 명이 npm_name
        this.change('#npm_name', require('new_db'));
        // 메소드명 교체
        this.replace('view1 > db', require('new_db'));
        /**
         * 조건
         *  - Automation 의 자식이어야 한다.
         *  - 교체 대상에 인터페이스가 구현하였으면 동일한 구현을 해야 한다.
         *  - sup/super 로 연결된 경우 대상을 상속한 자식만 가능하다.
         *  - mod 로 연결된 경우는 가능하다.
         *  - auto map 을 통헤서 auto-map.json 파일을 참조하여 교체
         */
    }
}