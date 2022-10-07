
class A {
    a = 1;
    aaa = 100;

    map = [];
    constructor() {    
        console.log(0)
    }

    getDirname() {
        return 'A__dirname';
    }

    setDirname(dir) {
        this.map.push(dir);
    }
}

class B extends A {
    a = 2;
    aa = 10;

    constructor() {
        super()
        this.setDirname('b');
        // this.map.push('b');
    }
    
    getDirname() {
        return 'B__dirname';
    }
}

class C extends B {
    constructor() {
        super()
        this.setDirname(__dirname);
        // this.map.push('c');        
    }
}


let c = new C();

console.log(c.map)

console.log(1)