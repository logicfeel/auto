
// const b = require('./b').call;
// const a = require('./a').call;


const b = require('./b');
const a = require('./a');

// a.call();
// b.call();
// let aa = new a.call();
// let bb = new b.call();

let aa = new a();
let bb = new b();

console.log(1)