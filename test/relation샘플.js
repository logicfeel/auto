const fs = require('fs');

/**
 * 요구사항
 *  - 객체파일은 직관적인 구조를 가져야 한다. 가독성 높게
 *  - 세부적인 구조 OR 단순명료한 구조
 *      + 명료한 구조는 숫자의 사용을 최소화 해야 한다.
 *  - 로딩후 사용하기 편리해야 한다.
 */

/**
 * 문제점
 *  - 경로를 키로 사용하면 한글같은 경우에 문제가 발생할 수 있다.
 *      => 어짜피 경로를 기준으로 키로 사용한다.
 * line 이 들어가는게 더욱 직관적일듯....
 * 예비명단 : idx, line, key, type
 */
 var relationJson = {
    'src/abc.html': {
        'depend': {
            'src/refer.css': [{ idx: 1, line: 10, key: '..src/refer.css' }, { idx: 5, line: 20, key: '/src/refer.css' }],
            'src/refer2-1.css': [{
                idx: 24,
                line: 20, 
                key: '..src/refer.css'
            }],
            'src/refer4.css': null,
        }
    },
    'src/abc2.html': {
        'depend': {
            'src/refer.css': [{ idx: 1, line: 10, key: '..src/refer.css' }, { idx: 5, line: 20, key: '/src/refer.css' }],
            'src/refer2-1.css': [{
                idx: 24,
                line: 20, 
                key: '..src/refer.css'
            }],
            'src/refer4.css': null,
        }
    }
}

// var relationJson = {
//     'src/abc.html': {
//         'dep': {
//             'src/refer.css': {
//                 line: 10, 
//                 key: '..src/refer.css'
//             },
//             'src/refer.css': {
//                 line: 20, 
//                 key: '..src/refer.css'
//             },
//         }
//     }
// }

// var relationJson = {
//     'src/abc.html': {
//         'dep': {
//             '..src/refer.css': 'src/refer.css',
//             '..src/refer.css': 'src/refer.css',
//         }
//     }
// }

// var relationJson = {
//     'src/abc.html': {
//         'dep': {
//             'src/refer.css': { 
//                 10: { type: 1, line:10, key: 'sss' },
//                 12: { type: 1, line:10, key: 'sss' },
//             }
//         }
//     }

// }

var kk = {"a":1, "국어":2}

let data = JSON.stringify(relationJson, null, '\t');
fs.writeFileSync(__dirname +'/relation.json', data, 'utf8'); 


// let arr = ['ss','sss', 'ssss'];
// let data2 = JSON.stringify(arr, null, '\t');
// fs.writeFileSync(__dirname +'/test.json', data2, 'utf8'); 


console.log('0')