// b.js
console.log('b.js 시작');
// const a = require('./a').call;
const a = require('./a');



// function call() {
//     console.log('b.js의 call에서의 a: ', a);
// }

class call {
    constructor() {
        console.log('b.js의 call에서의 a: ', a);
    }
}
// exports.call = call;
exports = call;


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