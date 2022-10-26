
/**
 * 인스톨의 주요 기능
 * - 외부 가져오기/내보내기 : 하위 모듈에서 : 필요없는기능일 듯
 * - isStatic 에 따른 파일 변경 조건 검사
 * - 콜백을 통한 사용자화 기능
 * - 중복제거 : 옵션을 통한 제어
 * - 파일병합 : 순서대로
 * - 파일이름 변경, 경로 변경
 * - 배치 제외
 * - install.json 을 통한 설정 분리
 * - 특정 대상에 대한 상대/절대경로 설정
 * - 
 * 
 * 참조 & 설계 메모
 * - glob 패턴 활용
 * 
 * 추가요구사항
 * - 상대,절대 이외에 검색문자열의 추가 : NonTextFile.pos
 */
// 순처적 처리가 되어야 한다.
installMap = [
    {
        rename: {
            glob: 'd',
            path: ''
        },
        rename: {
            glob: 's',
            dir: ''
        },
        merge: {
            glob: '',
            path: ''
        },
        except: {
            glob: ''
        },
    }
];

installMap = {
    chage: [
        {
            rename: {
                glob: '',
                path: ''
            }
        },

    ]
};

// 기능별 순서를 정하는 경우
installMap = {
    merge: [    // order 1 : 중요도가 높음
        {
            glob: '',
            path: ''
        },
    ],
    rename: [   // order 2
        {
            glob: '',   // glob 에서 복수 선택시 오류!!
            path: ''
        },
        {
            glob: '',
            dir: ''
        },
    ],
    except: [   // order 3 : 중요도 낮음 (필수요소가 아님)
        '**/*.jpg', 
        { 
            glob: '' 
        },
    ],
    setup: [    // order 0
        {
            glob: '',
            isStatic: true,

        }
    ]
};