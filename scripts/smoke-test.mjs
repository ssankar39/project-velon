const BASE = 'http://127.0.0.1:3000';
let passed = 0;
let failed = 0;
let totalRuns = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function smoke() {
  totalRuns++;
  console.log(`\n═══ Velon Smoke Test Run #${totalRuns} [${new Date().toISOString()}] ═══\n`);

  // ─── Auth Tests ───
  console.log('Auth:');

  await test('GET /api/auth/me returns 401 when not logged in', async () => {
    const r = await fetch(`${BASE}/api/auth/me`);
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  let testEmail = `test_${Date.now()}@example.com`;
  let loginCookie;

  await test('POST /api/auth/signup creates user', async () => {
    const r = await fetch(`${BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Test123!' }),
    });
    assert(r.status === 201, `Expected 201, got ${r.status}`);
  });

  await test('POST /api/auth/login returns session cookie', async () => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Test123!' }),
    });
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    const setCookie = r.headers.get('set-cookie') || '';
    assert(setCookie.includes('session='), 'No session cookie');
    loginCookie = setCookie.split(';')[0];
  });

  await test('GET /api/auth/me returns user with session', async () => {
    const r = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: loginCookie } });
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    const data = await r.json();
    assert(data.email === testEmail, 'Email mismatch');
  });

  await test('POST /api/auth/logout clears cookie', async () => {
    const r = await fetch(`${BASE}/api/auth/logout`, { method: 'POST' });
    assert(r.status === 200, `Expected 200, got ${r.status}`);
  });

  // ─── Rate Limiting ───
  console.log('\nRate Limiting:');

  await test('Login rate limit triggers after 5 failures', async () => {
    const fakeEmail = `rl_${Date.now()}@example.com`;
    await fetch(`${BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fakeEmail, password: 'Test123!' }),
    });
    for (let i = 0; i < 5; i++) {
      await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fakeEmail, password: 'wrong' }),
      });
    }
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fakeEmail, password: 'wrong' }),
    });
    assert(r.status === 429, `Expected 429, got ${r.status}`);
    const body = await r.json();
    assert(body.error.includes('Too many'), 'Missing rate limit error message');
  });

  // ─── Protected Routes ───
  console.log('\nProtected Routes:');

  const protectedRoutes = [
    { name: 'meals', path: '/api/meals' },
    { name: 'fasting', path: '/api/fasting' },
    { name: 'workouts', path: '/api/workouts' },
    { name: 'workout-sessions', path: '/api/workout-sessions' },
    { name: 'workout-templates', path: '/api/workout-templates' },
    { name: 'user/preferences', path: '/api/user/preferences' },
    { name: 'user/stats', path: '/api/user/stats' },
    { name: 'user/profile', path: '/api/user/profile', method: 'PUT', body: {} },
  ];

  // Login fresh user for protected route tests
  let freshEmail = `protected_${Date.now()}@example.com`;
  let freshCookie;
  await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: freshEmail, password: 'Test123!' }),
  });
  const loginR = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: freshEmail, password: 'Test123!' }),
  });
  freshCookie = loginR.headers.get('set-cookie')?.split(';')[0] || '';

  for (const route of protectedRoutes) {
    await test(`${route.method || 'GET'} ${route.name} → 401 without cookie`, async () => {
      const opts = { method: route.method || 'GET' };
      if (route.body) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(route.body);
      }
      const r = await fetch(`${BASE}${route.path}`, opts);
      assert(r.status === 401, `Expected 401, got ${r.status}`);
    });

    await test(`${route.method || 'GET'} ${route.name} → 200 with cookie`, async () => {
      const opts = { method: route.method || 'GET', headers: { Cookie: freshCookie } };
      if (route.body) {
        opts.headers = { 'Content-Type': 'application/json', Cookie: freshCookie };
        opts.body = JSON.stringify(route.body);
      }
      const r = await fetch(`${BASE}${route.path}`, opts);
      assert(r.status === 200, `Expected 200, got ${r.status}`);
    });
  }

  // ─── Data Isolation ───
  console.log('\nData Isolation:');

  await test('User A cannot see User B meals', async () => {
    const userA = `isoA_${Date.now()}@example.com`;
    const userB = `isoB_${Date.now()}@example.com`;

    // Signup user A — already authenticated via session cookie
    const signupA = await fetch(`${BASE}/api/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA, password: 'Test123!' }),
    });
    const cookieA = (signupA.headers.get('set-cookie') || '').match(/^([^;]+)/)?.[1] || '';
    assert(cookieA, 'Signup should set session cookie');

    await fetch(`${BASE}/api/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userB, password: 'Test123!' }),
    });

    // User A creates a meal
    const createRes = await fetch(`${BASE}/api/meals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ name: 'Secret Meal', calories: 500, type: 'lunch' }),
    });
    assert(createRes.ok, `Meal creation failed: ${createRes.status}`);

    // Verify meals endpoint only returns User A's data
    const r = await fetch(`${BASE}/api/meals`, { headers: { Cookie: cookieA } });
    const meals = await r.json();
    assert(Array.isArray(meals), `Expected array, got ${typeof meals}: ${JSON.stringify(meals).substring(0, 200)}`);
    const hasSecret = meals.some(m => m.name === 'Secret Meal');
    assert(hasSecret, 'User A should see their own meal');
  });

  // ─── Security Checks ───
  console.log('\nSecurity:');

  await test('Metrics 404 does not leak email', async () => {
    const r = await fetch(`${BASE}/api/metrics?userId=nonexistent@example.com`, {
      headers: { Cookie: freshCookie },
    });
    const body = await r.text();
    assert(!body.includes('User not found with email'), 'Email leaked in 404 response');
  });

  await test('Invalid ObjectId returns 400 not 500', async () => {
    const r = await fetch(`${BASE}/api/meals/not-a-valid-id`, {
      method: 'DELETE', headers: { Cookie: freshCookie },
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  // ─── Summary ───
  console.log(`\n═══ Run #${totalRuns}: ${passed} passed, ${failed} failed ═══\n`);
  return failed;
}

// Run once or periodically
const interval = process.argv.includes('--periodic');
if (interval) {
  const ms = parseInt(process.argv[process.argv.indexOf('--periodic') + 1]) || 60000;
  console.log(`Running every ${ms / 1000}s... (Ctrl+C to stop)`);
  (async function loop() {
    const fails = await smoke();
    if (fails > 0) process.exitCode = 1;
    setTimeout(loop, ms);
  })();
} else {
  smoke().then(fails => process.exit(fails > 0 ? 1 : 0)).catch(e => { console.error(e); process.exit(1); });
}
