
// 해결자..
class DependResolver {
    
    // protectd
    _auto = null;
    _list = [];

    constructor(owner) {
        this._auto = owner;

        for (let i = 0; i < this._auto.src.count; i++) {
            this._list.push(this._auto.src[i]);
        }
        for (let i = 0; i < this._auto.out.count; i++) {
            this._list.push(this._auto.out[i]);
        }
        
        for (let i = 0; i < this._auto.dep.count; i++) {
            
            for (let ii = 0; ii < this._auto.dep[i].src.count; ii++) {
                this._list.push(this._auto.src[ii]);
            }   
        }
    }
}

module.exports = DependResolver;