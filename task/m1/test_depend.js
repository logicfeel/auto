
// const autoTask = require('../../src/auto-task').getInstance(__dirname);

let AutoTask = require('../../src/auto-task').AutoTask;
// let {AutoTask} = require('../../src/auto-task');
let autoTask = AutoTask.create(__dirname);

// let a = autoTask.entry;   // 별칭
// let task = AutoTask.getInstance();
// console.log(autoTask.do_depend)
let e = autoTask.entry;


// autoTask.do_reset();
autoTask.do_depend();

console.log(1)