
// const autoTask = require('../../src/auto-task').getInstance(__dirname);

let AutoTask = require('../../src/auto-task');
let autoTask = AutoTask.getInstance(__dirname);

// let a = autoTask.entry;   // 별칭
// let task = AutoTask.getInstance();
// console.log(autoTask.do_depend)

autoTask.do_install();
// autoTask.do_reset();

console.log(1)