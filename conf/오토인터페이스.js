/**
 * 오토 인터페이스 참조
 */

/**
 * ICrudl 인터페이스
 */
 class ICrudl {
    constructor() {
        /** @type String */
        this.url = "";
    }
}
// 인터페이스 구현
class Auto_A extends Automation {
    constructor() {
        
        this.url = "www...";

        this._implements(ICrudl);
    }
}
class Auto_B extends Automation {
    constructor() {
        
        this.url = "WWW...";

        this._implements(ICrudl);
    }
}
// 인터페이스 사용
class Auto_C extends Automation {
    constructor() {
        this.MOD = new Auto_A();
        // 인터페이스 참조 부분 선언
        if (!this.auto.isImplementOf(ICrudl)) {
            this.refURL = this.MOD.url;
        }
    }
}
// 인터페이스 사용 교체 
class AutoMain extends Automation {
    constructor(){
        this.SUB = Auto_C.getInstance();
        // 인스턴스 하위 교체(내부적으로 인터페이스를 검사한다.)
        this.SUB.MOD = new Auto_B();
    }
}