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
      title: "Front Brake Pads & Rotor Resurfacing",
      urgency: "Urgency: Moderate",
      parts: "$75.00 – $95.00",
      labor: "$100.00 – $130.00",
      total: "$175.00 – $225.00",
      headline: "Squealing or Metallic Grinding Under Braking",
      explanation: "A high-pitched screech indicates the built-in acoustic wear clip is touching the rotor. Should be serviced promptly before rotor gouging occurs."
    },
    "engine": {
      title: "OBD-II Engine Diagnostic & Sensor Triage",
      urgency: "Urgency: High",
      parts: "$35.00 – $65.00",
      labor: "$95.00 – $125.00",
      total: "$130.00 – $190.00",
      headline: "Check Engine Light / Misfire Code (P0300/P0420)",
      explanation: "ECU triggered emission or combustion fault. Scan tool freeze frame analysis required to identify spark plug, ignition coil, or oxygen sensor failure."
    },
    "climate": {
      title: "AC System Vacuum & Freon Recharge",
      urgency: "Urgency: Low",
      parts: "$50.00 – $80.00",
      labor: "$90.00 – $120.00",
      total: "$140.00 – $200.00",
      headline: "AC Blowing Warm or Humidity in Cabin",
      explanation: "Refrigerant pressure is below optimal threshold or cabin filter is obstructed. System requires evacuation, UV dye test, and recharge."
    },
    "suspension": {
      title: "Four-Wheel Alignment & Strut Inspection",
      urgency: "Urgency: Moderate",
      parts: "$25.00 – $45.00",
      labor: "$100.00 – $135.00",
      total: "$125.00 – $180.00",
      headline: "Steering Pulling or Shaking Over 50 MPH",
      explanation: "Camber/toe alignment drift or tire wheel weight imbalance. Alignment machine calibration required to prevent uneven tire tread wear."
    },
    "battery": {
      title: "Battery Cold Cranking Amp Test & Replacement",
      urgency: "Urgency: Immediate",
      parts: "$140.00 – $185.00",
      labor: "$25.00 – $45.00",
      total: "$165.00 – $230.00",
      headline: "Slow Engine Crank or Battery Warning Light",
      explanation: "Alternator charging voltage or battery internal resistance out of spec. 12V test indicates declining reserve capacity."
    }
  };

  // ==========================================
  // APPLICATION STATE DEFAULTS
  // ==========================================
  const DEFAULT_GUEST_USER = {
    name: "Guest Driver",
    email: "guest@torqueandco.com",
    phone: "(555) 010-2938"
  };

  const DEFAULT_VEHICLES = [
    {
      id: "veh-1",
      title: "2021 Honda Accord EX-L",
      vin: "1HGCM82633A004352",
      plate: "7XYZ890",
      miles: "62,140",
      health: "Certified Good",
      oilLife: 82,
      brakesMm: "4.2mm (35%)"
    },
    {
      id: "veh-2",
      title: "2023 Tesla Model Y Long Range",
      vin: "5YJYGDEE8PF829104",
      plate: "9ELC321",
      miles: "18,400",
      health: "Optimal",
      oilLife: 100,
      brakesMm: "9.0mm (85%)"
    }
  ];

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
    vehicles: JSON.parse(JSON.stringify(DEFAULT_VEHICLES)),
    activeVehicleIndex: 0,
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
    const activeVeh = state.vehicles[state.activeVehicleIndex];
    if (activeVeh) {
      const vinStr = activeVeh.vin || "Pending Bay Scan";
      const displayVin = vinStr.startsWith("PLATE:") ? vinStr : `VIN: ${vinStr}`;
      const navVin = document.getElementById("nav-veh-vin");
      const navName = document.getElementById("nav-veh-name");
      const dashTitle = document.getElementById("dash-veh-title");
      const dashVin = document.getElementById("dash-veh-vin");

      if (navName) navName.textContent = activeVeh.title || "My Vehicle";
      if (navVin) navVin.textContent = vinStr.startsWith("PLATE:") ? vinStr : (vinStr.length > 12 ? `VIN: ${vinStr.slice(0, 10)}...` : vinStr);
      if (dashTitle) dashTitle.textContent = activeVeh.title || "My Vehicle";
      if (dashVin) dashVin.textContent = `${displayVin} • ${activeVeh.miles || 0} miles`;
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
  // RENDER: BOOKING FLOW
  // ==========================================
  function calculateBookingTotal() {
    return state.booking.selectedServices.reduce((sum, id) => {
      const s = SERVICES.find(x => x.id === id);
      return sum + (s ? s.price : 0);
    }, 0);
  }

  function renderBooking() {
    const activeVeh = state.vehicles[state.activeVehicleIndex];
    if (activeVeh) {
      document.getElementById("book-veh-title").textContent = activeVeh.title;
      document.getElementById("book-veh-vin").textContent = `VIN: ${activeVeh.vin} • ${activeVeh.miles} miles`;
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
    document.getElementById("book-selected-count").textContent = `${state.booking.selectedServices.length} Selected`;
    document.getElementById("book-total-preview").textContent = `$${total.toFixed(2)}`;

    // Update timezone indicator badge
    const tzBadge = document.getElementById("book-tz-badge");
    if (tzBadge && window.GeoTime) {
      const geo = window.GeoTime.detect();
      tzBadge.textContent = `Timezone: ${geo.city} (${geo.abbreviation})`;
    }

    // Dates (Next 7 days dynamically generated from user's local calendar)
    const dateContainer = document.getElementById("book-date-row");
    if (dateContainer) {
      const dates = (window.GeoTime && window.GeoTime.getBookingDays) ? window.GeoTime.getBookingDays(7) : [];
      
      // If current booking date is missing or closed, select first open day
      if (!state.booking.date || state.booking.date.isClosed) {
        const firstOpen = dates.find(d => !d.isClosed) || dates[0];
        if (firstOpen) {
          state.booking.date = firstOpen;
        }
      }

      dateContainer.innerHTML = dates.map((d, idx) => {
        const isSel = state.booking.date && (d.num === state.booking.date.num && d.month === state.booking.date.month);
        const closedStyle = d.isClosed ? 'style="opacity:0.45; cursor:not-allowed;" title="Closed on Sundays"' : '';
        return `
          <div class="date-pill-btn ${isSel ? 'selected' : ''}" data-idx="${idx}" ${closedStyle}>
            <span style="font-size:11px; text-transform:uppercase;">${d.isToday ? 'Today' : d.dow}</span>
            <span class="font-mono" style="font-size:18px; font-weight:700;">${d.num}</span>
            <span style="font-size:10px; opacity:0.8;">${d.isClosed ? 'Closed' : d.month}</span>
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
          state.booking.date = selectedDay;
          const validSlots = selectedDay.slots && selectedDay.slots.length ? selectedDay.slots : ["8:00 AM", "10:00 AM", "1:00 PM", "3:00 PM"];
          if (!validSlots.includes(state.booking.time)) {
            state.booking.time = validSlots[0] || "8:00 AM";
          }
          renderBooking();
        });
      });
    }

    // Time Slots for the selected date
    const timeContainer = document.getElementById("book-time-grid");
    if (timeContainer) {
      const activeSlots = (state.booking.date && state.booking.date.slots) 
        ? state.booking.date.slots 
        : (window.GeoTime ? window.GeoTime.getTimeSlotsForDay(state.booking.date ? state.booking.date.dayOfWeek : 1) : ["8:00 AM", "10:00 AM", "1:00 PM", "3:00 PM"]);

      if (!activeSlots || activeSlots.length === 0) {
        timeContainer.innerHTML = `
          <div style="grid-column: 1 / -1; padding:16px; text-align:center; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; color:#fca5a5;">
            ⚠️ Facility is closed on this day. Please choose a Monday through Saturday slot.
          </div>
        `;
      } else {
        timeContainer.innerHTML = activeSlots.map(t => `
          <div class="time-slot-btn ${t === state.booking.time ? 'selected' : ''}" data-time="${t}">
            ${t}
          </div>
        `).join("");

        timeContainer.querySelectorAll(".time-slot-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            state.booking.time = btn.getAttribute("data-time");
            renderBooking();
          });
        });
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

    const base = calculateBookingTotal() || (appt ? appt.total : 89.00);
    const extra = state.progress.findingApproved ? state.progress.findingPrice : 0;
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
  }

  // ==========================================
  // RENDER: ESTIMATE APPROVAL
  // ==========================================
  function renderEstimate() {
    const base = calculateBookingTotal();
    const extra = state.progress.findingPrice;
    const decisionDiv = document.getElementById("estimate-decision-status");
    const actionsDiv = document.getElementById("estimate-action-buttons");
    const totalEl = document.getElementById("estimate-recalculated-total");

    if (state.progress.findingApproved === true) {
      totalEl.textContent = `$${(base + extra).toFixed(2)}`;
      actionsDiv.style.display = "none";
      decisionDiv.style.display = "block";
      decisionDiv.innerHTML = `<span class="pill pill-success" style="font-size:14px; padding:8px 16px;">✅ Approved by you ($96.00 added to invoice)</span>`;
    } else if (state.progress.findingApproved === false) {
      totalEl.textContent = `$${base.toFixed(2)}`;
      actionsDiv.style.display = "none";
      decisionDiv.style.display = "block";
      decisionDiv.innerHTML = `<span class="pill pill-warning" style="font-size:14px; padding:8px 16px;">⚠️ Declined & deferred to next service</span>`;
    } else {
      totalEl.textContent = `$${base.toFixed(2)} (or $${(base + extra).toFixed(2)} if approved)`;
      actionsDiv.style.display = "flex";
      decisionDiv.style.display = "none";
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
  // RENDER: 24/7 SMART KEY LOCKER (DROP-OFF & PICKUP)
  // ==========================================
  function renderKeyLocker() {
    const isPickup = Boolean(state.payment && state.payment.isPaid);
    const badgeEl = document.querySelector(".key-locker-card .pill");
    const titleEl = document.querySelector('[data-screen="keylocker"] h1');
    const eyebrowEl = document.querySelector('[data-screen="keylocker"] .eyebrow');
    const descEl = document.querySelector(".key-locker-card p");

    if (isPickup) {
      if (eyebrowEl) eyebrowEl.textContent = "Contactless Vehicle Pickup";
      if (titleEl) titleEl.textContent = "24/7 Smart Key Pickup Locker";
      if (badgeEl) {
        badgeEl.textContent = "Vehicle Ready in Slot A-4 • Key in Compartment #14";
        badgeEl.className = "pill pill-good";
      }
      if (descEl) {
        descEl.innerHTML = "Your service invoice is paid! Scan this QR code or type <strong>8492</strong> on the illuminated electronic locker box next to Bay 1 to unlock compartment <strong>#14</strong> and retrieve your key fob for after-hours pickup.";
      }
    } else {
      if (eyebrowEl) eyebrowEl.textContent = "Contactless Shop Access";
      if (titleEl) titleEl.textContent = "24/7 Smart Key Drop-Off Locker";
      if (badgeEl) {
        badgeEl.textContent = "Locker Compartment #14 Assigned";
        badgeEl.className = "pill pill-good";
      }
      if (descEl) {
        descEl.innerHTML = "Scan this QR code or type <strong>8492</strong> on the illuminated electronic locker box next to Bay 1. Place your key fob inside and close the door.";
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
        sysTabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const sys = btn.getAttribute("data-system");
        const data = SYMPTOM_DATABASE[sys] || SYMPTOM_DATABASE["brakes"];

        document.getElementById("diag-headline").textContent = data.headline;
        document.getElementById("diag-explanation").textContent = data.explanation;
        document.getElementById("diag-service-name").textContent = data.title;
        document.getElementById("diag-parts").textContent = data.parts;
        document.getElementById("diag-labor").textContent = data.labor;
        document.getElementById("diag-total").textContent = data.total;
      });
    });

    const obdBtn = document.getElementById("obd-lookup-btn");
    if (obdBtn) {
      obdBtn.addEventListener("click", () => {
        const code = document.getElementById("obd-input").value.trim().toUpperCase();
        if (!code) {
          showToast("Please enter an OBD-II code (e.g. P0420)", "warning");
          return;
        }
        showToast(`Diagnosing code ${code}: Catalytic System Efficiency Fault`, "info");
        document.getElementById("diag-headline").textContent = `OBD-II Code ${code} Diagnostic`;
        document.getElementById("diag-explanation").textContent = `Code ${code} indicates bank 1 sensor correlation drift or catalytic converter threshold loss. Live sensor graph & vacuum leak test recommended.`;
        document.getElementById("diag-service-name").textContent = "OBD-II Code Live Stream Diagnostic";
        document.getElementById("diag-parts").textContent = "$0.00 – $45.00";
        document.getElementById("diag-labor").textContent = "$95.00 – $120.00";
        document.getElementById("diag-total").textContent = "$95.00 – $165.00";
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

        const isToday = Boolean(state.booking.date && state.booking.date.isToday);
        const shop = window.GeoTime ? window.GeoTime.isShopOpen() : { isOpen: true };
        const isLiveNow = isToday && shop.isOpen;

        const appt = {
          id: "APT-" + Math.floor(100000 + Math.random() * 900000),
          vehicle: state.vehicles[state.activeVehicleIndex] || state.vehicles[0],
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
        navigateTo("estimate");
        showToast("New inspection issue flagged by technician!", "warning");
      });
    }

    // Estimate Approval / Decline
    const approveBtn = document.getElementById("approve-finding-btn");
    if (approveBtn) {
      approveBtn.addEventListener("click", () => {
        state.progress.findingApproved = true;
        renderEstimate();
        showToast("Finding approved! $96.00 added to authorization.", "success");
      });
    }

    const declineBtn = document.getElementById("decline-finding-btn");
    if (declineBtn) {
      declineBtn.addEventListener("click", () => {
        state.progress.findingApproved = false;
        renderEstimate();
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

    // Garage Modal Handling
    const garageModal = document.getElementById("garage-modal");
    const openGarageBtn = document.getElementById("open-garage-modal-btn");
    const navVehSelector = document.getElementById("nav-veh-selector");
    const closeGarageBtn = document.getElementById("close-garage-modal-btn");

    function openGarage() {
      renderGarageModal();
      garageModal.classList.add("active");
    }
    function closeGarage() {
      garageModal.classList.remove("active");
    }

    if (openGarageBtn) openGarageBtn.addEventListener("click", openGarage);
    if (navVehSelector) navVehSelector.addEventListener("click", openGarage);
    if (closeGarageBtn) closeGarageBtn.addEventListener("click", closeGarage);

    function renderGarageModal() {
      const container = document.getElementById("modal-garage-vehicles");
      if (!container) return;

      container.innerHTML = state.vehicles.map((v, idx) => `
        <div class="card" style="padding:14px; background:${idx === state.activeVehicleIndex ? 'var(--bg-elevated)' : 'var(--bg-input)'}; border-color:${idx === state.activeVehicleIndex ? 'var(--accent)' : 'var(--border-subtle)'}; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-idx="${idx}">
          <div>
            <div style="font-weight:700; font-size:14.5px; color:#fff;">${v.title}</div>
            <div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono);">Plate: ${v.plate} &bull; ${v.miles} miles</div>
          </div>
          ${idx === state.activeVehicleIndex ? '<span class="pill pill-accent">Active</span>' : '<button class="btn btn-outline btn-sm">Select</button>'}
        </div>
      `).join("");

      container.querySelectorAll("[data-idx]").forEach(item => {
        item.addEventListener("click", () => {
          state.activeVehicleIndex = parseInt(item.getAttribute("data-idx"));
          closeGarage();
          renderHome();
          showToast(`Switched active garage vehicle to ${state.vehicles[state.activeVehicleIndex].title}`, "info");
        });
      });
    }

    const addVehForm = document.getElementById("add-vehicle-form");
    if (addVehForm) {
      addVehForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const model = document.getElementById("new-veh-model").value;
        const plate = document.getElementById("new-veh-vin").value || "NEW-VEH";
        const miles = document.getElementById("new-veh-miles").value || "12,000";

        state.vehicles.push({
          id: "veh-" + (state.vehicles.length + 1),
          title: model,
          vin: "1" + Math.random().toString(36).substring(2, 18).toUpperCase(),
          plate: plate,
          miles: miles,
          health: "Certified Good",
          oilLife: 95,
          brakesMm: "8.0mm (80%)"
        });

        state.activeVehicleIndex = state.vehicles.length - 1;
        closeGarage();
        renderHome();
        showToast(`${model} added to your digital garage!`, "success");
        addVehForm.reset();
      });
    }

    // ==========================================
    // AUTHENTICATION & SESSION CONTROLLER
    // ==========================================
    const authModal = document.getElementById("auth-modal");
    const signinForm = document.getElementById("signin-form");
    const signupForm = document.getElementById("signup-form");
    const tabSigninBtn = document.getElementById("tab-signin-btn");
    const tabSignupBtn = document.getElementById("tab-signup-btn");
    const authTitle = document.getElementById("auth-modal-title");
    const authErrorBanner = document.getElementById("auth-error-banner");
    const authErrorText = document.getElementById("auth-error-text");
    const closeAuthModalBtn = document.getElementById("close-auth-modal-btn");
    const navAuthBtn = document.getElementById("nav-auth-btn");
    const signinAccountBtn = document.getElementById("signin-account-btn");
    const signoutBtn = document.getElementById("signout-btn");
    const forgotContainer = document.getElementById("forgot-password-container");
    const forgotStep1 = document.getElementById("forgot-step1-form");
    const forgotStep2 = document.getElementById("forgot-step2-form");
    const authTabsContainer = document.getElementById("auth-tabs-container");
    const authSuccessBanner = document.getElementById("auth-success-banner");
    const authSuccessText = document.getElementById("auth-success-text");
    const linkForgotPassword = document.getElementById("link-forgot-password");
    const btnBackToSignin1 = document.getElementById("btn-back-to-signin-1");
    const btnBackToSignin2 = document.getElementById("btn-back-to-signin-2");
    const btnResendOtp = document.getElementById("btn-resend-otp");

    let currentForgotEmail = "";

    function openAuthModal(mode = "signin") {
      if (!authModal) return;
      hideAuthError();
      hideAuthSuccess();
      switchAuthTab(mode);
      authModal.classList.add("active");
    }

    function closeAuthModal() {
      if (!authModal) return;
      authModal.classList.remove("active");
      hideAuthError();
      hideAuthSuccess();
    }

    function switchAuthTab(mode) {
      hideAuthError();
      hideAuthSuccess();
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
      if (!authErrorBanner || !authErrorText) return;
      authErrorText.textContent = msg || "An error occurred";
      authErrorBanner.classList.add("visible");
      hideAuthSuccess();
    }

    function hideAuthError() {
      if (!authErrorBanner) return;
      authErrorBanner.classList.remove("visible");
    }

    function showAuthSuccess(msg) {
      if (!authSuccessBanner || !authSuccessText) return;
      authSuccessText.textContent = msg || "Success!";
      authSuccessBanner.style.display = "flex";
      hideAuthError();
    }

    function hideAuthSuccess() {
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

    setupPassToggle("toggle-signin-pass", "signin-password");
    setupPassToggle("toggle-signup-pass", "signup-password");
    setupPassToggle("toggle-reset-pass", "reset-new-password");

    if (linkForgotPassword) {
      linkForgotPassword.addEventListener("click", () => switchAuthTab("forgot"));
    }
    if (btnBackToSignin1) {
      btnBackToSignin1.addEventListener("click", () => switchAuthTab("signin"));
    }
    if (btnBackToSignin2) {
      btnBackToSignin2.addEventListener("click", () => switchAuthTab("signin"));
    }

    // Step 1: Send OTP for password reset
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
        forgotStep2.style.display = "flex";
        showToast(`Verification code sent to ${email}`, "success");
        const otpInput = document.getElementById("reset-otp-code");
        if (otpInput) {
          otpInput.value = "";
          otpInput.focus();
        }
      });
    }

    // Step 2: Verify OTP & Reset Password
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

    // Resend OTP
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

      if (state.isAuthenticated) {
        if (navAuthBtn) navAuthBtn.style.display = "none";
        if (navAvatar) {
          navAvatar.style.display = "flex";
          navAvatar.textContent = initials;
          navAvatar.title = `Signed in as ${state.user.name} — Account Passport`;
        }
        if (accountAuthBadge) {
          accountAuthBadge.className = "auth-badge cloud";
          accountAuthBadge.textContent = "Cloud Synced";
        }
        if (signoutBtn) signoutBtn.style.display = "inline-flex";
        if (signinAccountBtn) signinAccountBtn.style.display = "none";
      } else {
        if (navAuthBtn) navAuthBtn.style.display = "inline-flex";
        if (navAvatar) {
          navAvatar.style.display = "flex";
          navAvatar.textContent = "GD";
          navAvatar.title = "Guest Driver — View Vehicle Passport & Records";
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
      state.vehicles = JSON.parse(JSON.stringify(DEFAULT_VEHICLES));
      state.activeVehicleIndex = 0;
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
