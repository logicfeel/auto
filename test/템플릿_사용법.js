// 템플릿 사용법 정의

/**
 * 외부의 템플릿을 가져와는 경우가 가장 이슈가 많은
 */

// 두개이상의 외부 템플릿을 가져오는 경우

var t1 = require('Temp1');

class AutoTemp extends AutoTemplate {
    constructor() {

        /**
         * 차이점 
         *  - import() : 이름과 참조위치를 가르킴, this = t1
         *  - add() : 해당 위치에 기록함, this = this
         */
        // help.part.data 충독 검사후 가져옴
        this.import(t1);    
        
        // t1의 scope 를 현재로 변경함 => 필요성이 있을지 검토!!
        this.import(t1, this);
        
        // 접두사를 사용해서 가져옴 : 이름 충독방지 
        this.import(t1, 'web');

        // 부분(data) 가져오기 
        this.import(t1.part, 'web');

        // 조각 가져오기 : head
        this.part.add(t1.part['head']);

        // 조각 가져오기 : head (경로재정의)
        this.part.add(t1.part['head'], 'aaa/bbb');

        // 조각 덮어쓰기
        this.part['aaa/bbb'] = t1.part['head']; // 타입 검사함
        this.part['aaa/bbb'] = '{{data.view}} ... 내용';

        // 출판 소스를 동적으로 추가하는 경우
        this.src.add('content.asp', '{{part.view}}.. 내용');
        
        // 자동 출판파일을 설정함
        this.src.add('content.asp', this.part['layout/aaa']);

        // 다른방법 : 조각파일의 속성설정으로 노출하는 방법
        this.part['layout/aaa'].isSrc = true;
        this.part['layout/aaa'].isCompile = true;

        // 전체 출판
        // src 위치에 자동 생성함   => Reset 시점에 대한 검토 필요
        // src폴더에 두고 >auto 명령으로 처리되됨
        this.src.compile(this);

        // 부분 출판
        this.src['content.asp'].compile();

        // local 스코프 설정
        this.part['layout/aaa'].partial('aaa/bbb', '{{data.aaa}}');     // 지정명으로
        this.part['layout/aaa'].partial('aaa/bbb', t1.part['aaa/bbb']); // 지정명으로
        this.part['layout/aaa'].partial(t1.part['aaa/bbb']);            // 동일 이름으로 

        this.src['aaa/bbb'].partial(/* part와 동일한 방식으로 추가 */);

    }
}