/**
 * TORQUE & CO — MANAGERIAL OPERATIONS CONTROLLER
 * Oversees shop telemetry, bay utilization, finding approvals, walk-in admissions, and technician roster.
 */

(function () {
  "use strict";

  let kpis = {};
  let bays = [];
  let technicians = [];
  let queue = [];
  let findings = [];

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
  // FETCH ALL MANAGERIAL DATA
  // ==========================================
  async function fetchAllData() {
    try {
      const [kpiRes, bayRes, techRes, queueRes, findRes] = await Promise.all([
        api.get("/manager/kpis"),
        api.get("/tech/bays"),
        api.get("/manager/technicians"),
        api.get("/manager/queue"),
        api.get("/manager/findings")
      ]);

      if (kpiRes.ok && kpiRes.data) kpis = kpiRes.data;
      if (bayRes.ok && Array.isArray(bayRes.data)) bays = bayRes.data;
      if (techRes.ok && Array.isArray(techRes.data)) technicians = techRes.data;
      if (queueRes.ok && Array.isArray(queueRes.data)) queue = queueRes.data;
      if (findRes.ok && Array.isArray(findRes.data)) findings = findRes.data;
    } catch (e) {
      console.warn("Using local manager data state", e);
    }

    renderKPIs();
    renderBays();
    renderFindings();
    renderQueue();
    renderTechnicians();
  }

  // ==========================================
  // RENDER KPIS
  // ==========================================
  function renderKPIs() {
    const revEl = document.getElementById("kpi-rev");
    const projEl = document.getElementById("kpi-proj");
    const utilEl = document.getElementById("kpi-util");
    const appEl = document.getElementById("kpi-approval");
    const turnEl = document.getElementById("kpi-turnaround");
    const compEl = document.getElementById("kpi-completed");

    if (revEl) revEl.textContent = `$${(kpis.todayRevenue || 1485).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (projEl) projEl.textContent = `$${(kpis.projectedRevenue || 2190).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (utilEl) utilEl.textContent = kpis.activeBayUtilization || "75%";
    if (appEl) appEl.textContent = kpis.findingApprovalRate || "88%";
    if (turnEl) turnEl.textContent = `${kpis.avgTurnaroundMins || 52} min`;
    if (compEl) compEl.textContent = `${kpis.carsCompletedToday || 6} Cars`;
  }

  // ==========================================
  // RENDER BAYS MASTER GRID
  // ==========================================
  function renderBays() {
    const container = document.getElementById("manager-bays-grid");
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
              <h3 style="font-size:16px; color:#fff; margin-top:2px;">
                ${bay.vehicle ? bay.vehicle.title : 'Bay Available'}
              </h3>
            </div>
            ${isVacant ? `<span class="pill pill-good">Open Bay</span>` : `<span class="pill pill-accent">Step ${bay.currentStep + 1}/5</span>`}
          </div>

          <!-- Progress Bar -->
          <div style="margin:4px 0;">
            <div style="display:flex; justify-content:space-between; font-size:11.5px; color:var(--text-muted); margin-bottom:4px;">
              <span>Repair Progress</span>
              <span class="font-mono">${pct}%</span>
            </div>
            <div class="gauge-bar-track">
              <div class="gauge-bar-fill good" style="width:${pct}%"></div>
            </div>
          </div>

          ${isVacant ? `
            <div style="font-size:12px; color:var(--text-secondary);">
              Assigned Lead: <strong>${bay.techName}</strong>
            </div>
            <button class="btn btn-outline btn-sm btn-full btn-assign-walkin" data-bay="${bay.bayId}" style="margin-top:auto; font-size:12px;">
              + Assign Next Intake
            </button>
          ` : `
            <div style="background:var(--bg-input); padding:10px; border-radius:var(--radius-sm); font-size:12px;">
              <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                <span>Customer: <strong style="color:#fff;">${bay.customer ? bay.customer.name : 'Customer'}</strong></span>
                <span class="font-mono" style="color:var(--accent);">${bay.vehicle ? bay.vehicle.plate : ''}</span>
              </div>
              <div style="color:var(--text-secondary); margin-top:4px; font-size:11.5px;">
                Tech: <strong>${bay.techName}</strong> &bull; ETA: <strong class="font-mono" style="color:#34d399;">${bay.service ? ((window.GeoTime && window.GeoTime.getDynamicETA) ? window.GeoTime.getDynamicETA(bay.currentStep) : bay.service.estimatedCompletion) : 'Ready'}</strong>
              </div>
            </div>

            ${hasFinding ? `
              <div style="background:rgba(255, 90, 31, 0.1); border:1px solid rgba(255, 90, 31, 0.3); border-radius:var(--radius-sm); padding:8px 10px; font-size:11.5px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--accent); font-weight:600;">&#x26A0; $${bay.finding.totalCost.toFixed(2)} Finding Pending Approval</span>
                <a href="tel:${bay.customer ? bay.customer.phone.replace(/[^0-9]/g, '') : ''}" class="btn btn-primary btn-sm" style="font-size:10.5px; padding:3px 8px;">Call</a>
              </div>
            ` : ''}
          `}
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-assign-walkin").forEach(btn => {
      btn.addEventListener("click", () => {
        const bayId = btn.getAttribute("data-bay");
        const select = document.getElementById("admit-bay");
        if (select) select.value = bayId;
        openAdmitModal();
      });
    });
  }

  // ==========================================
  // RENDER FINDINGS GATEKEEPER QUEUE
  // ==========================================
  function renderFindings() {
    const container = document.getElementById("manager-findings-list");
    const countBadge = document.getElementById("pending-findings-count");
    if (!container) return;

    if (countBadge) countBadge.textContent = `${findings.length} Action Item${findings.length === 1 ? '' : 's'}`;

    if (findings.length === 0) {
      container.innerHTML = `<div style="font-size:13px; color:var(--text-muted); text-align:center; padding:20px;">No findings pending manager review.</div>`;
      return;
    }

    container.innerHTML = findings.map(f => `
      <div style="background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div>
            <strong style="font-size:14.5px; color:#fff;">${f.title}</strong>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
              ${f.vehicleTitle} &bull; Customer: <strong>${f.customerName}</strong>
            </div>
          </div>
          <span class="pill pill-warn" style="font-size:11px;">$${f.totalCost.toFixed(2)}</span>
        </div>

        <p style="font-size:12.5px; color:var(--text-secondary); margin:6px 0 10px; line-height:1.4;">
          ${f.notes}
        </p>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:10px; font-size:12px;">
          <span style="color:var(--text-muted);">Tech: <strong>${f.techName}</strong></span>
          <div style="display:flex; gap:8px;">
            <a href="tel:5550102938" class="btn btn-outline btn-sm" style="font-size:11px; padding:4px 10px;">
              &#x1F4DE; Direct Call
            </a>
            <button class="btn btn-primary btn-sm btn-approve-finding" data-id="${f.id}" style="font-size:11px; padding:4px 10px;">
              &#x2714; Sign-off &amp; Dispatch
            </button>
          </div>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-approve-finding").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await api.put(`/manager/findings/${id}/action`, { action: "approve" });
        showToast("Finding vetted & dispatched to customer with 1-click authorization!", "success");
        fetchAllData();
      });
    });
  }

  // ==========================================
  // RENDER INTAKE QUEUE
  // ==========================================
  function renderQueue() {
    const container = document.getElementById("manager-queue-list");
    if (!container) return;

    if (queue.length === 0) {
      container.innerHTML = `<div style="font-size:13px; color:var(--text-muted); text-align:center; padding:16px;">Queue clear — no pending drop-offs.</div>`;
      return;
    }

    container.innerHTML = queue.map(q => `
      <div style="background:var(--bg-input); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:13.5px; color:#fff;">${q.vehicle}</div>
          <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
            ${q.customerName} &bull; Plate: <span class="font-mono">${q.plate}</span>
          </div>
          <div style="font-size:11.5px; color:var(--accent); margin-top:2px;">${q.service}</div>
        </div>
        <div style="text-align:right;">
          <div class="pill pill-good" style="font-size:11px; margin-bottom:6px;">${q.scheduledTime}</div>
          <button class="btn btn-primary btn-sm btn-admit-queue-item" data-plate="${q.plate}" style="font-size:11px; padding:4px 10px;">
            Admit &rarr;
          </button>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-admit-queue-item").forEach(btn => {
      btn.addEventListener("click", async () => {
        const plate = btn.getAttribute("data-plate");
        const item = queue.find(q => q.plate === plate);
        if (item) {
          await api.post("/manager/admit", {
            customerName: item.customerName,
            phone: item.phone,
            vehicle: item.vehicle,
            plate: item.plate,
            service: item.service,
            bayId: "bay-4"
          });
          showToast(`Admitted ${item.vehicle} into Bay 4!`, "success");
          fetchAllData();
        }
      });
    });
  }

  // ==========================================
  // RENDER TECHNICIAN ROSTER
  // ==========================================
  function renderTechnicians() {
    const container = document.getElementById("manager-techs-list");
    if (!container) return;

    container.innerHTML = technicians.map(t => `
      <div style="background:var(--bg-input); border:1px solid var(--border-subtle); padding:12px 14px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:var(--accent-soft); display:flex; align-items:center; justify-content:center; color:var(--accent); font-weight:700; font-size:14px;">
            ${t.name.split(" ").map(n=>n[0]).join("")}
          </div>
          <div>
            <div style="font-weight:700; font-size:13.5px; color:#fff;">${t.name}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">${t.role}</div>
            <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">Assigned: <strong style="color:var(--accent);">${t.assignedBay}</strong></div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="font-mono" style="font-weight:700; font-size:14px; color:#34d399;">${t.efficiency} Eff.</div>
          <div style="font-size:11px; color:var(--text-muted);">${t.jobsCompletedToday} Finished Today</div>
        </div>
      </div>
    `).join("");
  }

  // ==========================================
  // MODAL & EVENT CONTROLS
  // ==========================================
  const admitModal = document.getElementById("admit-modal");
  const openAdmitBtn = document.getElementById("btn-open-admit-modal");
  const closeAdmitBtn = document.getElementById("close-admit-modal-btn");
  const admitForm = document.getElementById("admit-form");
  const refreshBtn = document.getElementById("btn-refresh-manager");

  function openAdmitModal() {
    if (admitModal) admitModal.classList.add("active");
  }
  function closeAdmitModal() {
    if (admitModal) admitModal.classList.remove("active");
  }

  if (openAdmitBtn) openAdmitBtn.addEventListener("click", openAdmitModal);
  if (closeAdmitBtn) closeAdmitBtn.addEventListener("click", closeAdmitModal);
  if (refreshBtn) refreshBtn.addEventListener("click", () => {
    fetchAllData();
    showToast("Synced live shop floor telemetry.", "info");
  });

  if (admitForm) {
    admitForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const customerName = document.getElementById("admit-name").value.trim();
      const phone = document.getElementById("admit-phone").value.trim();
      const vehicle = document.getElementById("admit-vehicle").value.trim();
      const plate = document.getElementById("admit-plate").value.trim().toUpperCase();
      const bayId = document.getElementById("admit-bay").value;
      const service = document.getElementById("admit-service").value.trim();

      await api.post("/manager/admit", {
        customerName,
        phone,
        vehicle,
        plate,
        bayId,
        service
      });

      closeAdmitModal();
      showToast(`Admitted ${vehicle} into ${bayId.toUpperCase()}!`, "success");
      admitForm.reset();
      fetchAllData();
    });
  }

  // Clock
  const clockEl = document.getElementById("manager-clock");
  if (clockEl && window.GeoTime) {
    window.GeoTime.bindLiveClock("manager-clock");
  } else if (clockEl) {
    setInterval(() => {
      clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " • Today";
    }, 1000);
  }

  // BOOTSTRAP
  window.addEventListener("DOMContentLoaded", () => {
    fetchAllData();
    setInterval(fetchAllData, 12000);
  });

})();
