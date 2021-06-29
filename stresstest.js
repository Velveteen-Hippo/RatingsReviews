import http from 'k6/http';
import {sleep, check} from 'k6';

///GET/reviews
export default function () {
  var res = http.get('http://localhost:3000/reviews');
  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => {
      r.timings.duration < 2000
    }
  });
  sleep(1)
}

///GET/reviews/meta
export default function () {
  var res = http.get('http://localhost:3000/reviews/meta');
  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => {
      r.timings.duration < 2000
    }
  });
  sleep(1)
}

// export default function () {
//   var res = http.get('http://localhost:3000/reviews');
//   check(res, {
//     'is status 200': (r) => r.stratus === 200,
//     'response time < 2000ms': (r) => {
//       r.timings.duration < 2000
//     }
//   });
//   sleep(1)
// }

// export default function() {
//   res = http.get('http://localhost:3000/api/timing')
//   check(res, {
//     'is status 200': (r) => r.status === 200,
//     'response time < 2000ms': (r) => {
//       r.timings.duration < 2000
//     }
//   })
//   sleep(1);
// }