const Automation = require('../src/automation');


class Auto extends Automation {
    constructor() {
        super(__dirname);

        this.a = 'a'
    }
}

module.exports = Auto;
