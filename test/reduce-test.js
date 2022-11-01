



let array = [{"A": 1, "B":1}, {"A": 1, "B":2}, {"A": 3, "B":3}, {"A": 4, "B":2}, {"A": 1, "B":3},]


let initialValue = 0;

// array.reduce( function(total, currentValue, currentIndex, arr) {
//     console.log(1)
// }, initialValue );


// array.map(function(currentValue, currentIndex, arr) {
//     console.log(1)
// })


// initialValue = array.filter( (v, i, a) => {
//     return i === array.indexOf(v);
// });


// function findDuplicates(arr) {
//     const distinct = new Set(arr);        // 성능 향상을 위해
//     const filtered = arr.filter(item => {
//         // 맨 처음 만날 때 집합에서 요소를 제거합니다.
//         if (distinct.A === item.A) {
//         // if (distinct.has(item)) {
//             distinct.delete(item);
//         }
//         // 후속 만남에서 요소를 반환합니다.
//         else {
//             return item;
//         }
//     });
 
//     return [...new Set(filtered)]
// }
// const duplicates = findDuplicates(array);
// function getMap(arr){
//     var resultMap = {};
//     for ( var i in arr) {
//         if (!(arr[i] in resultMap)) resultMap[arr[i]] = [];
//         resultMap[arr[i]].push(arr[i])
//     }
//     return resultMap;
// }

// let r = getMap(array);


// let arr = [
//     {seq:1,name:"kim1"}
//     ,{seq:2,name:"kim2"}
//     ,{seq:3,name:"kim3"}
//     ,{seq:4,name:"kim4"}
//     ,{seq:5,name:"kim5"}
// ]

// let arr1 =[
//     ,{seq:2,name:"Lee2"}
//     ,{seq:3,name:"Lee3"}
//     ,{seq:6,name:"Lee6"}
// ]

// let arr2 = arr.filter(x1 => arr1.some(x2 => x1.seq == x2.seq ));

// console.log(arr2)
 
// let r = array.filter(x1 => array.some(x2 => x1.A == x2.A ));

// let r = array.filter(x1 => {
//     return array.some((x2, i, arr) => {
//         return x1 !== arr[i] && x1.A == x2.A
//     })
//     // return rr;
// });

let rtn = [];

array.forEach( (c, i, a) => {
    if (array.some((cc, ii, aa) => {
        return i !== ii && c.A == cc.A && !rtn.find(ccc => {
            // let rrr = 
            return ccc.A === c.A;
        })
    })) rtn.push(c);
    // console.log(1)
})

// let kkk = rtn.find(ccc => {
//     let rrr = ccc.A === c.A
//     return rrr;
// })



console.log(0)