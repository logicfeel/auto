
class Automation {
    constructor() {
        // 파일의 해석대상과 참조대상 지정
        // !! 해석대상은 바이너리 파일은 자동 제외된다.
        this.resolve = {
            absolute: false, // 절대경로를 사용하지 않는다.
            relative: false, // 상대경로를 사용하지 않는다.
        }

        // 참조 1
        this.refer = {
            target: {
                file: '*.*',
                except: ['abc.c', /^ab.c$/ig],     // 대상 제외 : 파일명, 정규식
            },
            resolve: {
                files: [],
                absolute: false,
                relative: false,
                include: [],    // 강제 포함 조건
                except: [], // 해석(해석) 제외
                // 기본은 모든 파일을 대상으로 하므로, 우선순위 : include > except 
                glob: '*.*', // Glob 또는 정규식으로 조회한다.
            },
        }
        
        // 참조 2 : 대상/해결 구분 기준
        this.refer = {
            target: {   // 대상
                include: [],    // 포함
                except: [],     // 제외
            },
            resolve: {  // 해결
                include: ['*.*'],   // 포함
                except: [],         // 제외
            },
            absolute: false,    // 기본: true
            relative: false,    // 기본: true
        };

        // 참조 3 : 해결자 기준
        this.resolve = [
            {
                file: '*.c',
                target: ['*.jpg', '*.png']
            },
            {
                file: '*.htm',
                target: ['*.jpg', '*.png'],
                absolute: false,
            },
        ];

        // 참조 4 : 대상/해결 구분 기준 + 콜백
        this.link = {
            target: {   // 대상
                include: [],    // 포함
                except: [],     // 제외
            },
            resolve: {  // 해결
                include: [],   // 포함, *.* 는 무시된다.
                except: [],         // 제외
            },
            absolute: false,    // 기본: true
            relative: false,    // 기본: true
            /**
             * 해결할 파일별 반복호출됨
             * @param {string} file 해결할 파일명 
             * @param {array} refs 참조할 전체 파일 목록
             */
            map: (file, refs) => {
                /**
                 * - 리턴이 false 이면, 파일을 제외 시킨다.
                 * - 리턴이 undefined 이면, 무시한다.
                 * - 리턴이 true 이면 해석에 포함시킨다.
                 * - if 조건으로 대상을 걸러내거나 제외시킨다.
                 * - 전체모
                 */
                return false;
            }
        };
    }
}