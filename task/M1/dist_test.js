
const autoTask = require('../../src/auto-task').getInstance(__dirname);

// let task = AutoTask.getInstance();

autoTask.do_dist();

var text = `
@import url("../../out/area/top.css");

p {
    font-family: verdana;
    font-size: 20px;
    background-color: rgb(176, 230, 173);
}

/*
    url("../../out/area/top.css");

    /Users/kimneo/PJ-Git/auto/task/m1/out/area/top.css

    /Users/kimneo/PJ-Git/auto/task/m1/src/inc/left.css

*/
`;

// var r = _searchPath("../../out/area/top.css", text);

// var rst

// rst = r.exec(text)

// console.log(r.lastIndex)

// rst = r.exec(text)

// console.log(r.lastIndex)

// rst = r.exec(text)

// console.log(r.lastIndex)

console.log(1)