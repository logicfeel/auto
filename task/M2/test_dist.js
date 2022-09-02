
// const autoTask = require('../../src/auto-task').getInstance(__dirname);

let AutoTask = require('../../src/auto-task');
let autoTask = AutoTask.getInstance(__dirname);

// let task = AutoTask.getInstance();
console.log(autoTask.do_depend)

autoTask.do_dist();

console.log(1)