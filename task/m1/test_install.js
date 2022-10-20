
// const autoTask = require('../../src/auto-task').getInstance(__dirname);

let AutoTask = require('../../src/auto-task').AutoTask;
// let autoTask = AutoTask.getInstance(__dirname);
let autoTask = AutoTask.create(__dirname);

// let a = autoTask.entry;   // 별칭
// let task = AutoTask.getInstance();
// console.log(autoTask.do_depend)

autoTask.do_install();
// autoTask.do_reset();

let e = autoTask.entry;

console.log(1)