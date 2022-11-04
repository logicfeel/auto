
// const autoTask = require('../../src/auto-task').getInstance(__dirname);

let AutoTask = require('../../src/auto-task').AutoTask;
// let autoTask = AutoTask.getInstance(__dirname);
let autoTask = AutoTask.create(__dirname);

let e = autoTask.entry;
let t = autoTask;

// let a = autoTask.entry;   // 별칭
// let task = AutoTask.getInstance();
// console.log(autoTask.do_depend)

// t.batch.isAlias = true;
// t.batch.dupType = 2;

autoTask.do_reset();
autoTask.do_install();


    // e.resolver._list
    // e.resolver.getPattern('src/inc/left.css')
    // e.resolver.getPattern('src/m1.html')
    // e.resolver.getPattern('out/com.css')
    // e.resolver.getPattern('out/area/top.css')

    // t.batch.validPath('/Users/logic/PJ-Git/auto#v02/task/m1/install/mod1/bar.css')
// var d  = t.batch.newSubPath(t.batch._list[0]);
console.log(1)