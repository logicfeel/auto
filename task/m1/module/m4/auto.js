const {Automation} = require('../../../../src/automation');


class Auto extends Automation {
    constructor() {
        super();

        this.dir = __dirname;
        this.isStatic = true;
    }
}

module.exports = Auto;
// exports.Automation = Auto;
