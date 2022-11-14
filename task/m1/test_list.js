
// const autoTask = require('../../src/auto-task').getInstance(__dirname);
let AutoTask = require('../../src/auto-task').AutoTask;
// let autoTask = AutoTask.getInstance(__dirname);
let autoTask = AutoTask.create(__dirname);

let t = autoTask;

t.batch.pathType = 2;

autoTask.do_list(0);  // 전체
// autoTask.do_map(1); // 요약 맵 (*default)
// autoTask.do_map(2); // 세부 맵
// autoTask.do_map(3); // 의존 맵
let e = autoTask.entry;

// let arr = e._getDependList(false);
// let arr = e._getSuperList(false);

console.log(1)