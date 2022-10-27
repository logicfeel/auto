
// const autoTask = require('../../src/auto-task').getInstance(__dirname);

let AutoTask = require('../../src/auto-task').AutoTask;
// let {AutoTask} = require('../../src/auto-task');
let autoTask = AutoTask.create(__dirname);

// let a = autoTask.entry;   // 별칭
// let task = AutoTask.getInstance();
// console.log(autoTask.do_depend)

autoTask.do_dist();
// autoTask.do_reset();


let e = autoTask.entry;

// autoTask.do_reset();
// console.log(autoTask.batch.getBatchList());

console.log(1)