const express = require('express');
const { query } = require('../db');

const router = express.Router();

function getRelativeTimeStr(minuteOffset) {
  const d = new Date(Date.now() + minuteOffset * 60000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Mock initial bays state with fallback if DB table is empty
let baysState = [
  {
    bayId: "bay-1",
    bayName: "Bay 1 (Intake & OBD-II Diagnostics)",
    techName: "Devon Reed",
    status: "active", // active, available, awaiting-parts, hold
    customer: {
      name: "Alex Rivera",
      phone: "(555) 392-8812",
      email: "alex.rivera@email.com"
    },
    vehicle: {
      title: "2022 Subaru Outback Touring",
      vin: "4S4BSANC5N3209841",
      plate: "8SUB921",
      miles: "38,400",
      isVinVerified: true
    },
    service: {
      name: "Check Engine Light (P0420) & OBD-II Live Stream",
      category: "Diagnostics & Engine",
      startedAt: getRelativeTimeStr(-50),
      estimatedCompletion: getRelativeTimeStr(25),
      basePrice: 110.00
    },
    currentStep: 1, // 0 to 4
    finding: null,
    history: [
      { date: "March 10, 2026", service: "Full Synthetic Oil & Filter", miles: "31,000", note: "Recommended transmission fluid check at 40k." }
    ],
    callLogs: []
  },
  {
    bayId: "bay-2",
    bayName: "Bay 2 (Lift 1 — Heavy Mechanical)",
    techName: "Carlos Ramos",
    status: "active",
    customer: {
      name: "Samantha Chen",
      phone: "(555) 481-9034",
      email: "s.chen@email.com"
    },
    vehicle: {
      title: "2020 Toyota RAV4 Hybrid",
      vin: "2T3P1RFV5LW084321",
      plate: "6RAV550",
      miles: "52,800",
      isVinVerified: true
    },
    service: {
      name: "Front Ceramic Brake Pads & Rotor Resurfacing",
      category: "Brakes & Traction",
      startedAt: getRelativeTimeStr(-75),
      estimatedCompletion: getRelativeTimeStr(15),
      basePrice: 195.00
    },
    currentStep: 3,
    finding: null,
    history: [
      { date: "Nov 15, 2025", service: "Tire Rotation & Cabin Filter", miles: "44,100", note: "Front brake pads measured at 5mm." }
    ],
    callLogs: []
  },
  {
    bayId: "bay-3",
    bayName: "Bay 3 (Lift 2 — Quick Service & Fluids)",
    techName: "Marcus Vance",
    status: "active",
    customer: {
      name: "Customer Account",
      phone: "(555) 010-2938",
      email: "ayagirma@gmail.com"
    },
    vehicle: {
      title: "2021 Honda Accord EX-L",
      vin: "1HGCM82633A004352",
      plate: "7XYZ890",
      miles: "62,140",
      isVinVerified: true
    },
    service: {
      name: "Full Synthetic Oil & Filter + Safety Check",
      category: "Fluids & Maintenance",
      startedAt: getRelativeTimeStr(-45),
      estimatedCompletion: getRelativeTimeStr(35),
      basePrice: 89.00
    },
    currentStep: 2,
    finding: {
      id: "fnd-1",
      title: "Serpentine Drive Belt Micro-Cracking",
      explanation: "Surface rib cracking observed during 30-pt safety check. Belt tensioner is at 80% deflection. Failure will cause alternator & power steering loss.",
      partsCost: 38.00,
      laborCost: 58.00,
      totalCost: 96.00,
      urgency: "Recommended Today (Can complete without rescheduling)",
      managerApproved: true,
      managerName: "Dave Miller (Shop Foreman)",
      customerStatus: "pending", // pending, approved, declined
      notifiedAt: getRelativeTimeStr(-15),
      canFixOnSite: true
    },
    history: [
      { date: "June 14, 2026", service: "Synthetic Oil Change & Tire Rotation", miles: "54,200", note: "All systems nominal." },
      { date: "January 20, 2026", service: "Cabin Micro-Filter & Brake Fluid Flush", miles: "47,800", note: "Serpentine belt showed minor surface wear." }
    ],
    callLogs: []
  },
  {
    bayId: "bay-4",
    bayName: "Bay 4 (EV & Precision Alignment)",
    techName: "Elena Rostova",
    status: "available",
    customer: null,
    vehicle: null,
    service: null,
    currentStep: 0,
    finding: null,
    history: [],
    callLogs: []
  }
];

const SERVICES_MAP = {
  "oil-syn": "Full Synthetic Oil & Filter",
  "brakes-front": "Front Ceramic Brake Pads & Rotors",
  "diag-obd": "OBD-II Diagnostic Live Stream",
  "brake-flush": "Brake Fluid Pressure Flush",
  "ac-service": "AC Recharge & Leak Test",
  "tire-rotation": "Tire Rotation & Balance"
};

async function getDynamicBays() {
  const bays = JSON.parse(JSON.stringify(baysState));
  try {
    const { rows } = await query(`
      SELECT a.id, a.user_id, a.service_idxs, a.day_dow, a.day_num, a.time_label, a.step_index,
             a.status, a.status_label, a.extra_decision, a.base_price, a.updated_at,
             u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
             v.vin as vehicle_vin, v.year as vehicle_year, v.model as vehicle_model, v.miles as vehicle_miles
      FROM appointments a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN vehicles v ON v.user_id = a.user_id
      WHERE a.active = true
      ORDER BY a.updated_at DESC
    `);

    if (rows.length > 0) {
      const latest = rows[0];
      const targetBay = bays.find(b => b.bayId === "bay-3") || bays[2];

      const rawServices = latest.service_idxs || [];
      const serviceList = (Array.isArray(rawServices) ? rawServices : [])
        .map(id => SERVICES_MAP[id] || id)
        .join(" + ") || "Scheduled Service";

      const rawVin = latest.vehicle_vin || "";
      const plateStr = rawVin.startsWith("PLATE:") ? rawVin.replace("PLATE:", "") : (rawVin || "088QLF");
      const displayVin = rawVin || "Pending Bay Scan";

      targetBay.customer = {
        name: latest.customer_name || "Customer",
        phone: latest.customer_phone || "(555) 000-0000",
        email: latest.customer_email || ""
      };
      targetBay.vehicle = {
        title: `${latest.vehicle_year || ''} ${latest.vehicle_model || 'Vehicle'}`.trim() || "2013 Mazda CX9",
        vin: displayVin,
        plate: plateStr,
        miles: String(latest.vehicle_miles || "62,140"),
        isVinVerified: !displayVin.startsWith("Pending") && !displayVin.startsWith("PLATE:")
      };
      targetBay.service = {
        name: serviceList,
        category: "Customer Booked Service",
        startedAt: latest.time_label || getRelativeTimeStr(-20),
        estimatedCompletion: getRelativeTimeStr(40),
        basePrice: parseFloat(latest.base_price) || 89.00
      };
      targetBay.currentStep = (typeof latest.step_index === "number" && latest.step_index >= 0) ? latest.step_index : 0;
      targetBay.status = "active";
    }
  } catch (err) {
    console.warn("Could not query dynamic appointments:", err);
  }
  return bays;
}

// 1. Get all bays status (live from DB)
router.get('/bays', async (req, res) => {
  const bays = await getDynamicBays();
  res.json(bays);
});

// 2. Get specific bay details
router.get('/bays/:id', async (req, res) => {
  const bays = await getDynamicBays();
  const bay = bays.find(b => b.bayId === req.params.id);
  if (!bay) return res.status(404).json({ error: "Bay not found" });
  res.json(bay);
});

// 3. Update repair step
router.put('/bays/:id/step', async (req, res) => {
  const { stepIndex } = req.body;
  const bay = baysState.find(b => b.bayId === req.params.id);
  if (!bay) return res.status(404).json({ error: "Bay not found" });

  if (typeof stepIndex === 'number' && stepIndex >= 0 && stepIndex <= 5) {
    bay.currentStep = stepIndex;
    if (stepIndex >= 5) {
      bay.status = "completed";
    }

    // If updating Bay 3 (Active user appointment), also try to sync to database
    try {
      if (req.session && req.session.userId) {
        const isComplete = stepIndex >= 5;
        await query(
          `UPDATE appointments 
           SET step_index = $1,
               status = CASE WHEN $3 = true THEN 'completed' ELSE status END,
               status_label = CASE WHEN $3 = true THEN 'Service Completed — Ready for Pickup' ELSE status_label END,
               updated_at = now() 
           WHERE user_id = $2 AND active = true`,
          [stepIndex, req.session.userId, isComplete]
        );
      }
    } catch (e) {
      console.warn("DB sync notice on step update", e);
    }
  }

  res.json(bay);
});

// 4. Update / Scan VIN on vehicle intake
router.put('/bays/:id/vin', async (req, res) => {
  const { vin, plate } = req.body;
  const bay = baysState.find(b => b.bayId === req.params.id);
  if (!bay || !bay.vehicle) return res.status(404).json({ error: "Bay or vehicle not found" });

  if (vin) {
    bay.vehicle.vin = String(vin).trim().toUpperCase();
    bay.vehicle.isVinVerified = true;
  }
  if (plate) {
    bay.vehicle.plate = String(plate).trim().toUpperCase();
  }

  try {
    if (req.session && req.session.userId && vin) {
      await query(
        `UPDATE vehicles SET vin = $1, updated_at = now() WHERE user_id = $2`,
        [bay.vehicle.vin, req.session.userId]
      );
    }
  } catch (e) {
    console.warn("DB sync notice on VIN update", e);
  }

  res.json(bay);
});

// 5. Submit a newly discovered hidden issue / finding (with manager protocol)
router.post('/bays/:id/finding', (req, res) => {
  const { title, explanation, partsCost, laborCost, urgency, managerApproved, managerName, canFixOnSite } = req.body;
  const bay = baysState.find(b => b.bayId === req.params.id);
  if (!bay) return res.status(404).json({ error: "Bay not found" });

  const parts = parseFloat(partsCost) || 0;
  const labor = parseFloat(laborCost) || 0;

  bay.finding = {
    id: "fnd-" + Date.now(),
    title: title || "Discovered Mechanical Wear",
    explanation: explanation || "Safety finding documented during active multi-point bay inspection.",
    partsCost: parts,
    laborCost: labor,
    totalCost: parts + labor,
    urgency: urgency || "Recommended Today",
    managerApproved: Boolean(managerApproved),
    managerName: managerName || "Dave Miller (Shop Foreman)",
    customerStatus: "pending",
    notifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    canFixOnSite: canFixOnSite !== false
  };

  res.status(201).json(bay.finding);
});

// 6. Log phone call attempt to customer if no response to estimate
router.post('/bays/:id/call-log', (req, res) => {
  const { outcome, note } = req.body;
  const bay = baysState.find(b => b.bayId === req.params.id);
  if (!bay) return res.status(404).json({ error: "Bay not found" });

  const logEntry = {
    id: "call-" + Date.now(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    outcome: outcome || "Left Voicemail",
    note: note || "Customer notified of finding. If unconfirmed before 2:30 PM, completing original work order only.",
    techName: bay.techName
  };

  bay.callLogs = bay.callLogs || [];
  bay.callLogs.unshift(logEntry);

  res.status(201).json(logEntry);
});

module.exports = router;
