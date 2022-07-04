
var FAQ_Object = {
    table: {
        master: {
            name: 'BOD_FAQ',
            columns: {
                faq_idx: {},
                qustion: {},
                answer: {},
                rank_it: {},
                del_yn: {},
                create_dt: {}
            },
            _onAdd: (col) => { 
                sp.create.params.add(col); 
            }
            /**
             *  - 컬럼의 특성에 따라서 추가 이벤트를 발생한다.
             *  - 스키마의 성격을 가진다.
             *  - 어떤 컬럼을 추가하는지에 따라서 컬럼이 확장한다.
             *  - entity 설계 방식에 걸러내는 방식 참조
             */
        }
    },
    view: {
        list: {
            columns: {
                row_total: {},
                create_dt: {},
                question: {},
                answer: {},
                raink_it: {},
            }
        },
        inner: {
            msgSave_yn: { /** 직접입력 */ },
            msgPrint_yn: { /** 직접입력 */},
        }
    },
    sp: {
        create: {
            params: {
                qustion: {},
                answer: {},
                rank_it: {},
                msgSave_yn: { /** 내부 */ },
                msgPrint_yn: { /** 내부 */},                
            }
        },
        read: {
            params: {
                faq_idx: { /** PK */},
                xml_yn: { /** 출력이 있는경우 */},
                msgSave_yn: { /** 내부 */ },
                msgPrint_yn: { /** 내부 */},
            },
            output: [
                {
                    columns: {
                        /** 전체의 표현 */
                        faq_idx: {},
                        qustion: {},
                        answer: {},
                        rank_it: {},
                        del_yn: {},
                        create_dt: {}
                    }
                }
            ]
        },
        update: {
            params: {
                faq_idx: { /** PK */},
                qustion: {},
                answer: {},
                rank_it: {},
                msgSave_yn: { /** 내부 */ },
                msgPrint_yn: { /** 내부 */},
            },
        },
        delete: {
            params: {
                faq_idx: { /** PK */},
                msgSave_yn: { /** 내부 */ },
                msgPrint_yn: { /** 내부 */},
            }
        },
        list: {
            params: {
                keyword: {},
                page_size: {},
                page_count: {},
                sort_cd: {},
                row_total: { output: 1 },
                xml_yn: { /** 출력이 있는경우 */},
                msgSave_yn: { /** 직접입력 */ },
                msgPrint_yn: { /** 직접입력 */},
            },
        },
        /** 확장 예시 */
        create_main: {
            params: {
                /** 합집합이 구성되어야 함 */
            },
            call: [
                {
                    type: 'sp',
                    name: 'create'
                },
            ],
            return: { name: 'meb_idx' } /** 필요성은 확인필요 !! */
        }
    },
    group: {
        access: { /** 이용: Cls 전체 프로시저 접근 */
            sp: [
                {
                    type: 'sp',
                    name: 'create'
                },
                {
                    type: 'sp',
                    name: 'read'
                },
                {
                    type: 'sp',
                    name: 'update'
                },
                {
                    type: 'sp',
                    name: 'delete'
                },
                {
                    type: 'sp',
                    name: 'list'
                },
            ]
        },
        admin_C: { /** 이용: Admin C, Admin svc */
            sp: [
                {
                    type: 'sp',
                    name: 'create'
                },
                {
                    type: 'sp',
                    name: 'read'
                },
                {
                    type: 'sp',
                    name: 'update'
                },
                {
                    type: 'sp',
                    name: 'delete'
                },
                {
                    type: 'sp',
                    name: 'list'
                },
            ]
        },
        front_C: { /** 이용: Front C, Front svc */
            sp: [
                {
                    type: 'sp',
                    name: 'list'
                },
                {
                    type: 'sp',
                    name: 'list'
                },
            ]
        },
    }
};



/**
 * 메타 스키마 최상위
 */
 class MetaSchema {
    constructor() {

    }
}

/**
 * 1. 템플릿에 대한 스키마를 지정한다.
 */
// 구현방식 1
class schema extends MetaSchema {
    constructor() {
        super();
        // 구조 정의
        this.table.add('master', isExtend);
        this.view.add('inner', isExtend);
        this.sp.add('create', isExtend);
        this.sp.add('read', isExtend);

        // 내부 컬럼 등록
        this.view['inner'].column.add({ name: 'xml_yn', type: 'boolean', rank_it: 99 });
        this.view['inner'].column.add({ name: 'msgSave_yn', type: 'char', rank_it: 99 });
        // 내부 컬럼 등록 (참조)
        this.sp['read'].column.add(this.view['inner'].columns['xml_yn']);
        this.sp['read'].column.add(this.view['inner'].columns['msgSave_yn']);

        // 이벤트
        this.table['master']._onAdd = (col) => {
            this.sp['create'].params.add(col);  // 참조형식으로 등록
        };
    }
}
// 구현방식 2
class schema extends MetaSchema {
    constructor() {
        super();
        // 구조 정의
        this.model = {
            table: {
                master: { 
                    onAdd: (col) => {
                        this.sp['create'].params.add(col);  // 참조형식으로 등록
                    }
                }
            },
            view: {
                inner: {
                    columns: {
                        xml_yn: { type: 'boolean', rank_it: 99 },
                        msgSave_yn: { type: 'char', rank_it: 99 }
                    }
                }
            },
            sp: {
                create: {},
                read: {
                    params: ['view.inner.columns.xml_yn', 'view.inner.columns.msgSave_yn']
                }
            }
        };
    }
}

/**
 * 2. 스키마에 대한 템플릿 작성 : *.hbs
 * 상속여부??
 */
class MetaTemplate {
    constructor() {
        // 메타에 대한 스키마 지정
        this.shcema = SchemaCRUDL;  
        // 메타모델을 지정한다.
        this.meta = null;
        // 출판할 파일 설정
        // .....
    }
}

/**
 * 3. 메타모델을 작성한다.
 *  상속여부??
 */
class MetaModel {
    constructor() {
        // 메타 스키마 주입
        this.setSchema(new SchemaCRUDL());
        // 기본 컬럼 추가
        this.table['master'].column.add({ name: 'title' })

    }
    setSchema(s) {}
    static getObject() {}
}

/**
 * 템플릿을 출판한다.
 */
// 즉시 출판
var mt = MetaTemplate();
mt.compile(MetaModel.getObject());

// 템플릿 교체 방법



