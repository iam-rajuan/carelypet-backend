/* eslint-disable no-console */
const autocannon = require("autocannon");

const baseUrl = process.env.LOADTEST_BASE_URL || "http://localhost:3000";
const token = process.env.LOADTEST_AUTH_TOKEN || "";
const duration = Number(process.env.LOADTEST_DURATION || 20);
const connections = Number(process.env.LOADTEST_CONNECTIONS || 40);

const runScenario = (name, path, headers = {}) =>
  new Promise((resolve, reject) => {
    console.log(`\n=== ${name} ===`);
    const instance = autocannon(
      {
        url: `${baseUrl}${path}`,
        method: "GET",
        connections,
        duration,
        headers,
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          name,
          requests: result.requests.average,
          latency: result.latency,
          throughput: result.throughput.average,
          non2xx: result.non2xx,
          errors: result.errors,
        });
      }
    );

    autocannon.track(instance, { renderProgressBar: true, renderResultsTable: false });
  });

const printSummary = (results) => {
  console.log("\n=== Summary ===");
  results.forEach((item) => {
    const p50 = item.latency.p50 || 0;
    const p95 = item.latency.p95 || 0;
    const p99 = item.latency.p99 || 0;
    console.log(
      `${item.name}: req/s=${Math.round(item.requests)}, p50=${p50}ms, p95=${p95}ms, p99=${p99}ms, throughput=${Math.round(
        item.throughput
      )}B/s, errors=${item.errors}, non2xx=${item.non2xx}`
    );
  });
};

const main = async () => {
  const scenarios = [{ name: "Health", path: "/api/v1/health" }];

  if (token) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    scenarios.push(
      { name: "Community Feed", path: "/api/v1/community/posts?page=1&limit=10", headers: authHeaders },
      { name: "Pet Pals", path: "/api/v1/users/pet-pals?page=1&limit=20", headers: authHeaders },
      { name: "Conversations", path: "/api/v1/messages/conversations", headers: authHeaders }
    );
  } else {
    console.log(
      "LOADTEST_AUTH_TOKEN not set. Running public health check only. Set token to benchmark protected endpoints."
    );
  }

  const results = [];
  for (const scenario of scenarios) {
    const result = await runScenario(scenario.name, scenario.path, scenario.headers || {});
    results.push(result);
  }

  printSummary(results);
};

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Load test failed:", message);
  process.exit(1);
});
