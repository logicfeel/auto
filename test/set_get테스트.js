

class SetGet {
    
    aaa = null
    ccc = null
    ddd = null
    fff = null

    set aa(val) {
        this.aaa = val; 
    }
    bb = {
        _this: this,
        set cc(val) {
            // this.ccc = val;
            this._this.ccc = val;
        },
        set cc(val) {
            // this.ccc = val;
            this._this.ccc = val;
        },
        cc : {
            _this: this,
            set ff(val) {
            this._this.fff = val;
            }
        }

        
        // cc: {
        //     set dd(val) {
        //         this.ddd = val;
        //     }
        // }
    }


    constructor() {
        
    }
}

var s = new SetGet();

s.aa = 10
// s.bb.cc = 20
s.bb.cc.ff = 40
// s.bb.ee = 30    // 덮어써버림


console.log(1)