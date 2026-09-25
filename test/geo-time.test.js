/**
 * Unit Tests for GeoTime & Scheduling Engine
 */

// Load GeoTime in Node.js test environment
const fs = require('fs');
const path = require('path');

describe('GeoTime Engine (client/js/geo-time.js)', () => {
  let GeoTime;

  beforeAll(() => {
    // Emulate browser global window in Node
    global.window = global;
    global.navigator = { language: 'en-US' };
    const code = fs.readFileSync(path.join(__dirname, '..', 'client', 'js', 'geo-time.js'), 'utf8');
    eval(code);
    GeoTime = global.window.GeoTime;
  });

  test('detects timezone and returns structured info', () => {
    const geo = GeoTime.detect();
    expect(geo).toBeDefined();
    expect(typeof geo.timeZone).toBe('string');
    expect(typeof geo.city).toBe('string');
    expect(typeof geo.abbreviation).toBe('string');
    expect(typeof geo.label).toBe('string');
  });

  test('formats time string accurately', () => {
    const fixedDate = new Date('2026-09-24T12:00:00Z');
    const formatted = GeoTime.formatTime(fixedDate);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toMatch(/(AM|PM)/i);
  });

  test('formats date string with weekday and month', () => {
    const fixedDate = new Date('2026-09-24T12:00:00Z');
    const formatted = GeoTime.formatDate(fixedDate);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  test('calculates relative dates and offsets', () => {
    const base = new Date('2026-09-24T12:00:00Z');
    const shifted = GeoTime.getRelativeDate(30, base);
    expect(shifted.getTime() - base.getTime()).toBe(30 * 60 * 1000);
  });

  test('generates all 5 workflow steps with timestamps', () => {
    const steps = GeoTime.getWorkflowSteps(2);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBe(5);
    steps.forEach((step, idx) => {
      expect(step).toHaveProperty('title');
      expect(step).toHaveProperty('desc');
      expect(step).toHaveProperty('time');
      expect(typeof step.time).toBe('string');
    });
  });

  test('calculates dynamic ETA correctly based on active step', () => {
    const etaStep0 = GeoTime.getDynamicETA(0);
    expect(typeof etaStep0).toBe('string');

    const etaStep4 = GeoTime.getDynamicETA(4);
    expect(typeof etaStep4).toBe('string');
    expect(etaStep4).not.toContain('Completed');

    const etaStep5 = GeoTime.getDynamicETA(5);
    expect(etaStep5).toContain('Completed');
  });

  test('generates calendar booking days starting from today', () => {
    const days = GeoTime.getBookingDays(6);
    expect(Array.isArray(days)).toBe(true);
    expect(days.length).toBe(6);
    expect(days[0].isToday).toBe(true);
    expect(days[1].isToday).toBe(false);
    expect(days[0]).toHaveProperty('dow');
    expect(days[0]).toHaveProperty('num');
    expect(days[0]).toHaveProperty('month');
  });

  test('enforces official business hours schedule and slots', () => {
    expect(GeoTime.BUSINESS_HOURS).toBeDefined();
    // Monday (1) to Friday (5): 8:00 AM - 5:00 PM
    for (let day = 1; day <= 5; day++) {
      const sched = GeoTime.BUSINESS_HOURS.schedule[day];
      expect(sched.openHour).toBe(8);
      expect(sched.closeHour).toBe(17);
      expect(sched.label).toBe('8:00 AM – 5:00 PM');
      const slots = GeoTime.getTimeSlotsForDay(day);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toBe('8:00 AM');
    }

    // Saturday (6): 9:00 AM - 3:00 PM
    const satSched = GeoTime.BUSINESS_HOURS.schedule[6];
    expect(satSched.openHour).toBe(9);
    expect(satSched.closeHour).toBe(15);
    expect(satSched.label).toBe('9:00 AM – 3:00 PM');
    const satSlots = GeoTime.getTimeSlotsForDay(6);
    expect(satSlots.length).toBeGreaterThan(0);
    expect(satSlots[0]).toBe('9:00 AM');

    // Sunday (0): Closed
    const sunSched = GeoTime.BUSINESS_HOURS.schedule[0];
    expect(sunSched.isClosed).toBe(true);
    const sunSlots = GeoTime.getTimeSlotsForDay(0);
    expect(sunSlots).toEqual([]);
  });

  test('contains clear key drop box liability policy', () => {
    expect(GeoTime.BUSINESS_HOURS.keyDropPolicy).toContain('business hours');
    expect(GeoTime.BUSINESS_HOURS.keyDropPolicy).toContain('NO responsibility or liability');
  });

  test('parses 12-hour AM/PM time strings into minutes from midnight', () => {
    expect(GeoTime.parseTimeToMinutes('8:00 AM')).toBe(480);
    expect(GeoTime.parseTimeToMinutes('12:00 PM')).toBe(720);
    expect(GeoTime.parseTimeToMinutes('1:30 PM')).toBe(810);
    expect(GeoTime.parseTimeToMinutes('4:30 PM')).toBe(990);
    expect(GeoTime.parseTimeToMinutes('12:15 AM')).toBe(15);
  });

  test('parses human-readable service duration strings accurately', () => {
    expect(GeoTime.getServiceDurationMinutes('45 mins')).toBe(45);
    expect(GeoTime.getServiceDurationMinutes('1.5 hrs')).toBe(90);
    expect(GeoTime.getServiceDurationMinutes('1 hr')).toBe(60);
    expect(GeoTime.getServiceDurationMinutes('2.0 hrs')).toBe(120);
    expect(GeoTime.getServiceDurationMinutes('1.5 – 2.0 hrs')).toBe(120);
  });

  test('filters and disables late time slots for multi-service stacked durations exceeding closing time', () => {
    // Weekday: closes at 5:00 PM (1020 mins). Job duration: 2.5 hours (150 mins).
    // A 4:30 PM slot (990 mins) + 150 mins = 1140 mins > 1020 mins -> MUST be disabled!
    // A 3:30 PM slot (930 mins) + 150 mins = 1080 mins > 1020 mins -> MUST be disabled!
    // A 2:00 PM slot (840 mins) + 150 mins = 990 mins <= 1020 mins -> Available!
    const slots = GeoTime.getDetailedTimeSlots(1, false, 150);
    const slot2pm = slots.find(s => s.time === '2:00 PM');
    const slot330pm = slots.find(s => s.time === '3:30 PM');
    const slot430pm = slots.find(s => s.time === '4:30 PM');

    expect(slot2pm.isAvailable).toBe(true);
    expect(slot2pm.isExceedingClose).toBe(false);

    expect(slot330pm.isAvailable).toBe(false);
    expect(slot330pm.isExceedingClose).toBe(true);
    expect(slot330pm.reason).toContain('Exceeds 5:00 PM close');

    expect(slot430pm.isAvailable).toBe(false);
    expect(slot430pm.isExceedingClose).toBe(true);
    expect(slot430pm.reason).toContain('Exceeds 5:00 PM close');
  });

  test('disables past time slots when booking for today after hours', () => {
    // Simulate current time at 2:00 PM (840 mins)
    const mockTodayDate = new Date('2026-09-24T14:00:00');
    // For today (weekday) at 2:00 PM, morning slots (8:00 AM, 9:30 AM, 11:00 AM, 12:30 PM) are past
    const slots = GeoTime.getDetailedTimeSlots(1, true, 45, mockTodayDate);
    const slot8am = slots.find(s => s.time === '8:00 AM');
    const slot11am = slots.find(s => s.time === '11:00 AM');

    expect(slot8am.isPast).toBe(true);
    expect(slot8am.isAvailable).toBe(false);
    expect(slot8am.reason).toBe('Past time slot');

    expect(slot11am.isPast).toBe(true);
    expect(slot11am.isAvailable).toBe(false);
  });
});
