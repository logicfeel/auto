// const { Automation } = require('../m3-1/auto');
let Mod3 = require('../m3-1/auto');

class Auto extends Mod3 {
    
    // dir = __dirname;

    constructor() {
        super();


        this.dir = __dirname;
        this.a = 'b'


    }
}
// exports.Automation = Auto;
module.exports = Auto;
