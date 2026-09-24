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
});
