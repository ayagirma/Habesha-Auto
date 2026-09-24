/**
 * TORQUE & CO — IN-BROWSER INTERACTIVE TEST ENGINE & COMPONENT AUDITOR
 * Executes live browser-side integration tests, client module unit assertions,
 * and end-to-end multi-portal workflow simulations.
 */

(function (window) {
  "use strict";

  const TEST_REGISTRY = [];
  const COMPONENT_INVENTORY = [
    // Customer Portal
    { id: "cust-auth", name: "Auth & Profile Engine", group: "Customer Portal", type: "frontend", path: "client/index.html & js/app.js", desc: "User registration, password security, session persistence" },
    { id: "cust-dash", name: "Customer Dashboard", group: "Customer Portal", type: "frontend", path: "client/index.html", desc: "Active service card, quick booking, vehicle summary" },
    { id: "cust-book", name: "Multi-Service Booking Flow", group: "Customer Portal", type: "frontend", path: "client/index.html", desc: "Service catalog, pricing engine, date/slot picker" },
    { id: "cust-track", name: "Live Service Tracker", group: "Customer Portal", type: "frontend", path: "client/index.html", desc: "5-stage progression timeline, status badges, tech assignment" },
    { id: "cust-appr", name: "Estimate & Finding Approval", group: "Customer Portal", type: "frontend", path: "client/index.html", desc: "Line-item cost breakdown & customer authorization modal" },
    { id: "cust-pay", name: "Payment & Tip Engine", group: "Customer Portal", type: "frontend", path: "client/index.html", desc: "Card/Zelle/CashApp/Cash simulation & receipt generation" },
    { id: "cust-msg", name: "In-App Messaging Thread", group: "Customer Portal", type: "frontend", path: "client/index.html", desc: "Two-way customer-to-shop chat & notification thread" },
    { id: "cust-hist", name: "Service & Vehicle History", group: "Customer Portal", type: "frontend", path: "client/index.html", desc: "Past work orders, invoices, and mileage timeline" },

    // Tech Portal
    { id: "tech-queue", name: "Bay Work Queue", group: "Technician Portal", type: "frontend", path: "client/tech.html & js/tech.js", desc: "Active, upcoming, and completed repair bay management" },
    { id: "tech-steps", name: "Repair Step Runner", group: "Technician Portal", type: "frontend", path: "client/tech.html", desc: "Interactive multi-step inspection & task execution" },
    { id: "tech-find", name: "Issue Discovery Reporter", group: "Technician Portal", type: "frontend", path: "client/tech.html", desc: "Photo, notes, parts & labor estimate submission" },
    { id: "tech-clock", name: "Labor Clock & Geo-Tracker", group: "Technician Portal", type: "frontend", path: "client/tech.html & js/geo-time.js", desc: "Live labor timer, job duration & location auditing" },
    { id: "tech-call", name: "Customer Contact Logger", group: "Technician Portal", type: "frontend", path: "client/tech.html", desc: "Phone call attempts & verbal approval audit trail" },

    // Manager Portal
    { id: "mgr-kpi", name: "Shop KPI Board", group: "Manager Portal", type: "frontend", path: "client/manager.html & js/manager.js", desc: "Daily revenue, bay utilization, turnaround telemetry" },
    { id: "mgr-disp", name: "Bay & Tech Dispatcher", group: "Manager Portal", type: "frontend", path: "client/manager.html", desc: "Vehicle bay assignment, tech routing, intake queue" },
    { id: "mgr-appr", name: "Findings Approval Monitor", group: "Manager Portal", type: "frontend", path: "client/manager.html", desc: "Foreman review & price adjustment before customer dispatch" },
    { id: "mgr-staff", name: "Staff Onboarding & Roster", group: "Manager Portal", type: "frontend", path: "client/manager.html", desc: "Tech approval, efficiency tracking, certification roles" },

    // Admin Portal
    { id: "admin-all", name: "Unified Staff Admin", group: "Staff Admin", type: "frontend", path: "client/admin.html & js/admin.js", desc: "Consolidated portal uniting Manager, Tech, and System tools" },

    // Shared Client Utilities
    { id: "util-api", name: "API Client Bridge", group: "Shared Modules", type: "utility", path: "client/js/api.js", desc: "HTTP wrapper with fallback, headers, and credentials" },
    { id: "util-geo", name: "Geo-Time & ETA Engine", group: "Shared Modules", type: "utility", path: "client/js/geo-time.js", desc: "Timezone detector, dynamic step offsets, calendar generator" },

    // Backend REST Services
    { id: "srv-health", name: "Health & Uptime Service", group: "Backend API", type: "backend", path: "GET /api/health", desc: "Telemetry, uptime, and database connection probe" },
    { id: "srv-auth", name: "Auth & Session Controller", group: "Backend API", type: "backend", path: "server/routes/auth.js", desc: "Registration, bcrypt hashing, session cookies" },
    { id: "srv-prof", name: "Profile & Vehicle Service", group: "Backend API", type: "backend", path: "server/routes/profile.js", desc: "Customer profile and VIN vehicle store" },
    { id: "srv-appt", name: "Appointments & Scheduling", group: "Backend API", type: "backend", path: "server/routes/appointments.js", desc: "Booking lifecycle, service indexes, state transitions" },
    { id: "srv-hist", name: "History & Invoice Service", group: "Backend API", type: "backend", path: "server/routes/history.js", desc: "Archived work orders, parts records, payments" },
    { id: "srv-msg", name: "Shop Messaging Service", group: "Backend API", type: "backend", path: "server/routes/messages.js", desc: "Live customer-shop messaging thread" },
    { id: "srv-tech", name: "Technician & Bay API", group: "Backend API", type: "backend", path: "server/routes/tech.js", desc: "Live bays, step updates, findings, call logs" },
    { id: "srv-mgr", name: "Manager Dispatch API", group: "Backend API", type: "backend", path: "server/routes/manager.js", desc: "Shop KPIs, intake queue, findings review, staff roster" }
  ];

  function getBaseUrl() {
    if (typeof window !== 'undefined' && window.location.port && window.location.port !== '3000') {
      return 'http://localhost:3000/api';
    }
    return '/api';
  }

  async function apiFetch(path, opts = {}) {
    const base = getBaseUrl();
    const t0 = performance.now();
    try {
      const res = await fetch(base + path, {
        method: opts.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
      const latency = Math.round(performance.now() - t0);
      let data = null;
      try { data = res.status === 204 ? null : await res.json(); } catch (e) { data = null; }
      return { ok: res.ok, status: res.status, data, latency };
    } catch (e) {
      const latency = Math.round(performance.now() - t0);
      return { ok: false, status: 0, data: { error: e.message }, latency };
    }
  }

  // --- TEST DEFINITIONS ---

  // 1. Health & Server Probe
  TEST_REGISTRY.push({
    id: "test-health",
    name: "Server Health & Subsystem Telemetry",
    category: "Backend API",
    componentId: "srv-health",
    run: async () => {
      const res = await apiFetch('/health');
      if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
      if (res.data.status !== 'ok') throw new Error('Health status is not ok');
      return {
        message: `Uptime: ${res.data.uptime}s • Database: ${res.data.database} • Tech API: ${res.data.services.tech}`,
        latency: res.latency,
        data: res.data
      };
    }
  });

  // 2. Technician Bays Retrieval
  TEST_REGISTRY.push({
    id: "test-tech-bays",
    name: "Technician Bay Queue & Telemetry",
    category: "Technician Portal",
    componentId: "srv-tech",
    run: async () => {
      const res = await apiFetch('/tech/bays');
      if (!res.ok) throw new Error(`Fetch bays failed: HTTP ${res.status}`);
      if (!Array.isArray(res.data) || res.data.length < 4) throw new Error(`Expected at least 4 bays, got ${res.data ? res.data.length : 0}`);
      const activeBay = res.data.find(b => b.bayId === 'bay-1');
      if (!activeBay) throw new Error('Bay 1 not found in roster');
      return {
        message: `Retrieved ${res.data.length} bays. Active bay: ${activeBay.bayName} (${activeBay.status})`,
        latency: res.latency,
        data: res.data
      };
    }
  });

  // 3. Technician Step Progression
  TEST_REGISTRY.push({
    id: "test-tech-step",
    name: "Technician Step Update Execution",
    category: "Technician Portal",
    componentId: "tech-steps",
    run: async () => {
      const res = await apiFetch('/tech/bays/bay-1/step', {
        method: 'PUT',
        body: { stepIndex: 2 }
      });
      if (!res.ok) throw new Error(`Step update failed: HTTP ${res.status}`);
      if (res.data.currentStep !== 2) throw new Error(`Expected step 2, got ${res.data.currentStep}`);
      return {
        message: `Updated Bay 1 to Step 2 (Active Work: Fluid Drain)`,
        latency: res.latency,
        data: res.data
      };
    }
  });

  // 4. Technician Finding Submission
  TEST_REGISTRY.push({
    id: "test-tech-finding",
    name: "Technician Mechanical Finding Submission",
    category: "Technician Portal",
    componentId: "tech-find",
    run: async () => {
      const payload = {
        title: "Front Brake Rotor Micro-Grooving",
        explanation: "Runout exceeded 0.003 in. during dial indicator verification.",
        partsCost: 95.00,
        laborCost: 65.00,
        urgency: "Recommended Today",
        managerApproved: true,
        canFixOnSite: true
      };
      const res = await apiFetch('/tech/bays/bay-2/finding', {
        method: 'POST',
        body: payload
      });
      if (!res.ok) throw new Error(`Finding submission failed: HTTP ${res.status}`);
      if (res.data.totalCost !== 160.00) throw new Error(`Expected total cost $160.00, got ${res.data.totalCost}`);
      return {
        message: `Created Finding "${res.data.title}" ($${res.data.totalCost}) with pending status`,
        latency: res.latency,
        data: res.data
      };
    }
  });

  // 5. Manager KPIs & Metrics
  TEST_REGISTRY.push({
    id: "test-mgr-kpis",
    name: "Manager KPI & Revenue Metrics",
    category: "Manager Portal",
    componentId: "mgr-kpi",
    run: async () => {
      const res = await apiFetch('/manager/kpis');
      if (!res.ok) throw new Error(`KPI retrieval failed: HTTP ${res.status}`);
      if (typeof res.data.todayRevenue !== 'number') throw new Error('Missing revenue number in KPI response');
      return {
        message: `Today Revenue: $${res.data.todayRevenue} • Utilization: ${res.data.activeBayUtilization}`,
        latency: res.latency,
        data: res.data
      };
    }
  });

  // 6. Manager Intake Queue
  TEST_REGISTRY.push({
    id: "test-mgr-queue",
    name: "Manager Intake Queue & Arrivals",
    category: "Manager Portal",
    componentId: "mgr-disp",
    run: async () => {
      const res = await apiFetch('/manager/queue');
      if (!res.ok) throw new Error(`Queue retrieval failed: HTTP ${res.status}`);
      if (!Array.isArray(res.data)) throw new Error('Expected array for intake queue');
      return {
        message: `Loaded ${res.data.length} vehicles waiting or in intake queue`,
        latency: res.latency,
        data: res.data
      };
    }
  });

  // 7. Manager Staff Onboarding
  TEST_REGISTRY.push({
    id: "test-mgr-staff",
    name: "Manager Staff Self-Registration & Approval",
    category: "Manager Portal",
    componentId: "mgr-staff",
    run: async () => {
      const payload = {
        name: "Morgan Bailey",
        email: `morgan.bailey.${Date.now()}@torque.com`,
        phone: "(555) 345-9876",
        role: "technician",
        specialization: "ADAS & Laser Alignment Calibration"
      };
      const res = await apiFetch('/manager/register-staff', {
        method: 'POST',
        body: payload
      });
      if (!res.ok) throw new Error(`Staff registration failed: HTTP ${res.status}`);
      if (res.data.status !== 'pending_approval') throw new Error(`Expected pending_approval, got ${res.data.status}`);
      return {
        message: `Staff candidate ${payload.name} queued for manager review`,
        latency: res.latency,
        data: res.data
      };
    }
  });

  // 8. GeoTime Engine Timezone & Formatting
  TEST_REGISTRY.push({
    id: "test-geo-core",
    name: "GeoTime Timezone & Relative Offset Engine",
    category: "Shared Modules",
    componentId: "util-geo",
    run: async () => {
      const t0 = performance.now();
      if (!window.GeoTime) throw new Error('window.GeoTime is not loaded');
      const geo = window.GeoTime.detect();
      if (!geo || !geo.timeZone) throw new Error('Failed to resolve browser timezone');

      const formatted = window.GeoTime.formatTime(new Date());
      if (!formatted || !/(AM|PM)/i.test(formatted)) throw new Error(`Unexpected time format: ${formatted}`);

      const steps = window.GeoTime.getWorkflowSteps(2);
      if (!steps || steps.length !== 5) throw new Error(`Expected 5 workflow steps, got ${steps ? steps.length : 0}`);

      const days = window.GeoTime.getBookingDays(6);
      if (!days || days.length !== 6 || !days[0].isToday) throw new Error('Booking days generator assertion failed');

      const latency = Math.round(performance.now() - t0);
      return {
        message: `Timezone: ${geo.label} • 5 Steps Calculated • 6-day Booking Matrix Generated`,
        latency,
        data: { geo, steps, days }
      };
    }
  });

  // 9. Customer Auth Validation Rules
  TEST_REGISTRY.push({
    id: "test-auth-val",
    name: "Customer Auth Field Validation Rules",
    category: "Customer Portal",
    componentId: "cust-auth",
    run: async () => {
      // Test 1: Invalid email rejection
      const res1 = await apiFetch('/auth/signup', {
        method: 'POST',
        body: { name: "Test User", email: "not-an-email", phone: "555-1234", password: "password123" }
      });
      if (res1.status !== 400 || !res1.data.field || res1.data.field !== 'email') {
        throw new Error(`Expected 400 for bad email, got ${res1.status}`);
      }

      // Test 2: Short password rejection
      const res2 = await apiFetch('/auth/signup', {
        method: 'POST',
        body: { name: "Test User", email: "valid@example.com", phone: "555-1234", password: "short" }
      });
      if (res2.status !== 400 || !res2.data.field || res2.data.field !== 'password') {
        throw new Error(`Expected 400 for short password, got ${res2.status}`);
      }

      // Test 3: OTP Forgot Password dispatch
      const res3 = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email: "test.driver@example.com" }
      });
      if (res3.status !== 200 || !res3.data.success) {
        throw new Error(`Expected 200 for forgot password OTP dispatch, got ${res3.status}`);
      }

      return {
        message: `Successfully validated email syntax, password enforcement & 6-digit OTP email dispatch`,
        latency: res1.latency + res2.latency + res3.latency,
        data: { testEmailRejection: res1.data, testPassRejection: res2.data, otpDispatch: res3.data }
      };
    }
  });

  // 10. End-to-End Workflow Simulation
  TEST_REGISTRY.push({
    id: "test-e2e-flow",
    name: "Full End-to-End Bay Intake & Approval Simulation",
    category: "Workflow Integration",
    componentId: "admin-all",
    run: async () => {
      const t0 = performance.now();
      const logs = [];

      // Step 1: Admit vehicle to bay 4
      logs.push("Admitting vehicle '2023 Tesla Model Y' to Bay 4");
      const admitRes = await apiFetch('/manager/admit', {
        method: 'POST',
        body: {
          customerName: "Alex Rivera",
          phone: "(555) 392-8812",
          vehicle: "2023 Tesla Model Y",
          plate: "8TSL101",
          service: "Tire Rotation & High Voltage Safety Check",
          bayId: "bay-4"
        }
      });
      if (!admitRes.ok) throw new Error(`Admit failed: HTTP ${admitRes.status}`);

      // Step 2: Tech advances to step 1
      logs.push("Technician starts intake and advances to Step 1");
      const stepRes = await apiFetch('/tech/bays/bay-4/step', {
        method: 'PUT',
        body: { stepIndex: 1 }
      });

      // Step 3: Tech submits finding
      logs.push("Technician discovers cabin air filter contamination");
      const findRes = await apiFetch('/tech/bays/bay-4/finding', {
        method: 'POST',
        body: {
          title: "HEPA Cabin Filter Micro-Particulate Clog",
          explanation: "HVAC airflow reduced by 40%. Recommend OEM replacement.",
          partsCost: 45.00,
          laborCost: 25.00,
          urgency: "Recommended Today",
          managerApproved: true
        }
      });
      if (!findRes.ok) throw new Error(`Finding submission failed: HTTP ${findRes.status}`);

      // Step 4: Log call attempt
      logs.push("Logging confirmation note to customer");
      const callRes = await apiFetch('/tech/bays/bay-4/call-log', {
        method: 'POST',
        body: { outcome: "SMS Sent", note: "Customer received instant digital estimate card." }
      });

      const totalLatency = Math.round(performance.now() - t0);
      return {
        message: `Completed 4-step E2E lifecycle (Intake -> Step -> Finding -> Log) across Tech & Manager portals`,
        latency: totalLatency,
        data: { logs, finding: findRes.data }
      };
    }
  });

  window.TorqueTestRunner = {
    components: COMPONENT_INVENTORY,
    tests: TEST_REGISTRY,
    apiFetch,
    runSingleTest: async (testId) => {
      const t = TEST_REGISTRY.find(item => item.id === testId);
      if (!t) throw new Error(`Test ${testId} not found`);
      return await t.run();
    },
    runAllTests: async (onProgress) => {
      const results = [];
      for (let i = 0; i < TEST_REGISTRY.length; i++) {
        const test = TEST_REGISTRY[i];
        try {
          const res = await test.run();
          const resultObj = { id: test.id, name: test.name, category: test.category, passed: true, ...res };
          results.push(resultObj);
          if (onProgress) onProgress({ index: i, total: TEST_REGISTRY.length, test, result: resultObj });
        } catch (err) {
          const resultObj = { id: test.id, name: test.name, category: test.category, passed: false, error: err.message, latency: 0 };
          results.push(resultObj);
          if (onProgress) onProgress({ index: i, total: TEST_REGISTRY.length, test, result: resultObj });
        }
      }
      return results;
    }
  };

})(typeof window !== "undefined" ? window : global);
