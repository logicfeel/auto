
class Automation {
    
    // private
    _dir = null;
    // protected
    _install = null;
    _resolve = null;
    _auto = null;

    constructor(dir) {
        console.log('Automation load..')

        this._dir = dir;

        // *.json 로딩
        let installPath;
        let resolvePath;
        let autoPath;

        installPath = this._dir + '/install.json';
        resolvePath = this._dir + '/resolve.json';
        autoPath = this._dir + '/auto.json';

        // 파일검사 !!
        this._install = require(installPath);
    }
}


module.exports = Automation;