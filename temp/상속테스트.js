
class A {
    a = 1;
    aaa = 100;
    constructor(p) {    
        console.log(p)
    }

    getDirname() {
        return 'A__dirname';
    }
}

class B extends A {
    a = 2;
    aa = 10;

    constructor(p) {
        super(['b'].concat(p))
    }
    
    getDirname() {
        return 'B__dirname';
    }
}

class C extends B {
    constructor(p) {
        super(['c'].concat(p))
    }
}


// let b = new B();
let c = new C();


console.log(1)