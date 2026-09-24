/**
 * TORQUE & CO — UNIFIED STAFF CONTROLLER
 * Role-based authentication & dynamic routing for Managers and Technicians.
 */

(function () {
  "use strict";

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

  let staffUser = null;
  let bays = [];
  let technicians = [];
  let pendingStaff = [];
  let findings = [];
  let queue = [];
  let activeBayId = "bay-3";

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
  // ROUTING & VIEW CONTROLLER
  // ==========================================
  function switchView(viewName) {
    document.getElementById("view-staff-auth").style.display = "none";
    document.getElementById("view-staff-pending").style.display = "none";
    document.getElementById("view-manager-dashboard").style.display = "none";
    document.getElementById("view-tech-terminal").style.display = "none";

    const signOutBtn = document.getElementById("btn-staff-signout");
    const managerSwitcher = document.getElementById("manager-role-switcher");
    const adminRoleBadge = document.getElementById("admin-role-badge");
    const adminLogoBadge = document.getElementById("admin-logo-badge");
    const adminSubTitle = document.getElementById("admin-sub-title");
    const adminUserName = document.getElementById("admin-user-name");

    if (viewName === "auth") {
      document.getElementById("view-staff-auth").style.display = "flex";
      if (signOutBtn) signOutBtn.style.display = "none";
      if (managerSwitcher) managerSwitcher.style.display = "none";
      if (adminRoleBadge) {
        adminRoleBadge.className = "pill pill-warn";
        adminRoleBadge.textContent = "Sign In Required";
      }
      if (adminUserName) adminUserName.textContent = "Staff Gateway";
      return;
    }

    if (signOutBtn) signOutBtn.style.display = "inline-flex";

    if (viewName === "pending") {
      document.getElementById("view-staff-pending").style.display = "flex";
      if (managerSwitcher) managerSwitcher.style.display = "none";
      if (adminRoleBadge) {
        adminRoleBadge.className = "pill pill-warn";
        adminRoleBadge.textContent = "Pending Clearance";
      }
      if (adminUserName) adminUserName.textContent = staffUser ? staffUser.name : "Technician Applicant";
      return;
    }

    if (viewName === "manager") {
      document.getElementById("view-manager-dashboard").style.display = "block";
      if (managerSwitcher) managerSwitcher.style.display = "flex";
      if (adminRoleBadge) {
        adminRoleBadge.className = "pill pill-good";
        adminRoleBadge.textContent = "Shop Manager / Foreman";
      }
      if (adminLogoBadge) adminLogoBadge.style.background = "linear-gradient(135deg,#3B82F6,#1D4ED8)";
      if (adminSubTitle) adminSubTitle.textContent = "OPERATIONS &bull; MANAGERIAL COCKPIT";
      if (adminUserName) adminUserName.textContent = staffUser ? staffUser.name : "Girma Ayele";
      fetchManagerData();
      return;
    }

    if (viewName === "tech") {
      document.getElementById("view-tech-terminal").style.display = "block";
      if (managerSwitcher) managerSwitcher.style.display = (staffUser && staffUser.role === "manager") ? "flex" : "none";
      if (adminRoleBadge) {
        adminRoleBadge.className = "pill pill-accent";
        adminRoleBadge.textContent = "Lead Bay Technician";
      }
      if (adminLogoBadge) adminLogoBadge.style.background = "linear-gradient(135deg,#FF5A1F,#C83800)";
      if (adminSubTitle) adminSubTitle.textContent = "BAY TERMINAL &bull; STAFF CONSOLE";
      if (adminUserName) adminUserName.textContent = staffUser ? staffUser.name : "Marcus Vance";
      fetchTechData();
      return;
    }
  }

  // ==========================================
  // FETCH MANAGERIAL DATA
  // ==========================================
  async function fetchManagerData() {
    try {
      const [bayRes, techRes, pStaffRes, findRes] = await Promise.all([
        api.get("/tech/bays"),
        api.get("/manager/technicians"),
        api.get("/manager/pending-staff"),
        api.get("/manager/findings")
      ]);

      if (bayRes.ok && Array.isArray(bayRes.data)) bays = bayRes.data;
      if (techRes.ok && Array.isArray(techRes.data)) technicians = techRes.data;
      if (pStaffRes.ok && Array.isArray(pStaffRes.data)) pendingStaff = pStaffRes.data;
      if (findRes.ok && Array.isArray(findRes.data)) findings = findRes.data;
    } catch (e) {
      console.warn("Using fallback manager data", e);
    }

    renderManagerPendingStaff();
    renderManagerBays();
    renderManagerFindings();
    renderManagerTechs();
  }

  function renderManagerPendingStaff() {
    const list = document.getElementById("mgr-pending-staff-list");
    const count = document.getElementById("mgr-pending-count");
    const card = document.getElementById("mgr-pending-staff-card");
    if (!list) return;

    if (count) count.textContent = `${pendingStaff.length} Pending`;

    if (pendingStaff.length === 0) {
      if (card) card.style.display = "none";
      return;
    }

    if (card) card.style.display = "block";
    list.innerHTML = pendingStaff.map(p => `
      <div style="background:var(--bg-input); border:1px solid var(--border-subtle); padding:12px 14px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <strong style="font-size:14px; color:#fff;">${p.name}</strong>
          <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
            ${p.email} &bull; ${p.phone} &bull; Spec: <span style="color:var(--accent);">${p.specialization}</span>
          </div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Registered at ${p.registeredAt}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary btn-sm btn-approve-tech" data-id="${p.id}" style="font-size:11.5px; padding:6px 12px;">
            &#x2714; Approve &amp; Assign Bay
          </button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".btn-approve-tech").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await api.put(`/manager/pending-staff/${id}/approve`, { assignedBay: "Bay 4 (EV/Align)" });
        showToast("Technician badge approved! Added to active workshop floor roster.", "success");
        fetchManagerData();
      });
    });
  }

  function renderManagerBays() {
    const container = document.getElementById("mgr-bays-grid");
    if (!container) return;

    container.innerHTML = bays.map(bay => {
      const isVacant = bay.status === "available";
      const hasFinding = bay.finding && bay.finding.customerStatus === "pending";
      const pct = isVacant ? 0 : Math.round(((bay.currentStep + 1) / 5) * 100);

      return `
        <div class="manager-bay-card ${hasFinding ? 'has-alert' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="eyebrow" style="margin-bottom:0;">${bay.bayName.split('(')[0]}</span>
              <h3 style="font-size:15.5px; color:#fff; margin-top:2px;">
                ${bay.vehicle ? bay.vehicle.title : 'Bay Available'}
              </h3>
            </div>
            ${isVacant ? `<span class="pill pill-good">Open</span>` : `<span class="pill pill-accent">Step ${bay.currentStep + 1}/5</span>`}
          </div>

          <div style="margin:4px 0;">
            <div style="display:flex; justify-content:space-between; font-size:11.5px; color:var(--text-muted); margin-bottom:4px;">
              <span>Progress</span>
              <span class="font-mono">${pct}%</span>
            </div>
            <div class="gauge-bar-track">
              <div class="gauge-bar-fill good" style="width:${pct}%"></div>
            </div>
          </div>

          ${isVacant ? `
            <div style="font-size:12px; color:var(--text-secondary);">Lead: <strong>${bay.techName}</strong></div>
          ` : `
            <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); font-size:12px;">
              <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                <span>${bay.customer ? bay.customer.name : 'Customer'}</span>
                <span class="font-mono" style="color:var(--accent);">${bay.vehicle ? bay.vehicle.plate : ''}</span>
              </div>
              <div style="color:var(--text-secondary); margin-top:2px; font-size:11.5px;">
                Tech: <strong>${bay.techName}</strong> &bull; ETA: <strong class="font-mono" style="color:#34d399;">${bay.service ? ((window.GeoTime && window.GeoTime.getDynamicETA) ? window.GeoTime.getDynamicETA(bay.currentStep) : bay.service.estimatedCompletion) : 'Ready'}</strong>
              </div>
            </div>
          `}

          <button class="btn btn-outline btn-sm btn-full btn-inspect-bay" data-bay="${bay.bayId}" style="margin-top:auto; font-size:11.5px;">
            Inspect Bay Terminal &rarr;
          </button>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-inspect-bay").forEach(btn => {
      btn.addEventListener("click", () => {
        activeBayId = btn.getAttribute("data-bay");
        switchView("tech");
      });
    });
  }

  function renderManagerFindings() {
    const container = document.getElementById("mgr-findings-list");
    if (!container) return;

    if (findings.length === 0) {
      container.innerHTML = `<div style="font-size:13px; color:var(--text-muted); text-align:center; padding:16px;">No findings pending manager review.</div>`;
      return;
    }

    container.innerHTML = findings.map(f => `
      <div style="background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="font-size:14px; color:#fff;">${f.title}</strong>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
              ${f.vehicleTitle} &bull; Customer: <strong>${f.customerName}</strong>
            </div>
          </div>
          <span class="pill pill-warn">$${f.totalCost.toFixed(2)}</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 10px;">${f.notes}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:8px; font-size:11.5px;">
          <span style="color:var(--text-muted);">Tech: <strong>${f.techName}</strong></span>
          <button class="btn btn-primary btn-sm btn-approve-fnd" data-id="${f.id}" style="font-size:11px; padding:4px 10px;">
            &#x2714; Sign-off &amp; Dispatch
          </button>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-approve-fnd").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await api.put(`/manager/findings/${id}/action`, { action: "approve" });
        showToast("Finding vetted & dispatched to customer app!", "success");
        fetchManagerData();
      });
    });
  }

  function renderManagerTechs() {
    const container = document.getElementById("mgr-techs-list");
    if (!container) return;

    container.innerHTML = technicians.map(t => `
      <div style="background:var(--bg-input); border:1px solid var(--border-subtle); padding:10px 12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:13.5px; color:#fff;">${t.name}</div>
          <div style="font-size:11.5px; color:var(--text-muted);">${t.role}</div>
          <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">Assigned: <strong style="color:var(--accent);">${t.assignedBay}</strong></div>
        </div>
        <div style="text-align:right;">
          <div class="font-mono" style="font-weight:700; font-size:13px; color:#34d399;">${t.efficiency}</div>
          <div style="font-size:11px; color:var(--text-muted);">${t.jobsCompletedToday} Done</div>
        </div>
      </div>
    `).join("");
  }

  // ==========================================
  // FETCH TECHNICIAN TERMINAL DATA
  // ==========================================
  async function fetchTechData() {
    try {
      const res = await api.get("/tech/bays");
      if (res.ok && Array.isArray(res.data)) bays = res.data;
    } catch (e) {
      console.warn("Using fallback bays state", e);
    }
    renderTechBaySelector();
    renderTechActiveBay();
  }

  function renderTechBaySelector() {
    const container = document.getElementById("tech-bay-chips");
    if (!container) return;

    container.innerHTML = bays.map(b => {
      const isSelected = b.bayId === activeBayId;
      return `
        <button class="bay-card-btn ${isSelected ? 'active' : ''}" data-bay="${b.bayId}" style="padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:13px; color:#fff;">${b.bayName.split('(')[0]}</strong>
            <span class="pill pill-${b.status === 'available' ? 'good' : 'accent'}" style="font-size:10px;">${b.status === 'available' ? 'Open' : `Step ${b.currentStep+1}/5`}</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-secondary); margin-top:4px;">${b.vehicle ? b.vehicle.title : 'Ready'}</div>
        </button>
      `;
    }).join("");

    container.querySelectorAll("[data-bay]").forEach(btn => {
      btn.addEventListener("click", () => {
        activeBayId = btn.getAttribute("data-bay");
        renderTechBaySelector();
        renderTechActiveBay();
      });
    });
  }

  function renderTechActiveBay() {
    const bay = bays.find(b => b.bayId === activeBayId);
    if (!bay) return;

    const heading = document.getElementById("tech-active-bay-heading");
    const bayLabel = document.getElementById("tech-wo-bay-label");
    const vehTitle = document.getElementById("tech-wo-vehicle-title");
    const plate = document.getElementById("tech-wo-plate");
    const vin = document.getElementById("tech-wo-vin");
    const miles = document.getElementById("tech-wo-miles");
    const service = document.getElementById("tech-wo-service");
    const eta = document.getElementById("tech-wo-eta");

    if (heading) heading.textContent = `${bay.bayName.split('(')[0]} • Work Order`;
    if (bayLabel) bayLabel.textContent = bay.bayName;
    if (vehTitle) vehTitle.textContent = bay.vehicle ? bay.vehicle.title : "Bay Available";
    if (plate) plate.textContent = bay.vehicle ? bay.vehicle.plate : "N/A";
    if (vin) vin.textContent = bay.vehicle ? bay.vehicle.vin : "PENDING-SCAN";
    if (miles) miles.textContent = bay.vehicle ? `${bay.vehicle.miles} miles` : "";
    const dynamicEta = (window.GeoTime && window.GeoTime.getDynamicETA)
      ? window.GeoTime.getDynamicETA(bay.currentStep)
      : (bay.service ? bay.service.estimatedCompletion : "Ready");
    if (eta) eta.textContent = bay.service ? `${dynamicEta} (On Track)` : "Ready";

    // Checklist
    const stepsList = document.getElementById("tech-steps-list");
    const currentSteps = getServiceSteps(bay.currentStep);
    if (stepsList) {
      stepsList.innerHTML = currentSteps.map((step, idx) => {
        const isDone = idx < bay.currentStep;
        const isCurrent = (idx === bay.currentStep) && bay.currentStep < currentSteps.length;
        return `
          <div class="tech-step-item ${isDone ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
            <div class="step-number-badge">${isDone ? '&#x2714;' : idx + 1}</div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="font-size:14px; color:#fff; font-weight:700;">${step.title}</h4>
                <span class="font-mono" style="font-size:11px; color:var(--text-muted);">${step.time}</span>
              </div>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${step.desc}</p>
            </div>
            <div>
              ${isCurrent ? `
                <button class="btn btn-primary btn-sm btn-advance-tech-step" data-step="${idx + 1}" style="font-size:11px; padding:5px 10px;">
                  Complete &rarr;
                </button>
              ` : (isDone ? `<span style="color:#34d399; font-size:11px; font-weight:700;">Done</span>` : '')}
            </div>
          </div>
        `;
      }).join("");

      stepsList.querySelectorAll(".btn-advance-tech-step").forEach(btn => {
        btn.addEventListener("click", async () => {
          const next = parseInt(btn.getAttribute("data-step"), 10);
          if (next >= 0 && next <= currentSteps.length) {
            bay.currentStep = next;
            if (next >= currentSteps.length) {
              bay.status = "completed";
            }
            await api.put(`/tech/bays/${bay.bayId}/step`, { stepIndex: next });
            renderTechActiveBay();
            renderTechBaySelector();
            if (next >= currentSteps.length) {
              showToast("🎉 Final Quality Check verified! Work Order Completed.", "success");
            } else {
              showToast(`Advanced to Step ${next + 1}: ${SERVICE_STEPS[next].title}`, "success");
            }
          }
        });
      });
    }

    // Finding Card
    const fndCard = document.getElementById("tech-finding-card");
    const fndTitle = document.getElementById("tech-fnd-title");
    const fndDesc = document.getElementById("tech-fnd-desc");
    const fndCost = document.getElementById("tech-fnd-cost");

    if (bay.finding) {
      if (fndCard) fndCard.style.display = "block";
      if (fndTitle) fndTitle.textContent = bay.finding.title;
      if (fndDesc) fndDesc.textContent = bay.finding.explanation;
      if (fndCost) fndCost.textContent = `$${bay.finding.totalCost.toFixed(2)}`;
    } else {
      if (fndCard) fndCard.style.display = "none";
    }

    // Customer
    const cAvatar = document.getElementById("tech-cust-avatar");
    const cName = document.getElementById("tech-cust-name");
    const cPhone = document.getElementById("tech-cust-phone");
    const cCallBtn = document.getElementById("tech-call-btn");

    if (bay.customer) {
      if (cAvatar) cAvatar.textContent = bay.customer.name.split(" ").map(n=>n[0]).join("");
      if (cName) cName.textContent = bay.customer.name;
      if (cPhone) cPhone.textContent = bay.customer.phone;
      if (cCallBtn) cCallBtn.href = `tel:${bay.customer.phone.replace(/[^0-9]/g, '')}`;
    }

    // History
    const histList = document.getElementById("tech-past-history");
    if (histList) {
      if (!bay.history || bay.history.length === 0) {
        histList.innerHTML = `<div style="font-size:11.5px; color:var(--text-muted);">No prior records.</div>`;
      } else {
        histList.innerHTML = bay.history.map(h => `
          <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); font-size:11.5px;">
            <div style="font-weight:700; color:#fff;">${h.service}</div>
            <div style="color:var(--accent); font-size:11px;">${h.date} &bull; ${h.miles} miles</div>
          </div>
        `).join("");
      }
    }
  }

  // ==========================================
  // INITIALIZATION & EVENT LISTENERS
  // ==========================================
  function initEventListeners() {
    // Tabs in Auth view
    const tabSignin = document.getElementById("tab-staff-signin");
    const tabSignup = document.getElementById("tab-staff-signup");
    const signinForm = document.getElementById("staff-signin-form");
    const signupForm = document.getElementById("staff-signup-form");
    const staffForgotContainer = document.getElementById("staff-forgot-container");
    const staffForgotStep1 = document.getElementById("staff-forgot-step1");
    const staffForgotStep2 = document.getElementById("staff-forgot-step2");
    const staffAuthTabs = document.getElementById("staff-auth-tabs");
    const linkStaffForgot = document.getElementById("staff-link-forgot-password");
    const btnStaffBack1 = document.getElementById("staff-forgot-back-btn");
    const btnStaffBack2 = document.getElementById("staff-reset-back-btn");

    let currentStaffForgotEmail = "";

    function setupStaffPassToggle(btnId, inputId) {
      const btn = document.getElementById(btnId);
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

    setupStaffPassToggle("staff-toggle-signin-pass", "staff-signin-password");
    setupStaffPassToggle("staff-toggle-reg-pass", "staff-reg-password");

    function showStaffAuthTab(mode) {
      if (mode === "signup") {
        if (staffAuthTabs) staffAuthTabs.style.display = "flex";
        if (tabSignin) tabSignin.classList.remove("active");
        if (tabSignup) tabSignup.classList.add("active");
        if (signinForm) signinForm.style.display = "none";
        if (signupForm) signupForm.style.display = "flex";
        if (staffForgotContainer) staffForgotContainer.style.display = "none";
      } else if (mode === "forgot") {
        if (staffAuthTabs) staffAuthTabs.style.display = "none";
        if (signinForm) signinForm.style.display = "none";
        if (signupForm) signupForm.style.display = "none";
        if (staffForgotContainer) staffForgotContainer.style.display = "flex";
        if (staffForgotStep1) staffForgotStep1.style.display = "flex";
        if (staffForgotStep2) staffForgotStep2.style.display = "none";
        const emailVal = document.getElementById("staff-signin-email")?.value;
        const forgotInput = document.getElementById("staff-forgot-email");
        if (forgotInput && emailVal) forgotInput.value = emailVal;
      } else {
        if (staffAuthTabs) staffAuthTabs.style.display = "flex";
        if (tabSignup) tabSignup.classList.remove("active");
        if (tabSignin) tabSignin.classList.add("active");
        if (signupForm) signupForm.style.display = "none";
        if (staffForgotContainer) staffForgotContainer.style.display = "none";
        if (signinForm) signinForm.style.display = "flex";
      }
    }

    if (tabSignin) tabSignin.addEventListener("click", () => showStaffAuthTab("signin"));
    if (tabSignup) tabSignup.addEventListener("click", () => showStaffAuthTab("signup"));
    if (linkStaffForgot) linkStaffForgot.addEventListener("click", () => showStaffAuthTab("forgot"));
    if (btnStaffBack1) btnStaffBack1.addEventListener("click", () => showStaffAuthTab("signin"));
    if (btnStaffBack2) btnStaffBack2.addEventListener("click", () => showStaffAuthTab("signin"));

    // Staff Forgot Step 1: Send OTP
    if (staffForgotStep1) {
      staffForgotStep1.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("staff-forgot-email").value.trim().toLowerCase();
        const sendBtn = document.getElementById("staff-forgot-send-btn");

        if (!email) {
          showToast("Enter your staff email address.", "error");
          return;
        }

        const prevText = sendBtn.textContent;
        sendBtn.disabled = true;
        sendBtn.textContent = "Sending Code...";

        const res = await api.post("/auth/forgot-password", { email });
        sendBtn.disabled = false;
        sendBtn.textContent = prevText;

        if (!res.ok) {
          showToast(res.data?.error || "Failed to dispatch reset code.", "error");
          return;
        }

        currentStaffForgotEmail = email;
        const displayEl = document.getElementById("staff-forgot-target-email");
        if (displayEl) displayEl.textContent = email;

        staffForgotStep1.style.display = "none";
        staffForgotStep2.style.display = "flex";
        showToast(`6-digit OTP code sent to ${email}`, "success");
      });
    }

    // Staff Forgot Step 2: Reset Password
    if (staffForgotStep2) {
      staffForgotStep2.addEventListener("submit", async (e) => {
        e.preventDefault();
        const otp = document.getElementById("staff-otp-code").value.trim();
        const newPassword = document.getElementById("staff-reset-password").value;
        const submitBtn = document.getElementById("staff-reset-submit-btn");

        if (!otp || otp.length !== 6) {
          showToast("Enter the 6-digit code sent to your email.", "error");
          return;
        }

        if (!newPassword || newPassword.length < 8) {
          showToast("Password must be at least 8 characters long.", "error");
          return;
        }

        const prevText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Updating Password...";

        const res = await api.post("/auth/reset-password", {
          email: currentStaffForgotEmail,
          otp,
          newPassword
        });

        submitBtn.disabled = false;
        submitBtn.textContent = prevText;

        if (!res.ok) {
          showToast(res.data?.error || "Reset failed. Verify the code and retry.", "error");
          return;
        }

        showToast("Staff password reset successfully!", "success");
        showStaffAuthTab("signin");
        const signinEmail = document.getElementById("staff-signin-email");
        const signinPass = document.getElementById("staff-signin-password");
        if (signinEmail) signinEmail.value = currentStaffForgotEmail;
        if (signinPass) signinPass.value = newPassword;
      });
    }


    // 1-Click Demo Logins
    const btnQuickMgr = document.getElementById("btn-quick-login-manager");
    const btnQuickTech = document.getElementById("btn-quick-login-tech");

    if (btnQuickMgr) {
      btnQuickMgr.addEventListener("click", () => {
        staffUser = {
          name: "Girma Ayele",
          email: "girma.ayele@habeshaauto.com",
          role: "manager",
          status: "active"
        };
        showToast("Logged in as Shop Manager (Girma Ayele)", "success");
        switchView("manager");
      });
    }

    if (btnQuickTech) {
      btnQuickTech.addEventListener("click", () => {
        staffUser = {
          name: "Marcus Vance",
          email: "marcus.vance@torque.com",
          role: "technician",
          status: "active"
        };
        showToast("Logged in as Lead Technician (Marcus Vance)", "success");
        switchView("tech");
      });
    }

    // Sign in submission
    if (signinForm) {
      signinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("staff-signin-email").value.trim().toLowerCase();

        if (email.includes("tech") || email.includes("marcus")) {
          staffUser = { name: "Marcus Vance", email, role: "technician", status: "active" };
          showToast("Welcome back, Marcus!", "success");
          switchView("tech");
        } else {
          staffUser = { name: "Girma Ayele", email, role: "manager", status: "active" };
          showToast("Welcome back, Manager Girma!", "success");
          switchView("manager");
        }
      });
    }

    // Sign up submission
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("staff-reg-name").value.trim();
        const email = document.getElementById("staff-reg-email").value.trim();
        const phone = document.getElementById("staff-reg-phone").value.trim();
        const role = document.getElementById("staff-reg-role").value;
        const specialization = document.getElementById("staff-reg-spec").value.trim();

        const res = await api.post("/manager/register-staff", {
          name,
          email,
          phone,
          role,
          specialization
        });

        if (res.ok && res.data) {
          staffUser = res.data.user;
          if (res.data.status === "pending_approval") {
            const applicantName = document.getElementById("pending-applicant-name");
            if (applicantName) applicantName.textContent = name;
            showToast("Technician registration submitted for Manager clearance.", "info");
            switchView("pending");
          } else {
            showToast("Manager account created!", "success");
            switchView("manager");
          }
        }
      });
    }

    // Pending Clearance Demo Simulation
    const btnSimApprove = document.getElementById("btn-simulate-manager-approve");
    if (btnSimApprove) {
      btnSimApprove.addEventListener("click", () => {
        if (staffUser) staffUser.status = "active";
        showToast("Technician badge clearance approved by Foreman!", "success");
        switchView("tech");
      });
    }

    // Manager View Switchers
    const btnSwitchMgr = document.getElementById("btn-switch-manager-view");
    const btnSwitchTech = document.getElementById("btn-switch-tech-view");

    if (btnSwitchMgr) {
      btnSwitchMgr.addEventListener("click", () => {
        btnSwitchMgr.classList.add("active");
        if (btnSwitchTech) btnSwitchTech.classList.remove("active");
        switchView("manager");
      });
    }

    if (btnSwitchTech) {
      btnSwitchTech.addEventListener("click", () => {
        btnSwitchTech.classList.add("active");
        if (btnSwitchMgr) btnSwitchMgr.classList.remove("active");
        switchView("tech");
      });
    }

    // Sign Out
    const signoutBtn = document.getElementById("btn-staff-signout");
    const pendingSignoutBtn = document.getElementById("btn-pending-signout");

    function doSignOut() {
      staffUser = null;
      showToast("Signed out of staff console.", "info");
      switchView("auth");
    }

    if (signoutBtn) signoutBtn.addEventListener("click", doSignOut);
    if (pendingSignoutBtn) pendingSignoutBtn.addEventListener("click", doSignOut);

    // Scan VIN Modal in Tech View
    const scanModal = document.getElementById("admin-scan-vin-modal");
    const openScanBtn = document.getElementById("btn-tech-scan-vin");
    const closeScanBtn = document.getElementById("close-admin-scan-modal-btn");
    const autoScanBtn = document.getElementById("btn-admin-auto-scan");
    const scanForm = document.getElementById("admin-scan-vin-form");

    if (openScanBtn) openScanBtn.addEventListener("click", () => scanModal.classList.add("active"));
    if (closeScanBtn) closeScanBtn.addEventListener("click", () => scanModal.classList.remove("active"));

    if (autoScanBtn) {
      autoScanBtn.addEventListener("click", () => {
        document.getElementById("admin-vin-input").value = "1HGCM82633A004352";
        showToast("ECU scan verified 17-digit VIN.", "success");
      });
    }

    if (scanForm) {
      scanForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const vin = document.getElementById("admin-vin-input").value.trim().toUpperCase();
        await api.put(`/tech/bays/${activeBayId}/vin`, { vin });
        scanModal.classList.remove("active");
        showToast(`VIN ${vin} logged and verified!`, "success");
        fetchTechData();
      });
    }
  }

  // BOOTSTRAP
  window.addEventListener("DOMContentLoaded", () => {
    // Live Clock
    if (window.GeoTime) {
      window.GeoTime.bindLiveClock("admin-live-clock");
    }

    initEventListeners();
    // Default to manager demo or auth view
    staffUser = {
      name: "Girma Ayele",
      email: "girma.ayele@habeshaauto.com",
      role: "manager",
      status: "active"
    };
    switchView("manager");
  });

})();
