
/**
 * 소스 의존성을 객체 구조를 샘플로 구성해본다.
 * - 상위 개념의 설계를 가져야 한다.
 *  + 파일에 대한 의존성
 *  +   
 * - 의존의 종류
 *  + 모듈간의 의존성
 *      * 모듈 vs 모듈 : super(상위포함), sub
 */


var mod1 = {
    out: {
        "com.css": 
        { 
            path: "out/com.css", cnt: ""
        },
        "top.css": 
        { 
            path: "out/top.css", cnt: "import 'com.css' ",
            ref: [
                { idx: 8, length:7, target: null }
            ]
        },
    },
    src: {
        "left.css": 
        { 
            path: "src/left.css", cnt: "import 'top.css' ",
            ref: [
                { idx: 8, length:7, target: null }
            ]
        },
        "m1.html": 
        { 
            path: "src/m1.html", cnt: " href='left.css' ", 
            ref: [
                { idx: 8, length:7, target: null }
            ]
        },
    },
};
mod1.resolver = {
    ref: [
        mod1.out["com.css"],
        mod1.out["top.css"],
        mod1.src["left.css"],
        mod1.src["m1.html"],
    ]
}
mod1.out["top.css"].ref[0].target = mod1.out["com.css"];
mod1.src["left.css"].ref[0].target = mod1.out["top.css"];
mod1.src["m1.html"].ref[0].target = mod1.src["left.css"];



/**
 *  - 전체 오토를 생성후 적재한다. : 로딩
 *      + dep 는 참조 연결한다.
 *  - 모듈별 소스 로딩
 *      + src, out 파일 정보를 가져온다 
 *  - 모듈별 의존성 처리
 *      + 참조목록을 구성한다 (ref)
 *      + 원시소스별로 분석힌다.
 *          * 참조객체 구성 => 필요시 객체로 별도 저장(성능)
 *      + 원시소스를 배치한다.
 *          * 배치파일구조를 구성한다. 
 *          * 배치파일내용을 등록한다.
 *          * 배치객체를 저장한다.
 *  - 파일 구조를 가져온다. : src, out, dep
 *  - 의존 정보를 얻는다.
 *  - 
 */


console.log(1)