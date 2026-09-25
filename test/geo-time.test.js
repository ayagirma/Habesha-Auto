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
});
