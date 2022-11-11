
// const autoTask = require('../../src/auto-task').getInstance(__dirname);

let AutoTask = require('../../src/auto-task').AutoTask;
// let autoTask = AutoTask.getInstance(__dirname);
let autoTask = AutoTask.create(__dirname);

let t = autoTask;
// let a = autoTask.entry;   // 별칭
// let task = AutoTask.getInstance();
// console.log(autoTask.do_depend)

// t.batch.isAlias = true;
// t.batch.dupType = 2;

// 특수한 경우 테스트
autoTask._load();
autoTask.do_cover(autoTask.entry.mod[1]);

let e = autoTask.entry;

console.log(1)