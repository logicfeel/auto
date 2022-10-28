
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
let t = autoTask;
    // e.resolver._list
    // e.resolver.getPattern('src/inc/left.css')
    // e.resolver.getPattern('src/m1.html')
    // e.resolver.getPattern('out/com.css')
    // e.resolver.getPattern('out/area/top.css')


console.log(1)