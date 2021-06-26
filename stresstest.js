import http from 'k6/http';
import {sleep, check} from 'k6';

export default function() {
  res = http.get('http://localhost:3000/api/timing')
  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => {
      r.timings.duration < 2000
    }
  })
  sleep(1);
}