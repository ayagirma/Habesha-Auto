const express = require('express');
const { query } = require('../db');

const router = express.Router();

function getRelativeTimeStr(minuteOffset) {
  const d = new Date(Date.now() + minuteOffset * 60000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Mock store for managerial operations & live telemetry
let managerData = {
  kpis: {
    todayRevenue: 1485.00,
    projectedRevenue: 2190.00,
    carsCompletedToday: 6,
    activeBayUtilization: "75% (3/4 Bays)",
    avgTurnaroundMins: 52,
    findingApprovalRate: "88%"
  },
  technicians: [
    {
      id: "tech-1",
      name: "Marcus Vance",
      role: "Lead Diagnostic & Powertrain",
      assignedBay: "Bay 3 (Lift 2)",
      activeJob: "2021 Honda Accord EX-L",
      jobsCompletedToday: 2,
      efficiency: "98%",
      status: "In Bay Work"
    },
    {
      id: "tech-2",
      name: "Carlos Ramos",
      role: "Brakes & Suspension Specialist",
      assignedBay: "Bay 2 (Lift 1)",
      activeJob: "2020 Toyota RAV4 Hybrid",
      jobsCompletedToday: 2,
      efficiency: "95%",
      status: "Active Repair"
    },
    {
      id: "tech-3",
      name: "Devon Reed",
      role: "Master OBD-II Electrical Tech",
      assignedBay: "Bay 1 (Intake)",
      activeJob: "2022 Subaru Outback Touring",
      jobsCompletedToday: 1,
      efficiency: "92%",
      status: "Diagnosing"
    },
    {
      id: "tech-4",
      name: "Elena Rostova",
      role: "EV High-Voltage & Precision Alignment",
      assignedBay: "Bay 4 (EV/Align)",
      activeJob: "None (Available)",
      jobsCompletedToday: 1,
      efficiency: "100%",
      status: "Bay Ready"
    }
  ],
  intakeQueue: [
    {
      id: "queue-1",
      customerName: "Taylor Brooks",
      phone: "(555) 721-0941",
      vehicle: "2023 Tesla Model 3 Long Range",
      plate: "9ELC321",
      service: "High-Speed Road Force Balance & Alignment",
      scheduledTime: getRelativeTimeStr(30),
      status: "Checked In & Waiting"
    },
    {
      id: "queue-2",
      customerName: "David Miller Jr.",
      phone: "(555) 882-1402",
      vehicle: "2019 Ford F-150 SuperCrew",
      plate: "4TRK901",
      service: "Brake Fluid Pressure Flush & Rotor Check",
      scheduledTime: getRelativeTimeStr(75),
      status: "Expected Drop-off"
    }
  ],
  findingsPendingReview: [
    {
      id: "fnd-rev-1",
      bayId: "bay-3",
      techName: "Marcus Vance",
      customerName: "Jordan Alvarez",
      vehicleTitle: "2021 Honda Accord EX-L",
      title: "Serpentine Drive Belt Micro-Cracking",
      notes: "Severe rib cracking identified on 30-pt safety scan. Deflection measured 80%.",
      partsCost: 38.00,
      laborCost: 58.00,
      totalCost: 96.00,
      urgency: "Recommended Today",
      managerStatus: "approved_sent", // pending_review, approved_sent, rejected
      customerStatus: "pending"
    }
  ],
  pendingTechnicians: [
    {
      id: "p-tech-1",
      name: "Brandon Fox",
      email: "brandon.fox@torque.com",
      phone: "(555) 902-3314",
      specialization: "Transmission & Drivetrain Diagnostics",
      requestedRole: "Technician",
      registeredAt: getRelativeTimeStr(-25),
      status: "pending_approval"
    }
  ]
};

// 1. Get Managerial KPIs & Statistics
router.get('/kpis', (req, res) => {
  res.json(managerData.kpis);
});

// 2. Get Staff & Technician Roster
router.get('/technicians', (req, res) => {
  res.json(managerData.technicians);
});

// 3. Get Pending Technician Approvals
router.get('/pending-staff', (req, res) => {
  res.json(managerData.pendingTechnicians);
});

// 4. Approve / Onboard a Technician
router.put('/pending-staff/:id/approve', (req, res) => {
  const { assignedBay } = req.body;
  const pIndex = managerData.pendingTechnicians.findIndex(p => p.id === req.params.id);
  if (pIndex === -1) return res.status(404).json({ error: "Pending technician not found" });

  const tech = managerData.pendingTechnicians.splice(pIndex, 1)[0];
  const newTechRecord = {
    id: "tech-" + (managerData.technicians.length + 1),
    name: tech.name,
    role: tech.specialization || "Service Technician",
    assignedBay: assignedBay || "Bay 4 (EV/Align)",
    activeJob: "None (Available)",
    jobsCompletedToday: 0,
    efficiency: "100%",
    status: "Bay Ready"
  };

  managerData.technicians.push(newTechRecord);
  res.json({ success: true, technician: newTechRecord });
});

// 5. Staff Self-Registration from /admin
router.post('/register-staff', (req, res) => {
  const { name, email, phone, role, specialization } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email required." });

  if (role === "manager") {
    // Managers are activated immediately
    return res.status(201).json({
      success: true,
      role: "manager",
      status: "active",
      user: { name, email, phone, role: "manager" }
    });
  }

  // Technicians are queued for Manager Approval
  const newPending = {
    id: "p-tech-" + Date.now(),
    name,
    email,
    phone: phone || "(555) 000-0000",
    specialization: specialization || "General Service & Diagnostics",
    requestedRole: "Technician",
    registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: "pending_approval"
  };

  managerData.pendingTechnicians.push(newPending);
  res.status(201).json({
    success: true,
    role: "technician",
    status: "pending_approval",
    user: { name, email, phone, role: "technician", status: "pending_approval" }
  });
});

const SERVICES_MAP = {
  "oil-syn": "Full Synthetic Oil & Filter",
  "brakes-front": "Front Ceramic Brake Pads & Rotors",
  "diag-obd": "OBD-II Diagnostic Live Stream",
  "brake-flush": "Brake Fluid Pressure Flush",
  "ac-service": "AC Recharge & Leak Test",
  "tire-rotation": "Tire Rotation & Balance"
};

// 6. Get Intake Queue & Scheduled Arrivals (live from DB + scheduled)
router.get('/queue', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT a.id, a.user_id, a.service_idxs, a.day_dow, a.day_num, a.time_label, a.step_index,
             a.status, a.status_label, a.base_price, a.updated_at,
             u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
             v.vin as vehicle_vin, v.year as vehicle_year, v.model as vehicle_model, v.miles as vehicle_miles
      FROM appointments a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN vehicles v ON v.user_id = a.user_id
      WHERE a.active = true
      ORDER BY a.updated_at DESC
    `);

    const dbQueue = rows.map(r => {
      const rawVin = r.vehicle_vin || "";
      const plateStr = rawVin.startsWith("PLATE:") ? rawVin.replace("PLATE:", "") : (rawVin || "088QLF");
      const rawServices = r.service_idxs || [];
      const serviceList = (Array.isArray(rawServices) ? rawServices : [])
        .map(id => SERVICES_MAP[id] || id)
        .join(" + ") || "Scheduled Service";

      let statusText = "Checked In & Waiting";
      if (typeof r.step_index === "number" && r.step_index >= 0) {
        statusText = `In Bay 3 (Step ${r.step_index + 1}/5)`;
      }

      return {
        id: "db-appt-" + r.id,
        customerName: r.customer_name,
        phone: r.customer_phone,
        vehicle: `${r.vehicle_year || ''} ${r.vehicle_model || 'Vehicle'}`.trim() || "2013 Mazda CX9",
        plate: plateStr,
        service: serviceList,
        scheduledTime: r.time_label || `${r.day_dow} ${r.day_num}`,
        status: statusText
      };
    });

    const combined = [...dbQueue, ...managerData.intakeQueue.filter(q => !dbQueue.some(d => d.plate === q.plate))];
    res.json(combined);
  } catch (err) {
    console.warn("Queue DB lookup fallback", err);
    res.json(managerData.intakeQueue);
  }
});

// 7. Get Findings Under Manager Review
router.get('/findings', (req, res) => {
  res.json(managerData.findingsPendingReview);
});

// 8. Manager Action on Findings (Approve & Dispatch / Reject / Adjust Price)
router.put('/findings/:id/action', (req, res) => {
  const { action, adjustedPrice, managerNote } = req.body;
  const finding = managerData.findingsPendingReview.find(f => f.id === req.params.id);
  if (!finding) return res.status(404).json({ error: "Finding not found" });

  if (action === "approve") {
    finding.managerStatus = "approved_sent";
    finding.customerStatus = "pending";
    if (adjustedPrice) finding.totalCost = parseFloat(adjustedPrice);
  } else if (action === "reject") {
    finding.managerStatus = "rejected";
    finding.customerStatus = "declined_by_manager";
  }

  res.json({ success: true, finding });
});

// 9. Admit Intake / Walk-in Vehicle into a specific bay
router.post('/admit', (req, res) => {
  const { customerName, phone, vehicle, plate, service, bayId } = req.body;
  
  // Remove from queue if present
  managerData.intakeQueue = managerData.intakeQueue.filter(q => q.plate !== plate);

  const admissionRecord = {
    admittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    bayId: bayId || "bay-4",
    customerName,
    vehicle,
    plate,
    service
  };

  res.status(201).json({ success: true, admission: admissionRecord });
});

module.exports = router;
