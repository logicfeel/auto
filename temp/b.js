// b.js
console.log('b.js 시작');
const a = require('./a');
// const {A} = require('./a');



// function call() {
//     console.log('b.js의 call에서의 a: ', a);
// }

class B {
    constructor() {
        console.log('b.js의 call에서의 a: ', a.A);
        // console.log('b.js의 call에서의 a: ', A);
    }
}
// exports.call = call;
exports.B = B;
// module.exports = {
//     B: B
// }
// exports = call;


// exports.call = () => {
//   console.log('b.js의 call에서의 a: ', a);
// };


// module.exports = {
//     call: () => {
//       console.log('b.js의 call에서의 a: ', a);
//     }
//   };

// module.exports = {
//     call: call
//   };