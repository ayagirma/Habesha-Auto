/**
 * TORQUE & CO — NEXT-GEN AUTO CARE CLIENT CONTROLLER
 * Full client-side application logic & state machine
 */

(function () {
  "use strict";

  // ==========================================
  // SERVICE CATALOG DATA & STEPS
  // ==========================================
  const SERVICES = [
    {
      id: "oil-syn",
      name: "Full Synthetic Oil & Filter",
      category: "Fluids & Maintenance",
      price: 89.00,
      duration: "45 mins",
      desc: "Up to 5 qts Mobil 1 / Castrol Full Synthetic + OEM filter & 30-pt safety check."
    },
    {
      id: "brakes-front",
      name: "Front Ceramic Brake Pads & Rotors",
      category: "Brakes & Traction",
      price: 195.00,
      duration: "1.5 hrs",
      desc: "Premium ceramic low-dust pads, rotor resurfacing/replacement & caliper lube."
    },
    {
      id: "diag-obd",
      name: "Full OBD-II Diagnostic & Live Scan",
      category: "Diagnostics & Engine",
      price: 110.00,
      duration: "1 hr",
      desc: "Complete module scan, freeze frame data review, electrical pin-out test."
    },
    {
      id: "brake-flush",
      name: "Brake Fluid Pressure Flush",
      category: "Fluids & Maintenance",
      price: 125.00,
      duration: "45 mins",
      desc: "DOT 4 high-temp fluid evacuation, removes moisture and prevents pedal fade."
    },
    {
      id: "ac-service",
      name: "AC Recharge & Dye Leak Inspection",
      category: "AC & Climate",
      price: 165.00,
      duration: "1 hr",
      desc: "Vacuum test, R134a / 1234yf freon recharge & UV dye leak detection."
    },
    {
      id: "tire-rotation",
      name: "Tire Rotation & High-Speed Balance",
      category: "Brakes & Traction",
      price: 45.00,
      duration: "30 mins",
      desc: "Cross-rotation pattern, digital tread depth scan & precision road-force balance."
    }
  ];

  function getServiceSteps(stepIndex = 2) {
    if (window.GeoTime && typeof window.GeoTime.getWorkflowSteps === "function") {
      return window.GeoTime.getWorkflowSteps(stepIndex);
    }
    return [
      { title: "Vehicle Check-in & Initial Scan", desc: "Bay technician logged VIN and verified baseline diagnostics.", time: "1:15 PM" },
      { title: "Vehicle Lifted & Multi-Point Inspection", desc: "Detailed 30-point inspection covering brakes, suspension, belts, and undercarriage.", time: "1:30 PM" },
      { title: "Active Work: Fluid Drain & Filter Replacement", desc: "Draining oil, replacing OEM filter, and torquing drain plug to factory specs.", time: "2:00 PM" },
      { title: "Secondary Inspection & Finding Verification", desc: "Serpentine belt wear documented and submitted for customer approval.", time: "2:15 PM" },
      { title: "Final Quality Check & Road Test", desc: "Torque check on wheels, fluid level confirmation, and final wash.", time: "2:40 PM" }
    ];
  }

  const SERVICE_STEPS = getServiceSteps(2);

  const SYMPTOM_DATABASE = {
    "brakes": {
      name: "Brakes & Stopping",
      symptoms: [
        {
          id: "brakes-squeal",
          label: "🔊 Squealing / grinding under braking",
          title: "Front Ceramic Brake Pads & Rotor Resurfacing",
          urgency: "Urgency: Moderate",
          parts: "$75.00 – $95.00",
          labor: "$100.00 – $130.00",
          total: "$175.00 – $225.00",
          headline: "Squealing or Metallic Grinding Under Braking",
          explanation: "A high-pitched screech indicates the built-in acoustic wear clip is touching the rotor. Should be serviced promptly before rotor gouging occurs."
        },
        {
          id: "brakes-soft",
          label: "🦶 Spongy / soft pedal sinking to floor",
          title: "Brake Master Cylinder & Fluid Flush",
          urgency: "Urgency: High",
          parts: "$60.00 – $90.00",
          labor: "$85.00 – $120.00",
          total: "$145.00 – $210.00",
          headline: "Spongy Brake Pedal or Extended Stopping Distance",
          explanation: "Air in hydraulic brake lines or contaminated hygroscopic fluid reduces clamping pressure. Requires vacuum fluid evacuation & caliper bleed."
        },
        {
          id: "brakes-vibration",
          label: "〰️ Steering pulsation / shudder when stopping",
          title: "Front Rotor Resurfacing & Hub Truing",
          urgency: "Urgency: Moderate",
          parts: "$80.00 – $120.00",
          labor: "$110.00 – $140.00",
          total: "$190.00 – $260.00",
          headline: "Rotor Disc Thickness Variation / Warpage",
          explanation: "Lateral runout or uneven brake pad friction material deposits create steering wheel vibration under highway deceleration."
        },
        {
          id: "brakes-abs",
          label: "⚠️ ABS warning light on cluster",
          title: "ABS Wheel Speed Sensor & Tone Ring Service",
          urgency: "Urgency: Moderate",
          parts: "$45.00 – $75.00",
          labor: "$75.00 – $110.00",
          total: "$120.00 – $185.00",
          headline: "Anti-lock Braking System Diagnostic & Sensor Swap",
          explanation: "Faulty magnetic reluctance sensor or debris in tone ring preventing wheel speed synchronization during heavy emergency braking."
        }
      ]
    },
    "engine": {
      name: "Engine & OBD-II Diagnostics",
      symptoms: [
        {
          id: "engine-cel",
          label: "⚠️ Check Engine Light (OBD-II Code)",
          title: "OBD-II Engine Diagnostic & Sensor Triage",
          urgency: "Urgency: High",
          parts: "$35.00 – $65.00",
          labor: "$95.00 – $125.00",
          total: "$130.00 – $190.00",
          headline: "Check Engine Light / Emission Control Fault",
          explanation: "ECU triggered emission or combustion fault. Scan tool freeze frame analysis required to identify spark plug, ignition coil, or oxygen sensor failure."
        },
        {
          id: "engine-misfire",
          label: "⚡ Rough idle, engine stumble, or misfire",
          title: "Iridium Spark Plugs & Ignition Coil Replacement",
          urgency: "Urgency: High",
          parts: "$65.00 – $110.00",
          labor: "$95.00 – $130.00",
          total: "$160.00 – $240.00",
          headline: "Cylinder Combustion Misfire (P0301–P0304)",
          explanation: "Fouled spark electrode or failing ignition coil primary winding creating unburned fuel mixture and rough engine idling."
        },
        {
          id: "engine-overheat",
          label: "🌡️ Temperature gauge high / coolant smell",
          title: "Thermostat & Engine Cooling System Pressure Flush",
          urgency: "Urgency: Immediate",
          parts: "$45.00 – $80.00",
          labor: "$105.00 – $140.00",
          total: "$150.00 – $220.00",
          headline: "Engine Overheating Risk & Coolant Flow Obstruction",
          explanation: "Stuck thermostat valve or low coolant pressure risking cylinder head gasket failure. Immediate pressure test and flush advised."
        },
        {
          id: "engine-smoke",
          label: "💨 Exhaust smoke or burning oil odor",
          title: "PCV Positive Crankcase Valve & Gasket Service",
          urgency: "Urgency: Moderate",
          parts: "$55.00 – $95.00",
          labor: "$125.00 – $185.00",
          total: "$180.00 – $280.00",
          headline: "Crankcase Pressure / Valve Cover Gasket Weepage",
          explanation: "Restricted PCV system forcing oil seepage past valve cover gaskets or into intake manifold plenum."
        }
      ]
    },
    "climate": {
      name: "AC & Climate Control",
      symptoms: [
        {
          id: "climate-warm",
          label: "❄️ AC blowing warm or weak airflow",
          title: "AC System Vacuum & Freon Recharge",
          urgency: "Urgency: Low",
          parts: "$50.00 – $80.00",
          labor: "$90.00 – $120.00",
          total: "$140.00 – $200.00",
          headline: "AC Blowing Warm or Humidity in Cabin",
          explanation: "Refrigerant pressure is below optimal threshold or cabin filter is obstructed. System requires evacuation, UV dye test, and recharge."
        },
        {
          id: "climate-smell",
          label: "🦨 Musty, moldy odor when fan turns on",
          title: "HEPA Cabin Micro-Filter & Evaporator Sanitization",
          urgency: "Urgency: Low",
          parts: "$25.00 – $40.00",
          labor: "$50.00 – $70.00",
          total: "$75.00 – $110.00",
          headline: "Cabin Evaporator Core Microbial Decontamination",
          explanation: "Condensation buildup on evaporator coil breeds mildew. Replace electrostatic micro-filter and sanitize HVAC duct passages."
        },
        {
          id: "climate-noise",
          label: "🔊 Clicking noise behind dash when changing temp",
          title: "HVAC Blend Door Actuator Motor Replacement",
          urgency: "Urgency: Low",
          parts: "$65.00 – $95.00",
          labor: "$100.00 – $140.00",
          total: "$165.00 – $235.00",
          headline: "Blend Door Gear Stripping / Air Flap Fault",
          explanation: "Internal plastic stepper gears stripped, preventing smooth hot/cold air mixture transition."
        },
        {
          id: "climate-no-heat",
          label: "🥶 Heater blowing cold air during winter",
          title: "Heater Core Chemical Flush & Air Bleed",
          urgency: "Urgency: Moderate",
          parts: "$35.00 – $55.00",
          labor: "$100.00 – $140.00",
          total: "$135.00 – $195.00",
          headline: "Heater Core Sediment Obstruction",
          explanation: "Mineral sediment restricting coolant circulation through cabin heat exchanger core."
        }
      ]
    },
    "suspension": {
      name: "Suspension & Steering",
      symptoms: [
        {
          id: "susp-shake",
          label: "〰️ Steering shakes / vibrates above 50 MPH",
          title: "Road-Force Wheel Balance & Tire Scan",
          urgency: "Urgency: Moderate",
          parts: "$20.00 – $40.00",
          labor: "$60.00 – $90.00",
          total: "$80.00 – $130.00",
          headline: "High-Speed Dynamic Wheel Imbalance",
          explanation: "Weight distribution variance around wheel circumference causing harmonic vibration through steering rack."
        },
        {
          id: "susp-pull",
          label: "🚗 Car drifts or pulls to one side",
          title: "Precision 4-Wheel Computerized Alignment",
          urgency: "Urgency: Moderate",
          parts: "$10.00 – $25.00",
          labor: "$100.00 – $135.00",
          total: "$110.00 – $160.00",
          headline: "Camber, Caster & Toe Angle Geometric Drift",
          explanation: "Pothole impacts knocked wheel angles out of factory tolerances, accelerating uneven shoulder tire wear."
        },
        {
          id: "susp-clunk",
          label: "💥 Clunking or knocking over bumps",
          title: "Sway Bar End Links & Bushings Replacement",
          urgency: "Urgency: Moderate",
          parts: "$40.00 – $70.00",
          labor: "$100.00 – $140.00",
          total: "$140.00 – $210.00",
          headline: "Stabilizer Link Ball Joint Play & Bushing Wear",
          explanation: "Ball socket play in stabilizer bar links allows metal-to-metal rattling during suspension compression."
        },
        {
          id: "susp-bounce",
          label: "🦘 Excessive bouncing or nose-dive on stops",
          title: "Front Strut Assemblies & Coil Springs",
          urgency: "Urgency: Moderate",
          parts: "$140.00 – $220.00",
          labor: "$150.00 – $200.00",
          total: "$290.00 – $420.00",
          headline: "Hydraulic Shock Absorber Gas/Oil Seal Depletion",
          explanation: "Damping valves unable to arrest spring oscillations, compromising emergency braking stability."
        }
      ]
    },
    "battery": {
      name: "Battery & Electrical",
      symptoms: [
        {
          id: "batt-crank",
          label: "🔋 Slow engine crank or single click on start",
          title: "AGM / Flooded 12V Battery Replacement & CCA Test",
          urgency: "Urgency: Immediate",
          parts: "$140.00 – $185.00",
          labor: "$25.00 – $45.00",
          total: "$165.00 – $230.00",
          headline: "Declining Reserve Capacity & Cold Cranking Amps",
          explanation: "Lead plate sulfation or cell degradation prevents delivery of required amperage to starter motor."
        },
        {
          id: "batt-light",
          label: "🔴 Red battery light glowing on dashboard",
          title: "Alternator Charging Output & Voltage Regulator Test",
          urgency: "Urgency: Immediate",
          parts: "$130.00 – $210.00",
          labor: "$80.00 – $100.00",
          total: "$210.00 – $310.00",
          headline: "Alternator Diode Trio / Stator Charging Loss",
          explanation: "Charging system output below 13.5V, operating solely on battery reserve until total electrical stall."
        },
        {
          id: "batt-drain",
          label: "🔌 Battery dies after parking overnight",
          title: "Parasitic Draw Multimeter Circuit Triage",
          urgency: "Urgency: Moderate",
          parts: "$15.00 – $35.00",
          labor: "$80.00 – $115.00",
          total: "$95.00 – $150.00",
          headline: "Key-Off Excessive Milliamp Current Draw",
          explanation: "Body control module or aftermarket accessory failing to enter sleep mode, depleting 12V state of charge."
        },
        {
          id: "batt-corrosion",
          label: "🧪 White / bluish crust on battery terminals",
          title: "Terminal Post Chemical De-Oxidation & Sealant",
          urgency: "Urgency: Low",
          parts: "$10.00 – $20.00",
          labor: "$35.00 – $55.00",
          total: "$45.00 – $75.00",
          headline: "Acid Vapor Oxidation / High Resistance Joint",
          explanation: "Electrolyte gas venting causing voltage drop across terminal clamps. Requires neutralizing scrub and anti-corrosive felt washers."
        }
      ]
    }
  };

  const OBD_CODES_DATABASE = {
    "P0420": {
      title: "Catalytic Converter System Efficiency Below Threshold (Bank 1)",
      service: "Downstream O2 Sensor & Catalytic Converter Diagnostic",
      parts: "$65.00 – $180.00",
      labor: "$95.00 – $130.00",
      total: "$160.00 – $310.00",
      urgency: "Urgency: Moderate",
      explanation: "Post-catalytic oxygen sensor signal matches pre-cat sensor, indicating degradation of catalyst washcoat or exhaust manifold gasket leak."
    },
    "P0300": {
      title: "Random / Multiple Cylinder Misfire Detected",
      service: "Ignition Coil Pack, Spark Plug & Fuel Trim Diagnostic",
      parts: "$70.00 – $140.00",
      labor: "$95.00 – $135.00",
      total: "$165.00 – $275.00",
      urgency: "Urgency: High",
      explanation: "Crankshaft position sensor detected uneven acceleration pulses across multiple cylinders. Fuel pressure and spark delivery test recommended."
    },
    "P0171": {
      title: "System Too Lean (Bank 1)",
      service: "MAF Sensor Clean, Vacuum Smoke Test & Fuel Filter",
      parts: "$35.00 – $75.00",
      labor: "$90.00 – $125.00",
      total: "$125.00 – $200.00",
      urgency: "Urgency: Moderate",
      explanation: "Excess unmetered air entering engine or weak fuel pump delivery. EVAP smoke test pinpoints intake boot cracks or vacuum line leaks."
    },
    "P0455": {
      title: "EVAP System Gross Leak Detected",
      service: "EVAP Purge Valve & Gas Cap Seal Replacement",
      parts: "$25.00 – $65.00",
      labor: "$75.00 – $105.00",
      total: "$100.00 – $170.00",
      urgency: "Urgency: Low",
      explanation: "Fuel tank vapor recovery system cannot maintain vacuum pressure. Often caused by loose gas cap or stuck EVAP vapor canister purge solenoid."
    },
    "P0128": {
      title: "Coolant Thermostat (Coolant Temp Below Regulating Temp)",
      service: "Engine Thermostat & Coolant Temp Sensor Replacement",
      parts: "$40.00 – $75.00",
      labor: "$100.00 – $135.00",
      total: "$140.00 – $210.00",
      urgency: "Urgency: Moderate",
      explanation: "Thermostat valve stuck open, preventing engine from reaching optimal closed-loop operating temperature and lowering MPG."
    }
  };

  // ==========================================
  // APPLICATION STATE DEFAULTS
  // ==========================================
  const DEMO_VEHICLE = {
    id: "demo-crv-2025",
    title: "2025 Honda CR-V Hybrid",
    plate: "EOGA45",
    vin: "1HGCR2F85MA09281",
    miles: "55,000",
    health: "Certified Good",
    isDemo: true
  };

  const DEFAULT_GUEST_USER = {
    name: "Guest Driver",
    email: "guest@torqueandco.com",
    phone: "(555) 010-2938"
  };

  function loadInitialVehicles() {
    try {
      const saved = localStorage.getItem("habesha_custom_vehicles");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  }

  const DEFAULT_HISTORY = [
    {
      date: "June 14, 2026",
      services: "Synthetic Oil Change & Tire Rotation",
      miles: "54,200",
      total: "$134.00",
      invoiceId: "INV-2026-4412"
    },
    {
      date: "January 20, 2026",
      services: "Cabin Micro-Filter & Brake Fluid Flush",
      miles: "47,800",
      total: "$182.50",
      invoiceId: "INV-2026-1092"
    }
  ];

  const DEFAULT_MESSAGES = [
    { sender: "tech", text: "Hi Jordan, Marcus here from Bay 3. We've got your vehicle up on the lift and started the oil service.", time: (window.GeoTime ? window.GeoTime.getRelativeTimeString(-35) : "1:32 PM") },
    { sender: "tech", text: "During the safety inspection, I spotted surface cracking on the serpentine belt. I've sent photo proof to your estimate tab for approval.", time: (window.GeoTime ? window.GeoTime.getRelativeTimeString(-10) : "2:16 PM") }
  ];

  const state = {
    currentScreen: "home",
    isAuthenticated: false,
    user: JSON.parse(JSON.stringify(DEFAULT_GUEST_USER)),
    vehicles: loadInitialVehicles(),
    activeVehicleIndex: loadInitialVehicles().length > 0 ? 0 : -1,
    booking: {
      selectedServices: [],
      date: (window.GeoTime && window.GeoTime.getBookingDays) ? window.GeoTime.getBookingDays(7).find(d => !d.isClosed) : { dow: "Today", num: new Date().getDate(), month: "Sep", isToday: true },
      time: "8:00 AM",
      mobility: "wait"
    },
    appointment: (() => {
      try {
        const saved = localStorage.getItem("habesha_active_appt");
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    })(),
    liveDemoMode: false,
    progress: {
      stepIndex: 2, // 0 to 4
      findingApproved: null, // null, true, false
      findingPrice: 96.00,
      bayName: "Bay 3 (Lift 2)",
      leadTech: "Marcus Vance"
    },
    payment: {
      method: "applepay",
      isPaid: false
    },
    messages: JSON.parse(JSON.stringify(DEFAULT_MESSAGES)),
    history: JSON.parse(JSON.stringify(DEFAULT_HISTORY))
  };

  // ==========================================
  // ROUTER & NAVIGATION
  // ==========================================
  function navigateTo(screenId) {
    if (!screenId) return;
    state.currentScreen = screenId;

    document.querySelectorAll(".screen").forEach(el => {
      if (el.getAttribute("data-screen") === screenId) {
        el.removeAttribute("hidden");
      } else {
        el.setAttribute("hidden", "true");
      }
    });

    // Update active nav links
    document.querySelectorAll(".nav-link-btn, .bottom-nav-item").forEach(btn => {
      if (btn.getAttribute("data-nav") === screenId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Scroll to top
    const viewport = document.querySelector(".screen-viewport");
    if (viewport) viewport.scrollTop = 0;

    // Trigger render logic
    if (screenId === "home") renderHome();
    if (screenId === "diagnostics") renderDiagnostics();
    if (screenId === "book") renderBooking();
    if (screenId === "progress") renderProgress();
    if (screenId === "estimate") renderEstimate();
    if (screenId === "payment") renderPayment();
    if (screenId === "messages") renderMessages();
    if (screenId === "account") renderAccount();
    if (screenId === "keylocker") renderKeyLocker();
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("active"), 20);
    setTimeout(() => {
      toast.classList.remove("active");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================
  // RENDER: HOME & GARAGE COCKPIT
  // ==========================================
  function renderHome() {
    const hasCustomVehicles = state.vehicles && state.vehicles.length > 0;
    const activeVeh = (hasCustomVehicles && state.activeVehicleIndex >= 0 && state.vehicles[state.activeVehicleIndex])
      ? state.vehicles[state.activeVehicleIndex]
      : (state.isAuthenticated ? null : DEMO_VEHICLE);

    const navVin = document.getElementById("nav-veh-vin");
    const navName = document.getElementById("nav-veh-name");
    const dashTitle = document.getElementById("dash-veh-title");
    const dashVin = document.getElementById("dash-veh-vin");
    const dashPill = document.getElementById("dash-veh-status-pill");
    const dashDemoTag = document.getElementById("dash-demo-tag");

    if (activeVeh) {
      const vinStr = activeVeh.vin || activeVeh.plate || "Registered Vehicle";
      const displayVin = vinStr.startsWith("PLATE:") ? vinStr : (vinStr.length > 14 ? `VIN: ${vinStr.slice(0, 12)}...` : `Plate: ${vinStr}`);

      if (activeVeh.isDemo) {
        if (navName) navName.textContent = "2025 Honda CR-V (Demo)";
        if (navVin) navVin.textContent = "Plate: EOGA45 • Demo Preview";
        if (dashTitle) dashTitle.textContent = activeVeh.title;
        if (dashVin) {
          dashVin.innerHTML = `Plate: ${activeVeh.plate} &bull; ${activeVeh.miles} miles &bull; <button type="button" class="btn-link" id="dash-signin-link" style="color:var(--accent); text-decoration:underline; background:none; border:none; cursor:pointer; font-weight:600; padding:0; font-size:12px;">Sign In to load your vehicle</button>`;
          const dashSignInBtn = document.getElementById("dash-signin-link");
          if (dashSignInBtn) {
            dashSignInBtn.addEventListener("click", () => openAuthModal("signin"));
          }
        }
        if (dashDemoTag) dashDemoTag.style.display = "inline-flex";
      } else {
        if (navName) navName.textContent = activeVeh.title;
        if (navVin) navVin.textContent = activeVeh.plate ? `Plate: ${activeVeh.plate}` : displayVin;
        if (dashTitle) dashTitle.textContent = activeVeh.title;
        if (dashVin) dashVin.textContent = `${activeVeh.plate ? 'Plate: ' + activeVeh.plate : displayVin} • ${activeVeh.miles || 0} miles`;
        if (dashDemoTag) dashDemoTag.style.display = "none";
      }

      if (dashPill) {
        dashPill.style.display = "inline-flex";
        dashPill.textContent = "● " + (activeVeh.health || "Certified Good");
      }
    } else {
      if (navName) navName.textContent = "Select Vehicle";
      if (navVin) navVin.textContent = "Click to choose or add";
      if (dashTitle) dashTitle.textContent = "No Vehicle Selected";
      if (dashVin) dashVin.textContent = "Add your car or sign in to load your saved garage";
      if (dashDemoTag) dashDemoTag.style.display = "none";
      if (dashPill) {
        dashPill.style.display = "none";
      }
    }

    // Populate Featured Services on Home
    const featuredContainer = document.getElementById("home-featured-services");
    if (featuredContainer) {
      featuredContainer.innerHTML = SERVICES.slice(0, 4).map(svc => `
        <div class="service-card-item" data-svc-id="${svc.id}" style="padding:12px;">
          <div style="flex:1;">
            <div style="font-weight:700; font-size:13.5px; color:#fff;">${svc.name}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">${svc.duration} &bull; ${svc.category}</div>
          </div>
          <div class="font-mono" style="font-weight:700; font-size:14px; color:var(--accent);">$${svc.price.toFixed(2)}</div>
        </div>
      `).join("");

      featuredContainer.querySelectorAll(".service-card-item").forEach(item => {
        item.addEventListener("click", () => {
          const id = item.getAttribute("data-svc-id");
          if (!state.booking.selectedServices.includes(id)) {
            state.booking.selectedServices = [id];
          }
          navigateTo("book");
        });
      });
    }

    // Step preview & dynamic ETA on Home
    const fill = document.getElementById("dash-progress-fill");
    const stepLabel = document.getElementById("dash-step-text");
    const estFinish = document.getElementById("dash-est-finish");

    if (state.appointment && state.appointment.status === "scheduled" && !state.liveDemoMode) {
      if (fill) fill.style.width = "0%";
      if (stepLabel) {
        const dateStr = state.appointment.date.fullFormatted || state.appointment.date.dow || "Upcoming";
        stepLabel.textContent = `📅 Scheduled: ${dateStr} at ${state.appointment.time} (Awaiting Drop-off)`;
      }
      if (estFinish) {
        estFinish.textContent = `Arrival: ${state.appointment.time}`;
      }
    } else {
      const steps = getServiceSteps(state.progress.stepIndex);
      if (fill && stepLabel) {
        const pct = Math.round(((state.progress.stepIndex + 1) / steps.length) * 100);
        fill.style.width = pct + "%";
        stepLabel.textContent = `Step ${state.progress.stepIndex + 1} of ${steps.length}: ${steps[state.progress.stepIndex].title}`;
      }
      if (estFinish && window.GeoTime) {
        estFinish.textContent = window.GeoTime.getDynamicETA(state.progress.stepIndex);
      }
    }
  }

  // ==========================================
  // RENDER: SYMPTOM & OBD-II DIAGNOSER
  // ==========================================
  let currentActiveSystem = "brakes";
  let currentActiveSymptomId = null;

  function renderDiagnostics(systemKey = currentActiveSystem, symptomId = null) {
    currentActiveSystem = systemKey;
    const sysData = SYMPTOM_DATABASE[systemKey] || SYMPTOM_DATABASE["brakes"];
    const subList = document.getElementById("diag-sub-symptoms-list");
    const countEl = document.getElementById("sub-symptom-count");
    const catTitle = document.getElementById("diag-cat-title");
    const vehContextName = document.getElementById("diag-context-veh-name");

    // Vehicle Context Badge
    const hasCustomVehicles = state.vehicles && state.vehicles.length > 0;
    const activeVeh = (hasCustomVehicles && state.activeVehicleIndex >= 0 && state.vehicles[state.activeVehicleIndex])
      ? state.vehicles[state.activeVehicleIndex]
      : (state.isAuthenticated ? null : DEMO_VEHICLE);

    if (vehContextName) {
      vehContextName.textContent = activeVeh ? activeVeh.title : "Standard Passenger Vehicle";
    }

    if (catTitle) catTitle.textContent = `${sysData.name} Analysis`;
    if (countEl) countEl.textContent = `${sysData.symptoms.length} specific issues identified`;

    const activeSymptom = symptomId
      ? sysData.symptoms.find(s => s.id === symptomId) || sysData.symptoms[0]
      : sysData.symptoms[0];
    currentActiveSymptomId = activeSymptom.id;

    // Update active system tabs
    document.querySelectorAll(".system-tab-btn").forEach(btn => {
      if (btn.getAttribute("data-system") === systemKey) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Populate sub-symptom selector chips
    if (subList) {
      subList.innerHTML = sysData.symptoms.map(s => `
        <div class="sub-symptom-chip ${s.id === activeSymptom.id ? 'active' : ''}" data-symptom-id="${s.id}">
          <span>${s.label}</span>
          <span class="font-mono" style="font-size:11.5px; color:var(--text-muted);">${s.total.split("–")[0]}...</span>
        </div>
      `).join("");

      subList.querySelectorAll(".sub-symptom-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          const sId = chip.getAttribute("data-symptom-id");
          renderDiagnostics(systemKey, sId);
        });
      });
    }

    // Populate Detail Card
    const headline = document.getElementById("diag-headline");
    const explanation = document.getElementById("diag-explanation");
    const serviceName = document.getElementById("diag-service-name");
    const parts = document.getElementById("diag-parts");
    const labor = document.getElementById("diag-labor");
    const total = document.getElementById("diag-total");

    if (headline) headline.textContent = activeSymptom.headline;
    if (explanation) explanation.textContent = activeSymptom.explanation;
    if (serviceName) serviceName.textContent = activeSymptom.title;
    if (parts) parts.textContent = activeSymptom.parts;
    if (labor) labor.textContent = activeSymptom.labor;
    if (total) total.textContent = activeSymptom.total;
  }

  // ==========================================
  // RENDER: BOOKING FLOW
  // ==========================================
  function calculateBookingTotal() {
    return state.booking.selectedServices.reduce((sum, id) => {
      const s = SERVICES.find(x => x.id === id);
      return sum + (s ? s.price : 0);
    }, 0);
  }

  function calculateBookingDurationMinutes() {
    if (!state.booking.selectedServices.length) return 0;
    return state.booking.selectedServices.reduce((sum, id) => {
      const s = SERVICES.find(x => x.id === id);
      const durMin = (window.GeoTime && window.GeoTime.getServiceDurationMinutes)
        ? window.GeoTime.getServiceDurationMinutes(s ? s.duration : "45 mins")
        : 45;
      return sum + durMin;
    }, 0);
  }

  function renderBooking() {
    const activeVeh = (state.activeVehicleIndex >= 0 && state.vehicles[state.activeVehicleIndex]) ? state.vehicles[state.activeVehicleIndex] : null;
    const bookTitle = document.getElementById("book-veh-title");
    const bookVin = document.getElementById("book-veh-vin");
    const changeBtn = document.getElementById("book-change-veh-btn");

    if (activeVeh) {
      if (bookTitle) bookTitle.textContent = activeVeh.title;
      if (bookVin) bookVin.textContent = `${activeVeh.plate ? 'Plate: ' + activeVeh.plate : (activeVeh.vin || 'VIN Registered')} • ${activeVeh.miles || 0} miles`;
      if (changeBtn) changeBtn.textContent = "Change Vehicle";
    } else {
      if (bookTitle) bookTitle.textContent = "No Vehicle Selected";
      if (bookVin) bookVin.textContent = "Click to select or enter your vehicle for this booking";
      if (changeBtn) changeBtn.textContent = "+ Select / Add Vehicle";
    }

    // Services Catalog
    const catalogContainer = document.getElementById("book-service-catalog");
    if (catalogContainer) {
      catalogContainer.innerHTML = SERVICES.map(svc => {
        const isSelected = state.booking.selectedServices.includes(svc.id);
        return `
          <div class="service-card-item ${isSelected ? 'selected' : ''}" data-id="${svc.id}">
            <div class="svc-checkbox">${isSelected ? '✓' : ''}</div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:14px; color:#fff;">${svc.name}</strong>
                <span class="font-mono" style="font-weight:700; font-size:14.5px; color:var(--accent);">$${svc.price.toFixed(2)}</span>
              </div>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${svc.desc}</p>
              <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">Est. Time: ${svc.duration}</div>
            </div>
          </div>
        `;
      }).join("");

      catalogContainer.querySelectorAll(".service-card-item").forEach(el => {
        el.addEventListener("click", () => {
          const id = el.getAttribute("data-id");
          if (state.booking.selectedServices.includes(id)) {
            state.booking.selectedServices = state.booking.selectedServices.filter(x => x !== id);
          } else {
            state.booking.selectedServices.push(id);
          }
          renderBooking();
        });
      });
    }

    // Selected count & Total Preview
    const total = calculateBookingTotal();
    const totalDurationMin = calculateBookingDurationMinutes();

    const countEl = document.getElementById("book-selected-count");
    if (countEl) countEl.textContent = `${state.booking.selectedServices.length} Selected`;

    const totalPrevEl = document.getElementById("book-total-preview");
    if (totalPrevEl) totalPrevEl.textContent = `$${total.toFixed(2)}`;

    // Update cumulative duration indicator pill
    const durationPill = document.getElementById("book-duration-pill");
    if (durationPill) {
      if (state.booking.selectedServices.length > 0) {
        durationPill.style.display = "inline-flex";
        const durHours = (totalDurationMin / 60).toFixed(1).replace(/\.0$/, "");
        durationPill.textContent = `⏱️ Est. Service Time: ${durHours} hr${durHours === '1' ? '' : 's'} (${totalDurationMin}m)`;
      } else {
        durationPill.style.display = "none";
      }
    }

    // Update timezone indicator badge
    const tzBadge = document.getElementById("book-tz-badge");
    if (tzBadge && window.GeoTime) {
      const geo = window.GeoTime.detect();
      tzBadge.textContent = `Timezone: ${geo.city} (${geo.abbreviation})`;
    }

    // Dates (Next 7 days dynamically generated from user's local calendar considering service duration)
    const effectiveDuration = totalDurationMin > 0 ? totalDurationMin : 45;
    const dates = (window.GeoTime && window.GeoTime.getBookingDays)
      ? window.GeoTime.getBookingDays(7, effectiveDuration)
      : [];

    // Same-day edge case: If current booking date is missing, closed, or today has no available slots left (past or closed),
    // automatically roll over to the first open day that has available slots!
    if (!state.booking.date || state.booking.date.isClosed || (state.booking.date.isToday && !state.booking.date.hasAvailableSlots)) {
      const firstAvailable = dates.find(d => !d.isClosed && d.hasAvailableSlots) || dates.find(d => !d.isClosed) || dates[0];
      if (firstAvailable) {
        state.booking.date = firstAvailable;
      }
    }

    const dateContainer = document.getElementById("book-date-row");
    if (dateContainer && dates.length > 0) {
      dateContainer.innerHTML = dates.map((d, idx) => {
        const isSel = state.booking.date && (d.num === state.booking.date.num && d.month === state.booking.date.month);
        let subText = d.month;
        let closedStyle = "";

        if (d.isClosed) {
          subText = "Closed";
          closedStyle = 'style="opacity:0.42; cursor:not-allowed;" title="Closed on Sundays"';
        } else if (d.isToday && !d.hasAvailableSlots) {
          subText = "Past Hours";
          closedStyle = 'style="opacity:0.55; cursor:pointer;" title="All slots for today have passed or shop is closed"';
        }

        return `
          <div class="date-pill-btn ${isSel ? 'selected' : ''}" data-idx="${idx}" ${closedStyle}>
            <span style="font-size:11px; text-transform:uppercase;">${d.isToday ? 'Today' : d.dow}</span>
            <span class="font-mono" style="font-size:18px; font-weight:700;">${d.num}</span>
            <span style="font-size:10px; opacity:0.85;">${subText}</span>
          </div>
        `;
      }).join("");

      dateContainer.querySelectorAll(".date-pill-btn").forEach((el, idx) => {
        el.addEventListener("click", () => {
          const selectedDay = dates[idx];
          if (selectedDay.isClosed) {
            showToast("Habesha Auto is closed on Sundays. Please choose Monday through Saturday.", "warning");
            return;
          }
          if (selectedDay.isToday && !selectedDay.hasAvailableSlots) {
            showToast("All appointments for today have passed. Please choose an upcoming day.", "warning");
          }
          state.booking.date = selectedDay;
          renderBooking();
        });
      });
    }

    // Time Slots for the selected date with multi-service stacking and past slot filtering
    const timeContainer = document.getElementById("book-time-grid");
    if (timeContainer) {
      const selectedDay = state.booking.date || dates[0];

      if (!selectedDay || selectedDay.isClosed) {
        timeContainer.innerHTML = `
          <div style="grid-column: 1 / -1; padding:16px; text-align:center; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; color:#fca5a5; font-size:13px;">
            ⚠️ Habesha Auto is closed on Sundays. Please choose a Monday through Saturday appointment.
          </div>
        `;
      } else {
        const detailedSlots = (window.GeoTime && window.GeoTime.getDetailedTimeSlots)
          ? window.GeoTime.getDetailedTimeSlots(selectedDay.dayOfWeek, selectedDay.isToday, effectiveDuration)
          : (selectedDay.slots || []).map(t => ({ time: t, isAvailable: true, reason: "" }));

        const availableList = detailedSlots.filter(s => s.isAvailable);

        // Ensure state.booking.time is currently available
        const isCurrentTimeAvailable = availableList.some(s => s.time === state.booking.time);
        if (!isCurrentTimeAvailable && availableList.length > 0) {
          state.booking.time = availableList[0].time;
        } else if (availableList.length === 0) {
          state.booking.time = null;
        }

        if (detailedSlots.length === 0 || availableList.length === 0) {
          const reasonText = selectedDay.isToday
            ? "All service windows for today are closed or in the past. Please select tomorrow or an upcoming date above."
            : `Selected services (${(effectiveDuration/60).toFixed(1)} hrs) exceed operating hours on this date.`;
          timeContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding:16px; text-align:center; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:8px; color:#fde68a; font-size:13px; line-height:1.5;">
              ⏱️ ${reasonText}
            </div>
          `;
        } else {
          timeContainer.innerHTML = detailedSlots.map(s => {
            const isSel = s.time === state.booking.time && s.isAvailable;
            if (!s.isAvailable) {
              return `
                <div class="time-slot-btn disabled" title="${s.reason || 'Unavailable'}">
                  <span class="slot-time-text">${s.time}</span>
                  <span class="slot-cutoff-hint">${s.reason || 'Unavailable'}</span>
                </div>
              `;
            }
            return `
              <div class="time-slot-btn ${isSel ? 'selected' : ''}" data-time="${s.time}">
                <span class="slot-time-text">${s.time}</span>
              </div>
            `;
          }).join("");

          timeContainer.querySelectorAll(".time-slot-btn:not(.disabled)").forEach(btn => {
            btn.addEventListener("click", () => {
              state.booking.time = btn.getAttribute("data-time");
              renderBooking();
            });
          });
        }
      }
    }

    // Validation & CTA Button State
    const confirmBtn = document.getElementById("confirm-booking-btn");
    if (confirmBtn) {
      const hasServices = state.booking.selectedServices.length > 0;
      const hasValidSlot = Boolean(state.booking.time);
      const isClosed = Boolean(state.booking.date && state.booking.date.isClosed);

      if (!hasServices) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.style.cursor = "not-allowed";
        confirmBtn.textContent = "Select a Service to Continue →";
      } else if (isClosed || !hasValidSlot) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.style.cursor = "not-allowed";
        confirmBtn.textContent = "Select an Available Arrival Slot →";
      } else {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor = "pointer";
        confirmBtn.textContent = `Confirm Appointment ($${total.toFixed(2)}) →`;
      }
    }
  }

  // ==========================================
  // RENDER: LIVE BAY PROGRESS & SCHEDULED TICKET
  // ==========================================
  function renderProgress() {
    const schedView = document.getElementById("progress-scheduled-view");
    const liveView = document.getElementById("progress-live-view");
    const backToSchedBtn = document.getElementById("btn-back-to-scheduled");

    const appt = state.appointment;
    const isScheduledMode = appt && appt.status === "scheduled" && !state.liveDemoMode;

    if (schedView && liveView) {
      if (isScheduledMode) {
        schedView.style.display = "block";
        liveView.style.display = "none";

        // Fill in Scheduled ticket
        const dateFormatted = (appt.date && (appt.date.fullFormatted || appt.date.dow)) || "Scheduled Date";
        const titleEl = document.getElementById("sched-header-title");
        const refEl = document.getElementById("sched-ref-code");
        const vehEl = document.getElementById("sched-veh-name");
        const dtEl = document.getElementById("sched-datetime");
        const mobEl = document.getElementById("sched-mobility-label");
        const costEl = document.getElementById("sched-total-cost");

        if (titleEl) titleEl.textContent = `Service Scheduled for ${dateFormatted} at ${appt.time}`;
        if (refEl) refEl.textContent = appt.id || "APT-829104";
        if (vehEl) vehEl.textContent = appt.vehicle ? (appt.vehicle.title + " (VIN: " + appt.vehicle.vin + ")") : "2021 Honda Accord EX-L";
        if (dtEl) dtEl.textContent = `${dateFormatted} • ${appt.time}`;
        
        const mobilityLabels = {
          wait: "Wait in Customer Lounge (Business Hours)",
          keydrop: "Secure Key Drop Box (During Business Hours Only)",
          shuttle: "Complimentary Lyft Voucher ($20 Credit)"
        };
        if (mobEl) mobEl.textContent = mobilityLabels[appt.mobility] || "Customer Drop-off";
        if (costEl) costEl.textContent = `$${(appt.total || calculateBookingTotal()).toFixed(2)}`;

        const svcContainer = document.getElementById("sched-services-list");
        if (svcContainer) {
          const svcs = (appt.services || state.booking.selectedServices).map(id => SERVICES.find(s => s.id === id)).filter(Boolean);
          if (!svcs.length) {
            svcContainer.innerHTML = `<div style="font-size:12px; color:var(--text-muted);">Standard Multi-Point Inspection</div>`;
          } else {
            svcContainer.innerHTML = svcs.map(s => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-card); border-radius:6px; border:1px solid var(--border-subtle);">
                <div>
                  <div style="font-size:13px; font-weight:600; color:#fff;">${s.name}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${s.duration} • ${s.category}</div>
                </div>
                <div class="font-mono" style="font-weight:700; font-size:13.5px; color:var(--accent);">$${s.price.toFixed(2)}</div>
              </div>
            `).join("");
          }
        }
        return;
      } else {
        schedView.style.display = "none";
        liveView.style.display = "block";
        if (backToSchedBtn) {
          backToSchedBtn.style.display = (appt && appt.status === "scheduled") ? "inline-flex" : "none";
        }
      }
    }

    const container = document.getElementById("progress-timeline-container");
    if (!container) return;

    const currentSteps = getServiceSteps(state.progress.stepIndex);

    container.innerHTML = currentSteps.map((step, idx) => {
      let statusClass = "";
      let markerContent = (idx + 1).toString();

      if (idx < state.progress.stepIndex) {
        statusClass = "completed";
        markerContent = "✓";
      } else if (idx === state.progress.stepIndex) {
        statusClass = "active";
      }

      return `
        <div class="timeline-step ${statusClass}">
          <div class="step-marker">${markerContent}</div>
          <div class="step-content">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="step-title">${step.title}</span>
              <span class="step-time font-mono">${step.time}</span>
            </div>
            <p class="step-desc">${step.desc}</p>
          </div>
        </div>
      `;
    }).join("");

    const bookingTotal = calculateBookingTotal();
    const base = bookingTotal > 0 ? bookingTotal : (state.appointment ? (state.appointment.total || 134.00) : 134.00);
    const extra = state.progress.findingPrice ? state.progress.findingPrice : 0;
    const finalTotal = base + extra;
    document.getElementById("prog-total-display").textContent = `$${finalTotal.toFixed(2)}`;

    const overall = document.getElementById("prog-overall-badge");
    if (state.progress.stepIndex >= currentSteps.length) {
      overall.className = "pill pill-success";
      overall.textContent = "Service Completed";
    } else {
      const pct = Math.round(((state.progress.stepIndex + 1) / currentSteps.length) * 100);
      overall.className = "pill pill-good";
      overall.textContent = `In Progress (${pct}%)`;
    }

    // Dynamic Payment Call-to-Action Lock (Active labor Steps 1-4 disabled, Step 5 unlocks payment)
    const payBtn = document.getElementById("prog-pay-early-btn");
    const isReadyForPayment = state.progress.stepIndex >= currentSteps.length - 1;
    if (payBtn) {
      if (isReadyForPayment) {
        payBtn.disabled = false;
        payBtn.classList.remove("btn-outline", "disabled");
        payBtn.classList.add("btn-success");
        payBtn.style.opacity = "1";
        payBtn.style.cursor = "pointer";
        payBtn.innerHTML = `Proceed to Payment ($${finalTotal.toFixed(2)}) &rarr;`;
      } else {
        payBtn.disabled = true;
        payBtn.classList.remove("btn-success");
        payBtn.classList.add("btn-outline");
        payBtn.style.opacity = "0.5";
        payBtn.style.cursor = "not-allowed";
        payBtn.innerHTML = `🔒 Payment Upon Completion (Step 5)`;
      }
    }

    // Dynamic "Review Findings" Visibility & Pulse Alert
    const reviewBtn = document.getElementById("btn-review-findings");
    if (reviewBtn) {
      if (state.progress.findingApproved === null) {
        reviewBtn.classList.add("btn-pulse-alert");
        reviewBtn.innerHTML = `⚠️ Review Findings <span class="pill pill-warning" style="font-size:10px; padding:2px 6px; margin-left:4px;">1 Action Required</span>`;
      } else {
        reviewBtn.classList.remove("btn-pulse-alert");
        reviewBtn.innerHTML = `Review Findings`;
      }
    }
  }

  // ==========================================
  // RENDER: ESTIMATE APPROVAL
  // ==========================================
  function renderEstimate() {
    const bookingTotal = calculateBookingTotal();
    const base = bookingTotal > 0 ? bookingTotal : (state.appointment ? (state.appointment.total || 134.00) : 134.00);
    const extra = state.progress.findingPrice || 96.00;
    const decisionDiv = document.getElementById("estimate-decision-status");
    const actionsDiv = document.getElementById("estimate-action-buttons");
    const totalEl = document.getElementById("estimate-recalculated-total");

    if (state.progress.findingApproved === true) {
      if (totalEl) totalEl.textContent = `$${(base + extra).toFixed(2)}`;
      if (actionsDiv) actionsDiv.style.display = "none";
      if (decisionDiv) {
        decisionDiv.style.display = "block";
        decisionDiv.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">
            <span class="pill pill-success" style="font-size:14px; padding:8px 16px;">
              ✅ Approved by you ($96.00 added to repair authorization)
            </span>
            <button type="button" class="btn btn-link btn-sm" id="btn-re-evaluate-finding" style="color:var(--text-muted); text-decoration:underline; font-size:12.5px; background:none; border:none; cursor:pointer;">
              🔄 Change Decision &bull; Decline &amp; Defer to Next Visit
            </button>
          </div>
        `;
        const reEvalBtn = document.getElementById("btn-re-evaluate-finding");
        if (reEvalBtn) {
          reEvalBtn.addEventListener("click", () => {
            state.progress.findingApproved = false;
            renderEstimate();
            renderProgress();
            showToast("Updated: Finding declined and deferred to next visit.", "info");
          });
        }
      }
    } else if (state.progress.findingApproved === false) {
      if (totalEl) totalEl.textContent = `$${base.toFixed(2)}`;
      if (actionsDiv) actionsDiv.style.display = "none";
      if (decisionDiv) {
        decisionDiv.style.display = "block";
        decisionDiv.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">
            <span class="pill pill-warning" style="font-size:14px; padding:8px 16px;">
              ⚠️ Declined &amp; deferred to next service
            </span>
            <button type="button" class="btn btn-link btn-sm" id="btn-re-evaluate-finding" style="color:var(--accent); text-decoration:underline; font-size:12.5px; background:none; border:none; cursor:pointer; font-weight:600;">
              🔄 Change Mind &bull; Approve This Repair (+$96.00)
            </button>
          </div>
        `;
        const reEvalBtn = document.getElementById("btn-re-evaluate-finding");
        if (reEvalBtn) {
          reEvalBtn.addEventListener("click", () => {
            state.progress.findingApproved = true;
            renderEstimate();
            renderProgress();
            showToast("Updated: Serpentine Belt repair approved ($96.00 added).", "success");
          });
        }
      }
    } else {
      if (totalEl) totalEl.textContent = `$${base.toFixed(2)} (or $${(base + extra).toFixed(2)} if approved)`;
      if (actionsDiv) actionsDiv.style.display = "flex";
      if (decisionDiv) decisionDiv.style.display = "none";
    }
  }

  // ==========================================
  // RENDER: PAYMENT & INVOICE
  // ==========================================
  function renderPayment() {
    const linesContainer = document.getElementById("checkout-invoice-lines");
    if (!linesContainer) return;

    let lines = [];
    state.booking.selectedServices.forEach(id => {
      const s = SERVICES.find(x => x.id === id);
      if (s) {
        lines.push({ name: s.name, amount: s.price });
      }
    });

    if (state.progress.findingApproved === true) {
      lines.push({ name: "OEM Serpentine Belt & Installation", amount: state.progress.findingPrice });
    }

    const subtotal = lines.reduce((acc, l) => acc + l.amount, 0);
    const shopSupplies = 8.50;
    const tax = subtotal * 0.0825;
    const grandTotal = subtotal + shopSupplies + tax;

    linesContainer.innerHTML = `
      ${lines.map(l => `
        <div class="invoice-row">
          <span>${l.name}</span>
          <span class="font-mono">$${l.amount.toFixed(2)}</span>
        </div>
      `).join("")}
      <div class="invoice-row">
        <span>Eco-Disposal & Shop Supplies</span>
        <span class="font-mono">$${shopSupplies.toFixed(2)}</span>
      </div>
      <div class="invoice-row">
        <span>State Sales Tax (8.25%)</span>
        <span class="font-mono">$${tax.toFixed(2)}</span>
      </div>
      <div class="invoice-row total-row">
        <span>Total Due</span>
        <span class="font-mono" style="color:var(--accent);">$${grandTotal.toFixed(2)}</span>
      </div>
    `;

    document.getElementById("pay-button-amount").textContent = `$${grandTotal.toFixed(2)}`;
  }

  // ==========================================
  // RENDER: CHAT & MESSAGES
  // ==========================================
  function renderMessages() {
    const chatStream = document.getElementById("chat-stream");
    if (!chatStream) return;

    chatStream.innerHTML = state.messages.map(m => `
      <div class="chat-bubble ${m.sender === 'user' ? 'outbound' : 'inbound'}">
        <div>${m.text}</div>
        <div class="chat-time">${m.time}</div>
      </div>
    `).join("");

    chatStream.scrollTop = chatStream.scrollHeight;
  }

  // ==========================================
  // RENDER: ACCOUNT & HISTORY
  // ==========================================
  function renderAccount() {
    updateAuthUI();
    const container = document.getElementById("account-history-list");
    if (!container) return;

    if (!state.history || state.history.length === 0) {
      container.innerHTML = `
        <div class="card" style="background:var(--bg-input); padding:24px; text-align:center; color:var(--text-muted);">
          No service records logged yet. Records will appear here after shop visits.
        </div>
      `;
      return;
    }

    container.innerHTML = state.history.map(h => `
      <div class="card" style="background:var(--bg-input); padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <span class="pill pill-good" style="margin-bottom:6px;">Paid & Completed</span>
            <div style="font-weight:700; font-size:15px; color:#fff;">${h.services}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
              ${h.date} &bull; Logged at ${h.miles} miles
            </div>
          </div>
          <div style="text-align:right;">
            <div class="font-mono" style="font-size:16px; font-weight:700; color:#fff;">${h.total}</div>
            <a href="#" style="font-size:11.5px; color:var(--accent); text-decoration:underline;">Download PDF</a>
          </div>
        </div>
      </div>
    `).join("");
  }

  // ==========================================
  // RENDER: SMART KEY LOCKER (DROP-OFF & PICKUP)
  // ==========================================
  function renderKeyLocker() {
    const isPickup = Boolean(state.payment && state.payment.isPaid);
    const badgeEl = document.querySelector(".key-locker-card .pill");
    const titleEl = document.querySelector('[data-screen="keylocker"] h1');
    const eyebrowEl = document.querySelector('[data-screen="keylocker"] .eyebrow');
    const descEl = document.querySelector(".key-locker-card p");

    if (isPickup) {
      if (eyebrowEl) eyebrowEl.textContent = "Contactless Vehicle Pickup";
      if (titleEl) titleEl.textContent = "Smart Key Pickup Locker";
      if (badgeEl) {
        badgeEl.textContent = "Vehicle Ready in Slot A-4 • Key in Compartment #14";
        badgeEl.className = "pill pill-good";
      }
      if (descEl) {
        descEl.innerHTML = "Your service invoice is paid! Scan this QR code or type <strong>8492</strong> on the illuminated electronic locker box next to Bay 1 to unlock compartment <strong>#14</strong> and retrieve your key fob for pickup.";
      }
    } else {
      if (eyebrowEl) eyebrowEl.textContent = "Contactless Shop Access";
      if (titleEl) titleEl.textContent = "Smart Key Drop-Off Locker";
      if (badgeEl) {
        badgeEl.textContent = "Locker Compartment #14 Assigned";
        badgeEl.className = "pill pill-good";
      }
      if (descEl) {
        descEl.innerHTML = "Scan this QR code or type <strong>8492</strong> on the illuminated electronic locker box next to Bay 1. Place your key fob inside and close the door during official shop hours.";
      }
    }
  }

  // ==========================================
  // INITIALIZATION & EVENT LISTENERS
  // ==========================================
  function initEventListeners() {
    // Global Navigation Clicks
    document.addEventListener("click", function (e) {
      const navTarget = e.target.closest("[data-nav]");
      if (navTarget) {
        const dest = navTarget.getAttribute("data-nav");
        navigateTo(dest);
      }
    });

    // Quick Symptom Chips on Home
    const chips = document.querySelectorAll("#quick-symptom-chips .symptom-chip");
    const outputBox = document.getElementById("quick-symptom-output");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        outputBox.style.display = "flex";
      });
    });

    const bookSymptomBtn = document.getElementById("book-symptom-btn");
    if (bookSymptomBtn) {
      bookSymptomBtn.addEventListener("click", () => {
        state.booking.selectedServices = ["brakes-front"];
        navigateTo("book");
      });
    }

    // System tabs on Diagnostics page
    const sysTabs = document.querySelectorAll(".system-tab-btn");
    sysTabs.forEach(btn => {
      btn.addEventListener("click", () => {
        const sys = btn.getAttribute("data-system");
        renderDiagnostics(sys);
      });
    });

    // OBD-II Code Lookup & Quick Selection Chips
    function lookupObdCode(rawCode) {
      const code = (rawCode || "").trim().toUpperCase();
      if (!code) {
        showToast("Please enter an OBD-II code (e.g., P0420, P0300)", "warning");
        return;
      }
      const obdInput = document.getElementById("obd-input");
      if (obdInput) obdInput.value = code;

      const found = OBD_CODES_DATABASE[code];
      const headline = document.getElementById("diag-headline");
      const explanation = document.getElementById("diag-explanation");
      const serviceName = document.getElementById("diag-service-name");
      const parts = document.getElementById("diag-parts");
      const labor = document.getElementById("diag-labor");
      const total = document.getElementById("diag-total");

      if (found) {
        showToast(`Diagnosing code ${code}: ${found.title.split("(")[0]}`, "info");
        if (headline) headline.textContent = `OBD-II Code ${code} Diagnostic`;
        if (explanation) explanation.textContent = found.explanation;
        if (serviceName) serviceName.textContent = found.service;
        if (parts) parts.textContent = found.parts;
        if (labor) labor.textContent = found.labor;
        if (total) total.textContent = found.total;
      } else {
        showToast(`Code ${code} logged. Live scan recommended.`, "info");
        if (headline) headline.textContent = `OBD-II Code ${code} Diagnostic Scan`;
        if (explanation) explanation.textContent = `Trouble code ${code} logged in vehicle ECU. Sensor data live graph and freeze-frame analysis required to isolate fault. If you do not have an OBD-II scanner, Habesha Auto provides complimentary live OBD-II diagnostic scans at Bay 1.`;
        if (serviceName) serviceName.textContent = "Live Stream Scanner Diagnostic & ECU Read";
        if (parts) parts.textContent = "$0.00 – $45.00";
        if (labor) labor.textContent = "$95.00 – $120.00";
        if (total) total.textContent = "$95.00 – $165.00";
      }
    }

    const obdBtn = document.getElementById("obd-lookup-btn");
    if (obdBtn) {
      obdBtn.addEventListener("click", () => {
        const code = document.getElementById("obd-input").value;
        lookupObdCode(code);
      });
    }

    const obdInput = document.getElementById("obd-input");
    if (obdInput) {
      obdInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          lookupObdCode(obdInput.value);
        }
      });
    }

    // Quick OBD Code Chips
    document.querySelectorAll(".obd-quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const code = chip.getAttribute("data-code");
        lookupObdCode(code);
      });
    });

    // Switch vehicle button from Diagnostics
    const diagSwitchVehBtn = document.getElementById("diag-switch-veh-btn");
    if (diagSwitchVehBtn) {
      diagSwitchVehBtn.addEventListener("click", () => {
        openGarage();
      });
    }

    const diagBookBtn = document.getElementById("diag-book-now-btn");
    if (diagBookBtn) {
      diagBookBtn.addEventListener("click", () => {
        state.booking.selectedServices = ["diag-obd"];
        navigateTo("book");
      });
    }

    function updateNavBayBadge() {
      const badgeText = document.getElementById("nav-bay-status-text");
      if (!badgeText) return;
      if (state.appointment && state.appointment.status === "scheduled" && !state.liveDemoMode) {
        const dStr = state.appointment.date.dow || "Scheduled";
        badgeText.textContent = `📅 ${dStr} ${state.appointment.time}`;
      } else {
        badgeText.textContent = "Bay 3 Active";
      }
    }

    // Confirm Booking CTA
    const confirmBookingBtn = document.getElementById("confirm-booking-btn");
    if (confirmBookingBtn) {
      confirmBookingBtn.addEventListener("click", () => {
        if (!state.booking.selectedServices.length) {
          showToast("Please select at least one service to book.", "warning");
          return;
        }
        if (state.booking.date && state.booking.date.isClosed) {
          showToast("Habesha Auto is closed on Sundays. Please select a Monday through Saturday appointment.", "warning");
          return;
        }

        const activeVeh = (state.activeVehicleIndex >= 0 && state.vehicles[state.activeVehicleIndex]) ? state.vehicles[state.activeVehicleIndex] : null;
        if (!activeVeh) {
          showToast("Please select or add a vehicle for this booking.", "warning");
          openGarage();
          return;
        }

        const isToday = Boolean(state.booking.date && state.booking.date.isToday);
        const shop = window.GeoTime ? window.GeoTime.isShopOpen() : { isOpen: true };
        const isLiveNow = isToday && shop.isOpen;

        const appt = {
          id: "APT-" + Math.floor(100000 + Math.random() * 900000),
          vehicle: activeVeh,
          services: [...state.booking.selectedServices],
          date: state.booking.date,
          time: state.booking.time,
          mobility: document.querySelector('input[name="mobility_opt"]:checked')?.value || "wait",
          total: calculateBookingTotal(),
          status: isLiveNow ? "in-progress" : "scheduled",
          createdAt: new Date().toISOString()
        };

        state.appointment = appt;
        state.liveDemoMode = false;
        try {
          localStorage.setItem("habesha_active_appt", JSON.stringify(appt));
        } catch (e) {}

        const dateLabel = state.booking.date.fullFormatted || state.booking.date.dow || "Selected Date";
        showToast(`Appointment confirmed for ${dateLabel} at ${state.booking.time}!`, "success");
        state.progress.stepIndex = 0;

        if (state.isAuthenticated && typeof api !== "undefined") {
          api.put("/appointments/current", {
            serviceIdxs: state.booking.selectedServices,
            day: state.booking.date,
            time: state.booking.time,
            stepIndex: isLiveNow ? 0 : -1,
            status: appt.status,
            statusLabel: isLiveNow ? "Bay 3 Active" : "Scheduled",
            basePrice: calculateBookingTotal()
          });
        }

        updateNavBayBadge();
        renderProgress();
        renderHome();
        navigateTo("progress");
      });
    }

    // Toggle live workshop demo simulation from scheduled ticket
    const schedDemoBtn = document.getElementById("sched-demo-btn");
    if (schedDemoBtn) {
      schedDemoBtn.addEventListener("click", () => {
        state.liveDemoMode = true;
        updateNavBayBadge();
        renderProgress();
        showToast("Switched to Live Workshop Simulation Demo Mode.", "info");
      });
    }

    const backToSchedBtn = document.getElementById("btn-back-to-scheduled");
    if (backToSchedBtn) {
      backToSchedBtn.addEventListener("click", () => {
        state.liveDemoMode = false;
        updateNavBayBadge();
        renderProgress();
        showToast("Returned to Scheduled Appointment Ticket.", "info");
      });
    }

    // Demo Simulation Controls
    const simAdvanceBtn = document.getElementById("sim-advance-step-btn");
    if (simAdvanceBtn) {
      simAdvanceBtn.addEventListener("click", () => {
        if (state.progress.stepIndex < SERVICE_STEPS.length - 1) {
          state.progress.stepIndex++;
          renderProgress();
          showToast(`Advanced to Step ${state.progress.stepIndex + 1}: ${SERVICE_STEPS[state.progress.stepIndex].title}`, "info");
        } else {
          showToast("All repair steps completed! Vehicle ready for pickup.", "success");
        }
      });
    }

    const simFindingBtn = document.getElementById("sim-trigger-finding-btn");
    if (simFindingBtn) {
      simFindingBtn.addEventListener("click", () => {
        state.progress.findingApproved = null;
        renderProgress();
        showToast("⚠️ Technician flagged finding (Brake Pad 2mm). Review Required!", "warning");
      });
    }

    // Estimate Approval / Decline
    const approveBtn = document.getElementById("approve-finding-btn");
    if (approveBtn) {
      approveBtn.addEventListener("click", () => {
        state.progress.findingApproved = true;
        renderEstimate();
        renderProgress();
        showToast("Finding approved! $96.00 added to authorization.", "success");
      });
    }

    const declineBtn = document.getElementById("decline-finding-btn");
    if (declineBtn) {
      declineBtn.addEventListener("click", () => {
        state.progress.findingApproved = false;
        renderEstimate();
        renderProgress();
        showToast("Finding declined. Work deferred to your next visit.", "info");
      });
    }

    // Payment method select
    const pmCards = document.querySelectorAll(".pm-card-btn");
    pmCards.forEach(card => {
      card.addEventListener("click", () => {
        pmCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        const method = card.getAttribute("data-pm");
        state.payment.method = method;

        const cardFields = document.getElementById("pm-card-fields");
        if (cardFields) {
          cardFields.style.display = method === "card" ? "block" : "none";
        }

        const payBtn = document.getElementById("complete-payment-btn");
        if (payBtn) {
          let label = "Apple Pay";
          if (method === "card") label = "Card";
          if (method === "zelle") label = "Zelle";
          if (method === "cashapp") label = "Cash App";
          payBtn.innerHTML = `Pay <span id="pay-button-amount">${document.getElementById("pay-button-amount").textContent}</span> with ${label}`;
        }
      });
    });

    const payNowBtn = document.getElementById("complete-payment-btn");
    if (payNowBtn) {
      payNowBtn.addEventListener("click", () => {
        state.payment.isPaid = true;
        showToast("Payment processed successfully! Key locker unlocked.", "success");
        setTimeout(() => navigateTo("keylocker"), 1000);
      });
    }

    // Chat Message Sending
    function sendMessage() {
      const input = document.getElementById("chat-input-box");
      const text = input.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      state.messages.push({ sender: "user", text: text, time: timeStr });
      input.value = "";
      renderMessages();

      if (state.isAuthenticated && typeof api !== "undefined") {
        api.post("/messages", { text: text });
      }

      // Automated tech reply simulation after 1.5s
      setTimeout(() => {
        let reply = "Got your message! We're wrapping up the inspection and will have everything torqued to spec shortly.";
        if (text.toLowerCase().includes("pickup") || text.toLowerCase().includes("ready")) {
          const eta = (window.GeoTime && window.GeoTime.getDynamicETA) ? window.GeoTime.getDynamicETA(state.progress.stepIndex) : "2:45 PM";
          reply = `Your vehicle is on track to be completed by ${eta}. We'll text you when it's parked in the customer bay.`;
        } else if (text.toLowerCase().includes("wiper")) {
          reply = "I just inspected your wipers — rubber is in great shape, no replacement needed today!";
        } else if (text.toLowerCase().includes("pin") || text.toLowerCase().includes("locker")) {
          reply = "Your 24/7 smart key locker PIN is 8492. Locker compartment #14.";
        }

        state.messages.push({ sender: "tech", text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        renderMessages();
      }, 1200);
    }

    const sendBtn = document.getElementById("chat-send-btn");
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    const chatInput = document.getElementById("chat-input-box");
    if (chatInput) {
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
      });
    }

    const quickChips = document.querySelectorAll(".quick-reply-chip");
    quickChips.forEach(chip => {
      chip.addEventListener("click", () => {
        document.getElementById("chat-input-box").value = chip.getAttribute("data-msg");
        sendMessage();
      });
    });

    // ==========================================
    // DYNAMIC MODAL PORTAL & CONDITIONAL MOUNTING
    // ==========================================
    const modalPortal = document.getElementById("modal-portal");

    function mountTemplate(templateId) {
      if (!modalPortal) return null;
      modalPortal.innerHTML = "";
      const tmpl = document.getElementById(templateId);
      if (!tmpl) return null;
      const clone = tmpl.content.cloneNode(true);
      modalPortal.appendChild(clone);
      return modalPortal.firstElementChild;
    }

    function unmountModals() {
      if (modalPortal) modalPortal.innerHTML = "";
      document.body.classList.remove("modal-open");
    }

    // Universal Modal Handlers: Esc Key Dismissal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        unmountModals();
      }
    });

    // ------------------------------------------
    // Garage Modal Handling
    // ------------------------------------------
    const openGarageBtn = document.getElementById("open-garage-modal-btn");
    const navVehSelector = document.getElementById("nav-veh-selector");
    const bookChangeVehBtn = document.getElementById("book-change-veh-btn");

    function openGarage() {
      const garageModal = mountTemplate("garage-modal-template");
      if (!garageModal) return;

      garageModal.style.display = "flex";
      garageModal.removeAttribute("inert");
      garageModal.setAttribute("aria-hidden", "false");
      garageModal.classList.add("active");
      document.body.classList.add("modal-open");

      const closeGarageBtn = document.getElementById("close-garage-modal-btn");
      if (closeGarageBtn) closeGarageBtn.addEventListener("click", closeGarage);

      garageModal.addEventListener("click", (e) => {
        if (e.target === garageModal) closeGarage();
      });

      const addVehForm = document.getElementById("add-vehicle-form");
      if (addVehForm) {
        addVehForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const model = document.getElementById("new-veh-model").value.trim();
          const plate = document.getElementById("new-veh-vin").value.trim() || "NEW-VEH";
          const miles = document.getElementById("new-veh-miles").value.trim() || "12,000";

          if (!model) {
            showToast("Please enter vehicle model", "warning");
            return;
          }

          const newVeh = {
            id: "veh-" + (state.vehicles.length + 1),
            title: model,
            vin: plate.length === 17 ? plate : ("1" + Math.random().toString(36).substring(2, 10).toUpperCase()),
            plate: plate,
            miles: miles,
            health: "Certified Good",
            oilLife: 95,
            brakesMm: "8.0mm (80%)"
          };

          state.vehicles.push(newVeh);
          state.activeVehicleIndex = state.vehicles.length - 1;
          try {
            localStorage.setItem("habesha_custom_vehicles", JSON.stringify(state.vehicles));
          } catch (e) {}

          closeGarage();
          renderHome();
          renderBooking();
          showToast(`${model} added and selected as active vehicle!`, "success");
        });
      }

      renderGarageModal();
      const firstInput = garageModal.querySelector("input, button");
      if (firstInput) setTimeout(() => firstInput.focus(), 50);
    }

    function closeGarage() {
      unmountModals();
    }

    if (openGarageBtn) openGarageBtn.addEventListener("click", openGarage);
    if (navVehSelector) navVehSelector.addEventListener("click", openGarage);
    if (bookChangeVehBtn) bookChangeVehBtn.addEventListener("click", openGarage);

    function renderGarageModal() {
      const container = document.getElementById("modal-garage-vehicles");
      if (!container) return;

      if (!state.vehicles.length) {
        container.innerHTML = `
          <div style="margin-bottom:12px; padding:12px 14px; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; font-size:13.5px; color:#fff; display:flex; align-items:center; gap:8px;">
                2025 Honda CR-V Hybrid <span class="pill pill-demo" style="font-size:10px; padding:2px 6px;">Demo Vehicle</span>
              </div>
              <div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono); margin-top:2px;">
                Plate: EOGA45 &bull; 55,000 miles (Interactive Telemetry)
              </div>
            </div>
            <span class="pill pill-subtle" style="font-size:11px;">Guest Preview</span>
          </div>
          <div style="padding:14px; text-align:center; background:var(--bg-input); border-radius:8px; color:var(--text-secondary); font-size:13px; line-height:1.6; border:1px dashed var(--border-medium);">
            🚗 <strong>Own a different vehicle?</strong> Add it below to track real service, or <button class="btn-link" style="color:var(--accent); text-decoration:underline; background:none; border:none; cursor:pointer; font-weight:600; padding:0;" id="modal-signin-link">Sign In</button> to load your saved garage.
          </div>
        `;
        const link = document.getElementById("modal-signin-link");
        if (link) {
          link.addEventListener("click", () => {
            closeGarage();
            openAuthModal("signin");
          });
        }
        return;
      }

      container.innerHTML = state.vehicles.map((v, idx) => `
        <div class="card" style="padding:14px; background:${idx === state.activeVehicleIndex ? 'var(--bg-elevated)' : 'var(--bg-input)'}; border-color:${idx === state.activeVehicleIndex ? 'var(--accent)' : 'var(--border-subtle)'}; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-idx="${idx}">
          <div>
            <div style="font-weight:700; font-size:14.5px; color:#fff;">${v.title}</div>
            <div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono);">Plate: ${v.plate || 'N/A'} &bull; ${v.miles || 0} miles</div>
          </div>
          ${idx === state.activeVehicleIndex ? '<span class="pill pill-subtle"><span class="status-dot green"></span>Active</span>' : '<button class="btn btn-outline btn-sm">Select</button>'}
        </div>
      `).join("");

      container.querySelectorAll("[data-idx]").forEach(item => {
        item.addEventListener("click", () => {
          state.activeVehicleIndex = parseInt(item.getAttribute("data-idx"));
          closeGarage();
          renderHome();
          renderBooking();
          showToast(`Selected ${state.vehicles[state.activeVehicleIndex].title} for service`, "info");
        });
      });
    }

    // ------------------------------------------
    // AUTHENTICATION & SESSION CONTROLLER
    // ------------------------------------------
    const navAuthBtn = document.getElementById("nav-auth-btn");
    const signinAccountBtn = document.getElementById("signin-account-btn");
    const signoutBtn = document.getElementById("signout-btn");
    let currentForgotEmail = "";

    function openAuthModal(mode = "signin") {
      const authModal = mountTemplate("auth-modal-template");
      if (!authModal) return;

      authModal.style.display = "flex";
      authModal.removeAttribute("inert");
      authModal.setAttribute("aria-hidden", "false");
      authModal.classList.add("active");
      document.body.classList.add("modal-open");

      // Bind close button
      const closeAuthModalBtn = document.getElementById("close-auth-modal-btn");
      if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", closeAuthModal);

      // Bind backdrop click
      authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeAuthModal();
      });

      // Bind tabs
      const tabSigninBtn = document.getElementById("tab-signin-btn");
      const tabSignupBtn = document.getElementById("tab-signup-btn");
      if (tabSigninBtn) tabSigninBtn.addEventListener("click", () => switchAuthTab("signin"));
      if (tabSignupBtn) tabSignupBtn.addEventListener("click", () => switchAuthTab("signup"));

      // Password toggles
      setupPassToggle("toggle-signin-pass", "signin-password");
      setupPassToggle("toggle-signup-pass", "signup-password");
      setupPassToggle("toggle-reset-pass", "reset-new-password");

      // Forgot password link & back buttons
      const linkForgotPassword = document.getElementById("link-forgot-password");
      const btnBackToSignin1 = document.getElementById("btn-back-to-signin-1");
      const btnBackToSignin2 = document.getElementById("btn-back-to-signin-2");
      const btnResendOtp = document.getElementById("btn-resend-otp");
      const demoFillBtn = document.getElementById("auth-fill-demo-btn");

      if (linkForgotPassword) linkForgotPassword.addEventListener("click", () => switchAuthTab("forgot"));
      if (btnBackToSignin1) btnBackToSignin1.addEventListener("click", () => switchAuthTab("signin"));
      if (btnBackToSignin2) btnBackToSignin2.addEventListener("click", () => switchAuthTab("signin"));

      if (demoFillBtn) {
        demoFillBtn.addEventListener("click", () => {
          const emailInput = document.getElementById("signin-email");
          const passInput = document.getElementById("signin-password");
          if (emailInput && passInput) {
            emailInput.value = "ayagirma@gmail.com";
            passInput.value = "";
            passInput.focus();
            showToast("Filled registered account (ayagirma@gmail.com)", "info");
          }
        });
      }

      // Step 1: Send OTP for password reset
      const forgotStep1 = document.getElementById("forgot-step1-form");
      if (forgotStep1) {
        forgotStep1.addEventListener("submit", async (e) => {
          e.preventDefault();
          const email = document.getElementById("forgot-email").value.trim().toLowerCase();
          const sendBtn = document.getElementById("forgot-send-otp-btn");

          if (!email) {
            showAuthError("Please enter your account email address.");
            return;
          }

          const prevText = sendBtn.textContent;
          sendBtn.disabled = true;
          sendBtn.textContent = "Sending Verification Code...";
          hideAuthError();

          const res = await api.post("/auth/forgot-password", { email });
          sendBtn.disabled = false;
          sendBtn.textContent = prevText;

          if (!res.ok) {
            showAuthError(res.data?.error || "Unable to send verification code. Please try again.");
            return;
          }

          currentForgotEmail = email;
          const displayEl = document.getElementById("forgot-target-email-display");
          if (displayEl) displayEl.textContent = email;

          forgotStep1.style.display = "none";
          const forgotStep2 = document.getElementById("forgot-step2-form");
          if (forgotStep2) forgotStep2.style.display = "flex";
          showToast(`Verification code sent to ${email}`, "success");
          const otpInput = document.getElementById("reset-otp-code");
          if (otpInput) {
            otpInput.value = "";
            otpInput.focus();
          }
        });
      }

      // Step 2: Verify OTP & Reset Password
      const forgotStep2 = document.getElementById("forgot-step2-form");
      if (forgotStep2) {
        forgotStep2.addEventListener("submit", async (e) => {
          e.preventDefault();
          const otp = document.getElementById("reset-otp-code").value.trim();
          const newPassword = document.getElementById("reset-new-password").value;
          const confirmPassword = document.getElementById("reset-confirm-password").value;
          const submitBtn = document.getElementById("reset-password-submit-btn");

          if (!otp || otp.length !== 6) {
            showAuthError("Please enter the complete 6-digit code received in your email.");
            return;
          }

          if (!newPassword || newPassword.length < 8) {
            showAuthError("Password must be at least 8 characters long.");
            return;
          }

          if (newPassword !== confirmPassword) {
            showAuthError("Passwords do not match. Please verify both fields.");
            return;
          }

          const prevText = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = "Updating Password...";
          hideAuthError();

          const res = await api.post("/auth/reset-password", {
            email: currentForgotEmail,
            otp,
            newPassword
          });

          submitBtn.disabled = false;
          submitBtn.textContent = prevText;

          if (!res.ok) {
            showAuthError(res.data?.error || "Password reset failed. Check the verification code.");
            return;
          }

          showToast("Password updated successfully! Signing you in...", "success");
          switchAuthTab("signin");
          showAuthSuccess("Your password was successfully reset. You can now sign in.");

          const signinEmail = document.getElementById("signin-email");
          const signinPass = document.getElementById("signin-password");
          if (signinEmail) signinEmail.value = currentForgotEmail;
          if (signinPass) signinPass.value = newPassword;
        });
      }

      if (btnResendOtp) {
        btnResendOtp.addEventListener("click", async () => {
          if (!currentForgotEmail) return;
          btnResendOtp.disabled = true;
          btnResendOtp.textContent = "Sending...";
          const res = await api.post("/auth/forgot-password", { email: currentForgotEmail });
          btnResendOtp.disabled = false;
          btnResendOtp.textContent = "Resend Code";
          if (res.ok) {
            showToast(`New 6-digit code sent to ${currentForgotEmail}`, "info");
          } else {
            showAuthError(res.data?.error || "Failed to resend code.");
          }
        });
      }

      // Sign In Submission
      const signinForm = document.getElementById("signin-form");
      if (signinForm) {
        signinForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const email = document.getElementById("signin-email").value.trim();
          const password = document.getElementById("signin-password").value;
          const submitBtn = document.getElementById("signin-submit-btn");

          if (!email || !password) {
            showAuthError("Please provide both email and password.");
            return;
          }

          const prevText = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = "Signing In...";
          hideAuthError();

          const res = await api.post("/auth/signin", { email, password });
          submitBtn.disabled = false;
          submitBtn.textContent = prevText;

          if (!res.ok) {
            showAuthError(res.data?.error || "Authentication failed. Check your email & password.");
            return;
          }

          state.isAuthenticated = true;
          if (res.data && res.data.user) {
            state.user = {
              name: res.data.user.name,
              email: res.data.user.email,
              phone: res.data.user.phone
            };
          }
          if (res.data && res.data.vehicle) {
            const vehTitle = `${res.data.vehicle.year || ''} ${res.data.vehicle.model || ''}`.trim() || "My Vehicle";
            const rawVin = res.data.vehicle.vin || "";
            const plateStr = rawVin.startsWith("PLATE:") ? rawVin.replace("PLATE:", "") : (res.data.vehicle.plate || "SAVED");
            const displayVin = rawVin || (plateStr ? `Plate: ${plateStr}` : "Pending Bay Scan");

            state.vehicles = [
              {
                id: "veh-main",
                title: vehTitle,
                vin: displayVin,
                plate: plateStr,
                miles: String(res.data.vehicle.miles || "0"),
                health: "Certified Good",
                oilLife: 85,
                brakesMm: "6.0mm"
              }
            ];
            state.activeVehicleIndex = 0;
          }

          closeAuthModal();
          showToast(`Welcome back, ${state.user.name}!`, "success");
          await syncBackendData();
          updateAuthUI();
          renderHome();
          renderAccount();
        });
      }

      // Sign Up Submission
      const signupForm = document.getElementById("signup-form");
      if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const name = document.getElementById("signup-name").value.trim();
          const phone = document.getElementById("signup-phone").value.trim();
          const email = document.getElementById("signup-email").value.trim();
          const password = document.getElementById("signup-password").value;
          const plate = (document.getElementById("signup-plate")?.value || "").trim().toUpperCase();
          const vin = (document.getElementById("signup-vin")?.value || "").trim().toUpperCase();
          const model = document.getElementById("signup-model").value.trim();
          const miles = parseInt(document.getElementById("signup-miles").value, 10) || 0;
          const submitBtn = document.getElementById("signup-submit-btn");

          if (password.length < 8) {
            showAuthError("Password must be at least 8 characters long.");
            return;
          }

          const prevText = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = "Creating Account...";
          hideAuthError();

          const res = await api.post("/auth/signup", {
            name,
            email,
            phone,
            password,
            plate,
            vin,
            year: model.split(" ")[0] || "2022",
            model,
            miles
          });

          submitBtn.disabled = false;
          submitBtn.textContent = prevText;

          if (!res.ok) {
            showAuthError(res.data?.error || "Registration failed. Please check your inputs.");
            return;
          }

          state.isAuthenticated = true;
          if (res.data && res.data.user) {
            state.user = {
              name: res.data.user.name,
              email: res.data.user.email,
              phone: res.data.user.phone
            };
          }
          if (res.data && res.data.vehicle) {
            const vehVin = res.data.vehicle.vin || (plate ? `Plate: ${plate}` : "Pending Bay Scan");
            state.vehicles = [
              {
                id: "veh-main",
                title: `${res.data.vehicle.year || ''} ${res.data.vehicle.model || ''}`.trim() || model,
                vin: vehVin,
                plate: plate || "SAVED",
                miles: String(res.data.vehicle.miles || miles),
                health: "Certified Good",
                oilLife: 95,
                brakesMm: "8.0mm"
              }
            ];
            state.activeVehicleIndex = 0;
          }

          closeAuthModal();
          showToast(`Welcome to Habesha Auto, ${state.user.name}!`, "success");
          await syncBackendData();
          updateAuthUI();
          renderHome();
          renderAccount();
        });
      }

      switchAuthTab(mode);
      const firstInput = authModal.querySelector("input:not([type=hidden]), button.auth-tab-btn");
      if (firstInput) setTimeout(() => firstInput.focus(), 50);
    }

    function closeAuthModal() {
      unmountModals();
    }

    // Modal Event Triggers
    if (navAuthBtn) navAuthBtn.addEventListener("click", () => openAuthModal("signin"));
    if (signinAccountBtn) signinAccountBtn.addEventListener("click", () => openAuthModal("signin"));

    function switchAuthTab(mode) {
      hideAuthError();
      hideAuthSuccess();
      const authTabsContainer = document.getElementById("auth-tabs-container");
      const tabSigninBtn = document.getElementById("tab-signin-btn");
      const tabSignupBtn = document.getElementById("tab-signup-btn");
      const signinForm = document.getElementById("signin-form");
      const signupForm = document.getElementById("signup-form");
      const forgotContainer = document.getElementById("forgot-password-container");
      const forgotStep1 = document.getElementById("forgot-step1-form");
      const forgotStep2 = document.getElementById("forgot-step2-form");
      const authTitle = document.getElementById("auth-modal-title");

      if (mode === "signup") {
        if (authTabsContainer) authTabsContainer.style.display = "flex";
        if (tabSigninBtn) tabSigninBtn.classList.remove("active");
        if (tabSignupBtn) tabSignupBtn.classList.add("active");
        if (signinForm) signinForm.style.display = "none";
        if (signupForm) signupForm.style.display = "flex";
        if (forgotContainer) forgotContainer.style.display = "none";
        if (authTitle) authTitle.textContent = "Create Habesha Auto Account";
      } else if (mode === "forgot") {
        if (authTabsContainer) authTabsContainer.style.display = "none";
        if (signinForm) signinForm.style.display = "none";
        if (signupForm) signupForm.style.display = "none";
        if (forgotContainer) forgotContainer.style.display = "flex";
        if (forgotStep1) forgotStep1.style.display = "flex";
        if (forgotStep2) forgotStep2.style.display = "none";
        if (authTitle) authTitle.textContent = "Reset Account Password";
        const signinEmailVal = document.getElementById("signin-email")?.value;
        const forgotEmailInput = document.getElementById("forgot-email");
        if (forgotEmailInput && signinEmailVal) {
          forgotEmailInput.value = signinEmailVal;
        }
      } else {
        if (authTabsContainer) authTabsContainer.style.display = "flex";
        if (tabSignupBtn) tabSignupBtn.classList.remove("active");
        if (tabSigninBtn) tabSigninBtn.classList.add("active");
        if (signupForm) signupForm.style.display = "none";
        if (forgotContainer) forgotContainer.style.display = "none";
        if (signinForm) signinForm.style.display = "flex";
        if (authTitle) authTitle.textContent = "Sign In to Habesha Auto";
      }
    }

    function showAuthError(msg) {
      const authErrorBanner = document.getElementById("auth-error-banner");
      const authErrorText = document.getElementById("auth-error-text");
      if (!authErrorBanner || !authErrorText) return;
      authErrorText.textContent = msg || "An error occurred";
      authErrorBanner.classList.add("visible");
      hideAuthSuccess();
    }

    function hideAuthError() {
      const authErrorBanner = document.getElementById("auth-error-banner");
      if (!authErrorBanner) return;
      authErrorBanner.classList.remove("visible");
    }

    function showAuthSuccess(msg) {
      const authSuccessBanner = document.getElementById("auth-success-banner");
      const authSuccessText = document.getElementById("auth-success-text");
      if (!authSuccessBanner || !authSuccessText) return;
      authSuccessText.textContent = msg || "Success!";
      authSuccessBanner.style.display = "flex";
      hideAuthError();
    }

    function hideAuthSuccess() {
      const authSuccessBanner = document.getElementById("auth-success-banner");
      if (!authSuccessBanner) return;
      authSuccessBanner.style.display = "none";
    }

    function setupPassToggle(toggleBtnId, inputId) {
      const btn = document.getElementById(toggleBtnId);
      const input = document.getElementById(inputId);
      if (!btn || !input) return;
      btn.addEventListener("click", () => {
        if (input.type === "password") {
          input.type = "text";
          btn.textContent = "🙈";
        } else {
          input.type = "password";
          btn.textContent = "👁️";
        }
      });
    }


    function getUserInitials(name) {
      if (!name) return "U";
      const parts = name.trim().split(" ");
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function updateAuthUI() {
      const navAvatar = document.getElementById("nav-user-avatar");
      const accountAvatar = document.getElementById("account-avatar");
      const accountUserName = document.getElementById("account-user-name");
      const accountUserContact = document.getElementById("account-user-contact");
      const accountAuthBadge = document.getElementById("account-auth-badge");
      const vinDisplay = document.getElementById("account-vin-display");
      const modelDisplay = document.getElementById("account-model-display");
      const milesDisplay = document.getElementById("account-miles-display");

      const initials = getUserInitials(state.user.name);

      const userMenuWrapper = document.querySelector(".user-menu-wrapper");

      if (state.isAuthenticated) {
        if (navAuthBtn) navAuthBtn.style.display = "none";
        if (userMenuWrapper) userMenuWrapper.style.display = "block";
        if (navAvatar) {
          navAvatar.style.display = "flex";
          navAvatar.textContent = initials;
          navAvatar.title = `Signed in as ${state.user.name} — Account Menu`;
        }
        if (accountAuthBadge) {
          accountAuthBadge.className = "auth-badge cloud";
          accountAuthBadge.textContent = "Cloud Synced";
        }
        if (signoutBtn) signoutBtn.style.display = "inline-flex";
        if (signinAccountBtn) signinAccountBtn.style.display = "none";
      } else {
        if (navAuthBtn) navAuthBtn.style.display = "inline-flex";
        if (userMenuWrapper) userMenuWrapper.style.display = "none";
        if (navAvatar) {
          navAvatar.style.display = "none";
        }
        if (accountAuthBadge) {
          accountAuthBadge.className = "auth-badge guest";
          accountAuthBadge.textContent = "Guest / Demo Mode";
        }
        if (signoutBtn) signoutBtn.style.display = "none";
        if (signinAccountBtn) signinAccountBtn.style.display = "inline-flex";
      }

      if (accountAvatar) accountAvatar.textContent = state.isAuthenticated ? initials : "GD";
      if (accountUserName) accountUserName.textContent = state.isAuthenticated ? (state.user.name || "Customer Account") : "Guest Driver";
      if (accountUserContact) {
        accountUserContact.innerHTML = `${state.user.email || 'guest@torqueandco.com'} &bull; ${state.user.phone || '(555) 010-2938'}`;
      }

      const dropdownAvatar = document.getElementById("dropdown-avatar");
      const dropdownUserName = document.getElementById("dropdown-user-name");
      const dropdownUserEmail = document.getElementById("dropdown-user-email");
      const dropdownSigninBtn = document.getElementById("dropdown-signin-btn");
      const dropdownSignoutBtn = document.getElementById("dropdown-signout-btn");

      if (dropdownAvatar) dropdownAvatar.textContent = state.isAuthenticated ? initials : "GD";
      if (dropdownUserName) dropdownUserName.textContent = state.isAuthenticated ? (state.user.name || "Customer Account") : "Guest Driver";
      if (dropdownUserEmail) dropdownUserEmail.textContent = state.isAuthenticated ? (state.user.email || "") : "guest@torqueandco.com (Demo)";
      if (dropdownSigninBtn) dropdownSigninBtn.style.display = state.isAuthenticated ? "none" : "flex";
      if (dropdownSignoutBtn) dropdownSignoutBtn.style.display = state.isAuthenticated ? "flex" : "flex";

      const currentVeh = state.vehicles[state.activeVehicleIndex] || state.vehicles[0];
      if (currentVeh) {
        if (vinDisplay) vinDisplay.textContent = currentVeh.vin || "1HGCM82633A004352";
        if (modelDisplay) modelDisplay.textContent = currentVeh.title || "2021 Honda Accord EX-L";
        if (milesDisplay) milesDisplay.textContent = currentVeh.miles || "62,140";
      }
    }

    async function syncBackendData() {
      if (!state.isAuthenticated || typeof api === "undefined") return;
      try {
        const [apptRes, histRes, msgRes] = await Promise.all([
          api.get("/appointments/current"),
          api.get("/history"),
          api.get("/messages")
        ]);

        if (apptRes.ok && apptRes.data) {
          if (Array.isArray(apptRes.data.serviceIdxs)) {
            state.booking.selectedServices = apptRes.data.serviceIdxs;
          }
          if (typeof apptRes.data.stepIndex === "number" && apptRes.data.stepIndex >= 0) {
            state.progress.stepIndex = apptRes.data.stepIndex;
          }
        }

        if (histRes.ok && Array.isArray(histRes.data) && histRes.data.length > 0) {
          state.history = histRes.data.map(h => ({
            date: h.date || "Recent",
            services: h.service || "Standard Service",
            miles: h.miles || "0",
            total: "$" + Number(h.cost || 0).toFixed(2),
            invoiceId: "INV-" + h.id
          }));
        }

        if (msgRes.ok && Array.isArray(msgRes.data) && msgRes.data.length > 0) {
          state.messages = msgRes.data.map(m => ({
            sender: m.from_role === "customer" ? "user" : "tech",
            text: m.text,
            time: new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        }
      } catch (err) {
        console.warn("Backend sync notice:", err);
      }
    }

    // Modal Event Triggers
    if (navAuthBtn) navAuthBtn.addEventListener("click", () => openAuthModal("signin"));
    if (signinAccountBtn) signinAccountBtn.addEventListener("click", () => openAuthModal("signin"));
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", closeAuthModal);
    if (tabSigninBtn) tabSigninBtn.addEventListener("click", () => switchAuthTab("signin"));
    if (tabSignupBtn) tabSignupBtn.addEventListener("click", () => switchAuthTab("signup"));

    // Demo Autofill Helper (Uses registered driver in DB)
    if (demoFillBtn) {
      demoFillBtn.addEventListener("click", () => {
        const emailInput = document.getElementById("signin-email");
        const passInput = document.getElementById("signin-password");
        if (emailInput && passInput) {
          emailInput.value = "ayagirma@gmail.com";
          passInput.value = "";
          passInput.focus();
          showToast("Filled registered account (ayagirma@gmail.com)", "info");
        }
      });
    }

    // Sign In Submission
    if (signinForm) {
      signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("signin-email").value.trim();
        const password = document.getElementById("signin-password").value;
        const submitBtn = document.getElementById("signin-submit-btn");

        if (!email || !password) {
          showAuthError("Please provide both email and password.");
          return;
        }

        const prevText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing In...";
        hideAuthError();

        const res = await api.post("/auth/signin", { email, password });
        submitBtn.disabled = false;
        submitBtn.textContent = prevText;

        if (!res.ok) {
          showAuthError(res.data?.error || "Authentication failed. Check your email & password.");
          return;
        }

        state.isAuthenticated = true;
        if (res.data && res.data.user) {
          state.user = {
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone
          };
        }
        if (res.data && res.data.vehicle) {
          const vehTitle = `${res.data.vehicle.year || ''} ${res.data.vehicle.model || ''}`.trim() || "My Vehicle";
          const rawVin = res.data.vehicle.vin || "";
          const plateStr = rawVin.startsWith("PLATE:") ? rawVin.replace("PLATE:", "") : (res.data.vehicle.plate || "SAVED");
          const displayVin = rawVin || (plateStr ? `Plate: ${plateStr}` : "Pending Bay Scan");

          state.vehicles = [
            {
              id: "veh-main",
              title: vehTitle,
              vin: displayVin,
              plate: plateStr,
              miles: String(res.data.vehicle.miles || "0"),
              health: "Certified Good",
              oilLife: 85,
              brakesMm: "6.0mm"
            }
          ];
          state.activeVehicleIndex = 0;
        }

        closeAuthModal();
        showToast(`Welcome back, ${state.user.name}!`, "success");
        await syncBackendData();
        updateAuthUI();
        renderHome();
        renderAccount();
      });
    }

    // Sign Up Submission
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signup-name").value.trim();
        const phone = document.getElementById("signup-phone").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;
        const plate = (document.getElementById("signup-plate")?.value || "").trim().toUpperCase();
        const vin = (document.getElementById("signup-vin")?.value || "").trim().toUpperCase();
        const model = document.getElementById("signup-model").value.trim();
        const miles = parseInt(document.getElementById("signup-miles").value, 10) || 0;
        const submitBtn = document.getElementById("signup-submit-btn");

        if (password.length < 8) {
          showAuthError("Password must be at least 8 characters long.");
          return;
        }

        const prevText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating Account...";
        hideAuthError();

        const res = await api.post("/auth/signup", {
          name,
          email,
          phone,
          password,
          plate,
          vin,
          year: model.split(" ")[0] || "2022",
          model,
          miles
        });

        submitBtn.disabled = false;
        submitBtn.textContent = prevText;

        if (!res.ok) {
          showAuthError(res.data?.error || "Registration failed. Please check your inputs.");
          return;
        }

        state.isAuthenticated = true;
        if (res.data && res.data.user) {
          state.user = {
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone
          };
        }
        if (res.data && res.data.vehicle) {
          const vehVin = res.data.vehicle.vin || (plate ? `Plate: ${plate}` : "Pending Bay Scan");
          state.vehicles = [
            {
              id: "veh-main",
              title: `${res.data.vehicle.year || ''} ${res.data.vehicle.model || ''}`.trim() || model,
              vin: vehVin,
              plate: plate || "SAVED",
              miles: String(res.data.vehicle.miles || miles),
              health: "Certified Good",
              oilLife: 95,
              brakesMm: "8.0mm"
            }
          ];
          state.activeVehicleIndex = 0;
        }

        closeAuthModal();
        showToast(`Welcome to Habesha Auto, ${state.user.name}!`, "success");
        await syncBackendData();
        updateAuthUI();
        renderHome();
        renderAccount();
      });
    }

    // Sign Out Handler & Cleanse
    async function handleSignOut() {
      try {
        if (typeof api !== "undefined") {
          await api.post("/auth/logout");
        }
      } catch (err) {
        console.warn("Logout error notice:", err);
      }
      state.isAuthenticated = false;
      state.user = JSON.parse(JSON.stringify(DEFAULT_GUEST_USER));
      state.vehicles = [];
      state.activeVehicleIndex = -1;
      try {
        localStorage.removeItem("habesha_custom_vehicles");
      } catch (e) {}
      state.history = JSON.parse(JSON.stringify(DEFAULT_HISTORY));
      state.messages = JSON.parse(JSON.stringify(DEFAULT_MESSAGES));
      state.progress.stepIndex = 2;
      state.booking.selectedServices = [];
      state.appointment = null;
      state.liveDemoMode = false;
      try {
        localStorage.removeItem("habesha_active_appt");
      } catch (e) {}

      updateAuthUI();
      renderHome();
      renderAccount();
      renderMessages();
      renderProgress();
      showToast("Signed out successfully. Switched to Guest Mode.", "info");
      navigateTo("home");
    }

    if (signoutBtn) {
      signoutBtn.addEventListener("click", handleSignOut);
    }

    // User Header Dropdown Menu Controls
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const dropdownNavAccount = document.getElementById("dropdown-nav-account");
    const dropdownNavGarage = document.getElementById("dropdown-nav-garage");
    const dropdownSigninBtn = document.getElementById("dropdown-signin-btn");
    const dropdownSignoutBtn = document.getElementById("dropdown-signout-btn");

    function closeUserDropdown() {
      if (userDropdownMenu) userDropdownMenu.style.display = "none";
    }

    function toggleUserDropdown(e) {
      if (e) e.stopPropagation();
      if (!userDropdownMenu) return;
      const isShowing = userDropdownMenu.style.display === "block";
      userDropdownMenu.style.display = isShowing ? "none" : "block";
    }

    if (navAvatar) {
      navAvatar.addEventListener("click", toggleUserDropdown);
    }

    document.addEventListener("click", (e) => {
      if (userDropdownMenu && userDropdownMenu.style.display === "block") {
        if (!e.target.closest(".user-menu-wrapper")) {
          closeUserDropdown();
        }
      }
    });

    if (dropdownNavAccount) {
      dropdownNavAccount.addEventListener("click", () => {
        closeUserDropdown();
        navigateTo("account");
      });
    }

    if (dropdownNavGarage) {
      dropdownNavGarage.addEventListener("click", () => {
        closeUserDropdown();
        openGarage();
      });
    }

    if (dropdownSigninBtn) {
      dropdownSigninBtn.addEventListener("click", () => {
        closeUserDropdown();
        openAuthModal("signin");
      });
    }

    if (dropdownSignoutBtn) {
      dropdownSignoutBtn.addEventListener("click", () => {
        closeUserDropdown();
        handleSignOut();
      });
    }

    // Initial Auth Check
    async function checkAuthOnBoot() {
      if (typeof api === "undefined") {
        updateAuthUI();
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (res.ok && res.data && res.data.user) {
          state.isAuthenticated = true;
          state.user = {
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone
          };
          if (res.data.vehicle) {
            const vehTitle = `${res.data.vehicle.year || ''} ${res.data.vehicle.model || ''}`.trim() || "My Vehicle";
            const rawVin = res.data.vehicle.vin || "";
            const plateStr = rawVin.startsWith("PLATE:") ? rawVin.replace("PLATE:", "") : (res.data.vehicle.plate || "SAVED");
            const displayVin = rawVin || (plateStr ? `Plate: ${plateStr}` : "Pending Bay Scan");

            state.vehicles = [
              {
                id: "veh-main",
                title: vehTitle,
                vin: displayVin,
                plate: plateStr,
                miles: String(res.data.vehicle.miles || "0"),
                health: "Certified Good",
                oilLife: 85,
                brakesMm: "6.0mm"
              }
            ];
            state.activeVehicleIndex = 0;
          }
          await syncBackendData();
        } else {
          state.isAuthenticated = false;
        }
      } catch (e) {
        state.isAuthenticated = false;
      }
      updateAuthUI();
    }

    checkAuthOnBoot();
  }

  // ==========================================
  // APP BOOTSTRAP
  // ==========================================
  window.addEventListener("DOMContentLoaded", () => {
    // Bind header live geographic clock
    if (window.GeoTime) {
      const geo = window.GeoTime.detect();
      const tzEl = document.getElementById("nav-geo-tz");
      if (tzEl) tzEl.textContent = `${geo.city} (${geo.abbreviation})`;

      window.GeoTime.bindLiveClock("nav-geo-clock", {
        compact: true,
        showSeconds: false
      });
    }

    initEventListeners();
    if (state.appointment && state.appointment.status === "scheduled" && !state.liveDemoMode) {
      const badgeText = document.getElementById("nav-bay-status-text");
      if (badgeText) {
        const dStr = state.appointment.date.dow || "Scheduled";
        badgeText.textContent = `📅 ${dStr} ${state.appointment.time}`;
      }
    }
    navigateTo("home");
  });

})();
