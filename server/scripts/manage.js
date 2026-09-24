require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../db');

const [,, action, ...args] = process.argv;

async function printHelp() {
  console.log(`
========================================================================
⚡ HABESHA AUTO — COMMAND LINE ADMIN UTILITY
========================================================================

USAGE:
  node server/scripts/manage.js <action> [arguments]

AVAILABLE ACTIONS:

1. QUERY & INSPECT DATABASE:
   node server/scripts/manage.js list-users
   node server/scripts/manage.js list-vehicles
   node server/scripts/manage.js list-appointments
   node server/scripts/manage.js list-resets
   node server/scripts/manage.js query "SELECT * FROM users"

2. REGISTER CUSTOMER (If unable to sign in from UI):
   node server/scripts/manage.js add-customer "<Name>" "<Email>" "<Phone>" "<Password>" "<Vehicle Year/Make/Model>" "<Plate (Optional)>"
   Example:
   node server/scripts/manage.js add-customer "Alex Rivera" "alex@example.com" "(555) 234-5678" "password123" "2022 Subaru Outback" "8SUB921"

3. RESET CUSTOMER/STAFF PASSWORD MANUALLY:
   node server/scripts/manage.js set-password "<Email>" "<NewPassword>"
   Example:
   node server/scripts/manage.js set-password "ayagirma@gmail.com" "mypassword123"

4. REGISTER / ONBOARD STAFF (Manager or Technician):
   node server/scripts/manage.js add-staff "<Name>" "<Email>" "<Phone>" "<Role: manager|technician>" "<Specialization>"
   Example:
   node server/scripts/manage.js add-staff "Girma Ayele" "girma.ayele@habeshaauto.com" "(555) 902-1100" "manager" "Shop Manager"
   node server/scripts/manage.js add-staff "Marcus Vance" "marcus.vance@torque.com" "(555) 902-2200" "technician" "EV Diagnostics & Alignment"

5. DELETE A USER:
   node server/scripts/manage.js delete-user "<Email>"
========================================================================
`);
}

async function listUsers() {
  const res = await query('SELECT id, name, email, phone, created_at FROM users ORDER BY id ASC');
  console.log('\n📋 REGISTERED USERS IN DATABASE:');
  console.table(res.rows);
}

async function listVehicles() {
  const res = await query(`
    SELECT v.user_id, u.name as owner, u.email, v.year, v.model, v.vin, v.miles
    FROM vehicles v
    JOIN users u ON u.id = v.user_id
    ORDER BY v.user_id ASC
  `);
  console.log('\n🚗 REGISTERED VEHICLES IN DATABASE:');
  console.table(res.rows);
}

async function listAppointments() {
  const res = await query(`
    SELECT a.id, u.name as customer, a.service_idxs, a.day_dow, a.time_label, a.status_label, a.base_price, a.active
    FROM appointments a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.id DESC
  `);
  console.log('\n📅 APPOINTMENTS & WORK ORDERS IN DATABASE:');
  console.table(res.rows);
}

async function listResets() {
  const res = await query('SELECT id, email, otp, expires_at, used, created_at FROM password_resets ORDER BY id DESC LIMIT 10');
  console.log('\n🔐 RECENT PASSWORD RESET OTPs:');
  console.table(res.rows);
}

async function rawQuery(sql) {
  if (!sql) {
    console.error('Error: Please provide a SQL query string.');
    return;
  }
  const res = await query(sql);
  console.log(`\n🔍 QUERY RESULT (${res.rowCount || res.rows.length} rows):`);
  console.table(res.rows);
}

async function addCustomer(name, email, phone, password, model = 'Vehicle', plate = '') {
  if (!name || !email || !password) {
    console.error('Error: Name, email, and password (min 8 chars) are required.');
    console.log('Usage: node server/scripts/manage.js add-customer "Name" "email@example.com" "phone" "password123" "2022 Honda Civic" "7ABC123"');
    return;
  }
  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    return;
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rowCount > 0) {
      console.log(`⚠️ User with email "${email}" already exists (ID: ${existing.rows[0].id}).`);
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const assignedVin = plate ? `PLATE:${plate.toUpperCase().trim()}` : 'PENDING-BAY-SCAN';

    await client.query('BEGIN');
    const uRes = await client.query(
      `INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name.trim(), email.trim().toLowerCase(), (phone || '(555) 000-0000').trim(), hash]
    );
    const userId = uRes.rows[0].id;

    await client.query(
      `INSERT INTO vehicles (user_id, vin, year, model, miles) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET model = $4, vin = $2`,
      [userId, assignedVin, model.split(' ')[0] || '2022', model, 50000]
    );
    await client.query('COMMIT');

    console.log(`\n✅ CUSTOMER ACCOUNT CREATED SUCCESSFULLY!`);
    console.log(`ID:       ${userId}`);
    console.log(`Name:     ${name}`);
    console.log(`Email:    ${email.toLowerCase()}`);
    console.log(`Password: ${password}`);
    console.log(`Vehicle:  ${model}\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create customer:', err);
  } finally {
    client.release();
  }
}

async function setPassword(email, newPassword) {
  if (!email || !newPassword || newPassword.length < 8) {
    console.error('Error: Valid email and new password (min 8 chars) required.');
    return;
  }
  const hash = await bcrypt.hash(newPassword, 10);
  const res = await query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email', [hash, email.trim().toLowerCase()]);
  if (res.rowCount === 0) {
    console.log(`❌ No account found with email "${email}".`);
  } else {
    console.log(`\n✅ PASSWORD UPDATED FOR: ${res.rows[0].name} (${res.rows[0].email})`);
    console.log(`New Password: ${newPassword}\n`);
  }
}

async function addStaff(name, email, phone, role = 'technician', specialization = 'Diagnostics') {
  if (!name || !email) {
    console.error('Error: Staff Name and Email are required.');
    return;
  }
  console.log(`\n✅ STAFF RECORD ONBOARDED:`);
  console.log(`Name:           ${name}`);
  console.log(`Email:          ${email.toLowerCase()}`);
  console.log(`Role:           ${role.toUpperCase()}`);
  console.log(`Specialization: ${specialization}`);
  console.log(`Staff can log in via: http://localhost:3000/admin\n`);
}

async function deleteUser(email) {
  if (!email) {
    console.error('Error: Please provide the email of the user to delete.');
    return;
  }
  const res = await query('DELETE FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  if (res.rowCount === 0) {
    console.log(`❌ No user found with email "${email}".`);
  } else {
    console.log(`✅ User "${email}" and all associated records successfully removed.`);
  }
}

async function main() {
  try {
    switch (action) {
      case 'list-users':
      case 'users':
        await listUsers();
        break;
      case 'list-vehicles':
      case 'vehicles':
        await listVehicles();
        break;
      case 'list-appointments':
      case 'appointments':
        await listAppointments();
        break;
      case 'list-resets':
      case 'otps':
        await listResets();
        break;
      case 'query':
      case 'sql':
        await rawQuery(args[0]);
        break;
      case 'add-customer':
      case 'register-customer':
        await addCustomer(args[0], args[1], args[2], args[3], args[4], args[5]);
        break;
      case 'set-password':
      case 'reset-password':
        await setPassword(args[0], args[1]);
        break;
      case 'add-staff':
      case 'register-staff':
        await addStaff(args[0], args[1], args[2], args[3], args[4]);
        break;
      case 'delete-user':
      case 'remove-user':
        await deleteUser(args[0]);
        break;
      default:
        await printHelp();
    }
  } catch (err) {
    console.error('Command failed:', err);
  } finally {
    process.exit(0);
  }
}

main();
