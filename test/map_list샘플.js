
var map = {
    name: 'npm명',
    alias: '별칭',

};

/**
 * list 를 mod, super, sub 로 분리하는 방식
 *  - 문제점 : top 를 표현하는데 문제가 있음, ref : 는 참조하는 static 을 가르키게함
 *  - top 이 맨 위쪽에 있는게 아님, => 큰문제가 아닐듯
 *  - 설치된 파일이 어느 위치인지 확인할 수 있는가?
 *  - 중복명칭이 발생하는 경우
 *      + super 로 사용하고, 재사용하는 경우
 *      + static 으로 사용하는 경우
 *  - list VS mod, super, sub
 */

// mod, super, sub 분리방식
// 일관적인 방식을 위해서(통일) 이방식은 패스..
var mapDetail = {
    name: 'NPM명',
    static: true,   // 정적 모듈
    interface: [
        'Interface' // 클래스명
    ],
    file: [
        'src/aaa.c',
        'out/bbb.c',
    ],
    super: [
        {
            name: 'NPM명',
        }
    ],
    sub: [
        {
            name: 'NPM명',
        }
    ],
    mod: [
        {
            name: 'NPM명',
            alias: '별칭',
            static: true,       // static 으로 참조하는 경우
            refer: 'NPM명',
        }
    ],

};

// mod, super, sub 분리방식
/**
 * out 포함됨
 */
var mapDetail = {
    name: 'NPM명',
    static: true,   // 정적 모듈
    interface: [    // #Detail
        'Interface' // 클래스명
    ],
    file: [         // -detail 옵션
        'src/aaa.c',
        'out/bbb.c',
    ],

    module: [
        {
            name: 'NPM명',
            comment: '시스템을 가져오는 모듈임',
            super: true,
            file: [         // #Detail
                'src/aaa.c',
                'out/bbb.c',
            ],
        },
        {
            name: 'NPM명',
            sub: true,
        },
        {
            name: 'NPM명',
            alias: '별칭',
            static: true,       // static 으로 참조하는 경우
            refer: 'NPM명',
        }
    ],
};

/**
 * 대상과 의존성의 관점
 *  - out 제외됨, sub 1단계 까지만, super 는 상위 표현함
 */
var mapDepend = {
    name: 'NPM명',
    static: true,   // 정적 모듈
    interface: [
        'Interface' // 클래스명
    ],
    file: [
        'src/aaa.c',
        'out/bbb.c',
    ],

    depend: [
        {
            name: 'NPM명',
            comment: '시스템을 가져오는 모듈임',
            super: true,
        },
        {
            name: 'NPM명',
            sub: true,
        },
        
    ],
    module: [
        {
            name: 'NPM명',
            alias: '별칭',
            static: true,       // static 으로 참조하는 경우
            refer: 'NPM명',
        }
    ]
};

/**
 * 전체 모둘의 정보
 * 목록에는 별칭이 없음, 이력정보 혹인 가능
 */
var list = [
    {
        name: 'Npm명',
        static: true,
        location: ['mod[별칭].mod[별칭]'],  // 복수일수 있음 static
        file: [
            {
                'src/aaa.c': {
                    static: true,
                    comment: '저장파일임',
                    history: [          // -histry 옵션
                        {
                            name: '모듈명1',
                            batch: 'include/bbb.c'
                        },
                        {
                            name: '모듈명2',
                            batch: 'include/ccc.c'
                        },
                    ],
                'out/kkk.c': {}
                }
            }
        ]
    }
];
