// doc SECURITY.md Stress Testing / doc 38: real k6 script targeting the
// specific numeric NFRs from doc 05 (feed load p95, message delivery).
// Not executed in this sandbox — no k6 binary available here. Run with:
//   k6 run --env BASE_URL=https://staging.edina.ua --env TOKEN=... infra/scripts/stress-feed.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const feedLatency = new Trend('edina_feed_latency', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.TOKEN || '';

export const options = {
  scenarios: {
    // doc 43 Scalability Plan: ramp toward "the next order of magnitude,"
    // not an arbitrary huge number — this profile is sized to validate
    // headroom for realistic near-term growth, not a hypothetical
    // millions-of-users spike doc 43 explicitly says not to over-build for.
    ramping_feed_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    // doc 05 NFR-PERF-3: message delivery p95 <= 300ms — this script
    // checks feed load, the closest read-path analog with a defined
    // target; a companion WebSocket-based script would exercise message
    // delivery specifically (not built in this pass — flagged, not
    // silently assumed covered).
    edina_feed_latency: ['p(95)<500'],
    http_req_failed: ['rate<0.01'], // doc 05: <1% error rate under load
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/feed/following?limit=20`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  feedLatency.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has items array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).items);
      } catch {
        return false;
      }
    },
  });

  sleep(1); // doc: paced to approximate real user think-time between feed refreshes, not a tight request-flood loop
}
