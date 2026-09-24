/**
 * TORQUE & CO — TECHNICIAN WORKSHOP CONTROLLER
 * Controls bay status, step execution, VIN intake scanning, finding dispatch, and customer direct call protocols.
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

  let bays = [];
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
  // FETCH & SYNC BAYS
  // ==========================================
  async function fetchBays() {
    try {
      const res = await api.get("/tech/bays");
      if (res.ok && Array.isArray(res.data)) {
        bays = res.data;
      }
    } catch (e) {
      console.warn("Using local bay state", e);
    }
    renderBaySelector();
    renderActiveBay();
  }

  // ==========================================
  // RENDER 4-BAY QUICK SELECTOR
  // ==========================================
  function renderBaySelector() {
    const container = document.getElementById("bay-selector-grid");
    if (!container) return;

    container.innerHTML = bays.map(b => {
      const isSelected = b.bayId === activeBayId;
      const isVacant = b.status === "available";

      let statusBadge = `<span class="pill pill-good">Active (${b.currentStep + 1}/5)</span>`;
      if (isVacant) statusBadge = `<span class="pill pill-accent">Open Bay</span>`;
      if (b.finding && b.finding.customerStatus === "pending") {
        statusBadge = `<span class="pill pill-warn">&#x26A0; Finding Pending</span>`;
      }

      return `
        <button class="bay-card-btn ${isSelected ? 'active' : ''}" data-bay-id="${b.bayId}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:14.5px; color:#fff;">${b.bayName.split('(')[0]}</strong>
            ${statusBadge}
          </div>
          ${isVacant ? `
            <div style="font-size:12.5px; color:var(--text-muted);">Assigned Tech: ${b.techName}</div>
            <div style="font-size:12px; color:#34d399; margin-top:4px;">Available for Next Booking</div>
          ` : `
            <div style="font-weight:700; font-size:13.5px; color:#fff;">${b.vehicle ? b.vehicle.title : 'Vehicle In Bay'}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
              ${b.vehicle ? `Plate: ${b.vehicle.plate}` : ''} &bull; Tech: ${b.techName}
            </div>
          `}
        </button>
      `;
    }).join("");

    container.querySelectorAll("[data-bay-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        activeBayId = btn.getAttribute("data-bay-id");
        renderBaySelector();
        renderActiveBay();
      });
    });
  }

  // ==========================================
  // RENDER ACTIVE BAY DETAILS
  // ==========================================
  function renderActiveBay() {
    const bay = bays.find(b => b.bayId === activeBayId);
    if (!bay) return;

    // Header update
    const techLogged = document.getElementById("tech-logged-name");
    if (techLogged) techLogged.textContent = `${bay.techName} (${bay.bayName.split('(')[0].trim()})`;

    // Vehicle Info
    const bayLabel = document.getElementById("wo-bay-label");
    const vehTitle = document.getElementById("wo-vehicle-title");
    const plateDisplay = document.getElementById("wo-plate-display");
    const vinDisplay = document.getElementById("wo-vin-display");
    const milesDisplay = document.getElementById("wo-miles-display");
    const serviceName = document.getElementById("wo-service-name");
    const etaDisplay = document.getElementById("wo-eta-display");

    if (bayLabel) bayLabel.textContent = bay.bayName;
    if (vehTitle) vehTitle.textContent = bay.vehicle ? bay.vehicle.title : "Bay Available";
    if (plateDisplay) plateDisplay.textContent = bay.vehicle ? bay.vehicle.plate : "N/A";
    if (vinDisplay) vinDisplay.textContent = bay.vehicle ? (bay.vehicle.vin || "PENDING-SCAN") : "N/A";
    if (milesDisplay) milesDisplay.textContent = bay.vehicle ? `${bay.vehicle.miles} miles` : "";
    if (serviceName) serviceName.textContent = bay.service ? bay.service.name : "No active work order";
    const dynamicEta = (window.GeoTime && window.GeoTime.getDynamicETA) 
      ? window.GeoTime.getDynamicETA(bay.currentStep)
      : (bay.service ? bay.service.estimatedCompletion : "2:45 PM");

    if (etaDisplay) etaDisplay.textContent = bay.service ? `${dynamicEta} (On Track)` : "Ready";

    const cutoffText = document.getElementById("wo-protocol-cutoff-text");
    if (cutoffText) {
      cutoffText.textContent = `If customer does not answer or reply before the ${dynamicEta} completion cutoff, proceed to complete original booked services only. 100% transparency — no unauthorized additions.`;
    }

    // Step-by-step checklist
    const stepsContainer = document.getElementById("tech-steps-container");
    const progressPill = document.getElementById("wo-step-progress-pill");
    const currentSteps = getServiceSteps(bay.currentStep);

    if (progressPill) {
      progressPill.textContent = `Step ${bay.currentStep + 1} of ${currentSteps.length} In Progress`;
    }

    if (stepsContainer) {
      stepsContainer.innerHTML = currentSteps.map((step, idx) => {
        const isDone = idx < bay.currentStep;
        const isCurrent = (idx === bay.currentStep) && bay.currentStep < currentSteps.length;
        let statusClass = "";
        if (isDone) statusClass = "completed";
        if (isCurrent) statusClass = "active";

        return `
          <div class="tech-step-item ${statusClass}">
            <div class="step-number-badge">${isDone ? '&#x2714;' : idx + 1}</div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="font-size:14.5px; color:#fff; font-weight:700;">${step.title}</h4>
                <span class="font-mono" style="font-size:11.5px; color:var(--text-muted);">${step.time}</span>
              </div>
              <p style="font-size:12.5px; color:var(--text-secondary); margin-top:2px; line-height:1.4;">${step.desc}</p>
            </div>
            <div>
              ${isCurrent ? `
                <button class="btn btn-primary btn-sm btn-advance-step" data-step="${idx + 1}" style="font-size:11.5px; padding:6px 12px;">
                  Complete &amp; Advance &rarr;
                </button>
              ` : (isDone ? `
                <span style="font-size:11.5px; color:#34d399; font-weight:600;">Completed</span>
              ` : `
                <button class="btn btn-ghost btn-sm btn-advance-step" data-step="${idx}" style="font-size:11px; padding:4px 8px; color:var(--text-muted);">
                  Jump Here
                </button>
              `)}
            </div>
          </div>
        `;
      }).join("");

      stepsContainer.querySelectorAll(".btn-advance-step").forEach(btn => {
        btn.addEventListener("click", async () => {
          const nextStep = parseInt(btn.getAttribute("data-step"), 10);
          if (nextStep >= 0 && nextStep <= currentSteps.length) {
            bay.currentStep = nextStep;
            if (nextStep >= currentSteps.length) {
              bay.status = "completed";
            }
            await api.put(`/tech/bays/${bay.bayId}/step`, { stepIndex: nextStep });
            renderActiveBay();
            renderBaySelector();
            if (nextStep >= currentSteps.length) {
              showToast("🎉 Final Quality Check passed! Vehicle ready for customer handover.", "success");
            } else {
              showToast(`Bay advanced to Step ${nextStep + 1}: ${SERVICE_STEPS[nextStep].title}`, "success");
            }
          }
        });
      });
    }

    // Customer info & direct call
    const custAvatar = document.getElementById("wo-cust-avatar");
    const custName = document.getElementById("wo-cust-name");
    const custPhone = document.getElementById("wo-cust-phone");
    const custEmail = document.getElementById("wo-cust-email");
    const custPhoneBtn = document.getElementById("wo-cust-phone-btn");
    const callTelLink = document.getElementById("wo-call-tel-link");

    if (bay.customer) {
      if (custAvatar) custAvatar.textContent = bay.customer.name.split(" ").map(n=>n[0]).join("");
      if (custName) custName.textContent = bay.customer.name;
      if (custPhone) custPhone.textContent = bay.customer.phone;
      if (custEmail) custEmail.textContent = bay.customer.email;
      if (custPhoneBtn) custPhoneBtn.textContent = bay.customer.phone;
      if (callTelLink) callTelLink.href = `tel:${bay.customer.phone.replace(/[^0-9]/g, '')}`;
    }

    // Finding Card
    const findingCard = document.getElementById("wo-finding-card");
    const fndTitle = document.getElementById("fnd-title-display");
    const fndDesc = document.getElementById("fnd-desc-display");
    const fndStatus = document.getElementById("fnd-status-badge");

    if (bay.finding) {
      if (findingCard) findingCard.style.display = "block";
      if (fndTitle) fndTitle.textContent = bay.finding.title;
      if (fndDesc) fndDesc.textContent = bay.finding.explanation;
      if (fndStatus) {
        if (bay.finding.customerStatus === "approved") {
          fndStatus.className = "pill pill-good";
          fndStatus.textContent = "Customer Approved via App ($" + bay.finding.totalCost.toFixed(2) + ")";
        } else if (bay.finding.customerStatus === "declined") {
          fndStatus.className = "pill pill-warn";
          fndStatus.textContent = "Customer Declined Extra Work";
        } else {
          fndStatus.className = "pill pill-warn";
          fndStatus.textContent = "Awaiting Customer Approval ($" + bay.finding.totalCost.toFixed(2) + ")";
        }
      }
    } else {
      if (findingCard) findingCard.style.display = "none";
    }

    // Call Logs
    renderCallLogs(bay);

    // Vehicle Past History
    renderPastHistory(bay);
  }

  // ==========================================
  // RENDER CALL LOGS & PAST HISTORY
  // ==========================================
  function renderCallLogs(bay) {
    const list = document.getElementById("wo-call-logs-list");
    if (!list) return;

    if (!bay.callLogs || bay.callLogs.length === 0) {
      list.innerHTML = `<div style="font-size:12px; color:var(--text-muted);">No phone calls logged for this visit.</div>`;
      return;
    }

    list.innerHTML = bay.callLogs.map(l => `
      <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); font-size:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
          <span class="call-log-badge">${l.outcome}</span>
          <span class="font-mono" style="color:var(--text-muted); font-size:11px;">${l.time}</span>
        </div>
        <div style="color:var(--text-secondary);">${l.note}</div>
      </div>
    `).join("");
  }

  function renderPastHistory(bay) {
    const container = document.getElementById("wo-past-history-list");
    if (!container) return;

    if (!bay.history || bay.history.length === 0) {
      container.innerHTML = `<div style="font-size:12px; color:var(--text-muted);">No previous service records found for this VIN.</div>`;
      return;
    }

    container.innerHTML = bay.history.map(h => `
      <div style="background:var(--bg-input); border:1px solid var(--border-subtle); padding:10px 12px; border-radius:var(--radius-sm);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:13px; color:#fff;">${h.service}</strong>
          <span style="font-size:11px; color:var(--text-muted);">${h.date}</span>
        </div>
        <div style="font-size:11.5px; color:var(--accent); margin-top:2px;">&#x2022; Logged at ${h.miles} miles</div>
        ${h.note ? `<div style="font-size:11.5px; color:var(--text-secondary); margin-top:4px;">${h.note}</div>` : ''}
      </div>
    `).join("");
  }

  // ==========================================
  // INITIALIZATION & EVENT LISTENERS
  // ==========================================
  function initEventListeners() {
    // Live Clock
    const liveClock = document.getElementById("live-clock");
    if (liveClock && window.GeoTime) {
      window.GeoTime.bindLiveClock("live-clock");
    } else if (liveClock) {
      setInterval(() => {
        liveClock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " • Today";
      }, 1000);
    }

    // Refresh Bays Button
    const refreshBtn = document.getElementById("refresh-bays-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", () => {
      fetchBays();
      showToast("Bays and active work orders refreshed.", "info");
    });

    // Scan / Verify VIN Modal
    const scanVinModal = document.getElementById("scan-vin-modal");
    const openScanVinBtn = document.getElementById("btn-scan-vin-modal");
    const closeScanVinBtn = document.getElementById("close-scan-vin-modal-btn");
    const autoScanObdBtn = document.getElementById("btn-simulate-obd-scan");
    const scanVinForm = document.getElementById("scan-vin-form");

    function openScanModal() {
      const bay = bays.find(b => b.bayId === activeBayId);
      if (bay && bay.vehicle) {
        document.getElementById("scan-vin-input").value = bay.vehicle.vin.startsWith("PENDING") ? "" : bay.vehicle.vin;
        document.getElementById("scan-plate-input").value = bay.vehicle.plate || "";
      }
      scanVinModal.classList.add("active");
    }
    function closeScanModal() {
      scanVinModal.classList.remove("active");
    }

    if (openScanVinBtn) openScanVinBtn.addEventListener("click", openScanModal);
    if (closeScanVinBtn) closeScanVinBtn.addEventListener("click", closeScanModal);

    if (autoScanObdBtn) {
      autoScanObdBtn.addEventListener("click", () => {
        const simulatedVin = "1HGCM82633A004352";
        document.getElementById("scan-vin-input").value = simulatedVin;
        showToast("OBD-II reader successfully captured 17-digit VIN from ECU!", "success");
      });
    }

    if (scanVinForm) {
      scanVinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const vin = document.getElementById("scan-vin-input").value.trim().toUpperCase();
        const plate = document.getElementById("scan-plate-input").value.trim().toUpperCase();

        const bay = bays.find(b => b.bayId === activeBayId);
        if (bay && bay.vehicle) {
          bay.vehicle.vin = vin;
          bay.vehicle.plate = plate || bay.vehicle.plate;
          bay.vehicle.isVinVerified = true;
          await api.put(`/tech/bays/${bay.bayId}/vin`, { vin, plate });
          closeScanModal();
          renderActiveBay();
          renderBaySelector();
          showToast(`Verified VIN ${vin} linked to vehicle profile!`, "success");
        }
      });
    }

    // Flag Hidden Issue Modal
    const findingModal = document.getElementById("finding-protocol-modal");
    const openFindingBtn = document.getElementById("btn-open-finding-modal");
    const closeFindingBtn = document.getElementById("close-finding-modal-btn");
    const findingForm = document.getElementById("finding-protocol-form");

    function openFindingModal() {
      findingModal.classList.add("active");
    }
    function closeFindingModal() {
      findingModal.classList.remove("active");
    }

    if (openFindingBtn) openFindingBtn.addEventListener("click", openFindingModal);
    if (closeFindingBtn) closeFindingBtn.addEventListener("click", closeFindingModal);

    if (findingForm) {
      findingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("fnd-title-input").value.trim();
        const desc = document.getElementById("fnd-desc-input").value.trim();
        const parts = parseFloat(document.getElementById("fnd-parts-input").value) || 0;
        const labor = parseFloat(document.getElementById("fnd-labor-input").value) || 0;
        const urgency = document.getElementById("fnd-urgency-select").value;
        const managerApproved = document.getElementById("fnd-manager-check").checked;

        const bay = bays.find(b => b.bayId === activeBayId);
        if (bay) {
          const res = await api.post(`/tech/bays/${bay.bayId}/finding`, {
            title,
            explanation: desc,
            partsCost: parts,
            laborCost: labor,
            urgency,
            managerApproved,
            managerName: "Girma Ayele (Shop Manager)",
            canFixOnSite: true
          });

          if (res.ok) {
            bay.finding = res.data;
          }

          closeFindingModal();
          renderActiveBay();
          renderBaySelector();
          showToast(`Finding dispatched directly to customer app for 1-click approval!`, "success");
          findingForm.reset();
        }
      });
    }

    // Direct Call & Manual Override
    const directCallBtn = document.getElementById("btn-direct-call");
    const overrideApproveBtn = document.getElementById("btn-manual-override-approve");
    const logCallBtn = document.getElementById("btn-log-call-attempt");

    if (directCallBtn) {
      directCallBtn.addEventListener("click", () => {
        const bay = bays.find(b => b.bayId === activeBayId);
        if (bay && bay.customer) {
          window.location.href = `tel:${bay.customer.phone.replace(/[^0-9]/g, '')}`;
        }
      });
    }

    if (overrideApproveBtn) {
      overrideApproveBtn.addEventListener("click", () => {
        const bay = bays.find(b => b.bayId === activeBayId);
        if (bay && bay.finding) {
          bay.finding.customerStatus = "approved";
          showToast("Customer verbal phone approval logged! Finding added to authorized work order.", "success");
          renderActiveBay();
          renderBaySelector();
        }
      });
    }

    if (logCallBtn) {
      logCallBtn.addEventListener("click", async () => {
        const bay = bays.find(b => b.bayId === activeBayId);
        if (bay) {
          const outcome = prompt("Enter call outcome (e.g. 'Left Voicemail', 'Spoke with customer', 'No Answer'):", "Left Voicemail regarding Serpentine Belt");
          if (outcome) {
            const res = await api.post(`/tech/bays/${bay.bayId}/call-log`, {
              outcome,
              note: "Protocol active: If unconfirmed by completion cutoff, base work order will be completed without additions."
            });
            if (res.ok) {
              bay.callLogs = bay.callLogs || [];
              bay.callLogs.unshift(res.data);
            }
            renderCallLogs(bay);
            showToast("Call attempt logged with timestamp.", "info");
          }
        }
      });
    }
  }

  // BOOTSTRAP
  window.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
    fetchBays();
  });

})();
