// a.js
console.log('a.js 시작');

// const b = require('./b').call;
const b = require('./b');
// const {B} = require('./b');

// class A {
//     constructor(){
//         console.log('a.js의 call에서의 b: ', b);
//     }
// }

// function call() {
//     console.log('a.js의 call에서의 b: ', b);
// }
class A {
    constructor() {
        console.log('a.js의 call에서의 b: ', b.B);
        // console.log('a.js의 call에서의 b: ', B);
    }
}
exports.A = A;

// exports = call;

// exports.call = () => {
//   console.log('a.js의 call에서의 b: ', b);
// };

// module.exports = {
//     call: call
//   };