/**
 * TORQUE & CO — GEOLOCATION & DYNAMIC TIME ENGINE
 * Resolves browser/device geographic timezone, locale, and calculates dynamic local timestamps,
 * appointment scheduling calendars, and live shop workflow ETAs.
 */

(function (window) {
  "use strict";

  // Cache resolved timezone & locale
  let detectedInfo = null;

  function detectGeoTimezone() {
    if (detectedInfo) return detectedInfo;

    let timeZone = "America/Denver"; // sensible default fallback
    let locale = navigator.language || "en-US";

    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";
    } catch (e) {
      console.warn("Timezone resolution fallback to default:", e);
    }

    // Extract City / Region from IANA string (e.g. "America/Denver" -> "Denver", "Europe/London" -> "London")
    const parts = timeZone.split("/");
    const cityRaw = parts[parts.length - 1] || timeZone;
    const city = cityRaw.replace(/_/g, " ");

    // Determine abbreviation (e.g. MDT, EST, GMT, CET)
    let abbreviation = "Local";
    try {
      const partsObj = new Intl.DateTimeFormat(locale, { timeZoneName: "short", timeZone }).formatToParts(new Date());
      const tzPart = partsObj.find(p => p.type === "timeZoneName");
      if (tzPart && tzPart.value) {
        abbreviation = tzPart.value;
      }
    } catch (e) {
      // Fallback: calculate UTC offset
      const offsetMinutes = -new Date().getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const hrs = Math.floor(Math.abs(offsetMinutes) / 60);
      abbreviation = `UTC${sign}${hrs}`;
    }

    detectedInfo = {
      timeZone,
      city,
      abbreviation,
      locale,
      label: `${city} (${abbreviation})`
    };

    return detectedInfo;
  }

  // Format a Date or timestamp to local time string (e.g. "11:45 AM")
  function formatTime(dateInput = new Date(), options = {}) {
    const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    const geo = detectGeoTimezone();
    const defaults = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: geo.timeZone
    };
    return new Intl.DateTimeFormat(geo.locale, { ...defaults, ...options }).format(d);
  }

  // Format a Date to local time with seconds (e.g. "11:45:22 AM")
  function formatTimeWithSeconds(dateInput = new Date()) {
    return formatTime(dateInput, { second: "2-digit" });
  }

  // Format a Date to local date string (e.g. "Thu, Sep 24")
  function formatDate(dateInput = new Date(), options = {}) {
    const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    const geo = detectGeoTimezone();
    const defaults = {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: geo.timeZone
    };
    return new Intl.DateTimeFormat(geo.locale, { ...defaults, ...options }).format(d);
  }

  // Shift minutes from a base date
  function getRelativeDate(minutesOffset, baseDate = new Date()) {
    const d = new Date(baseDate.getTime());
    d.setMinutes(d.getMinutes() + minutesOffset);
    return d;
  }

  // Get formatted time for an offset (e.g. +35 mins or -20 mins)
  function getRelativeTimeString(minutesOffset, baseDate = new Date()) {
    return formatTime(getRelativeDate(minutesOffset, baseDate));
  }

  // Dynamically calculate the 5 workflow steps relative to current time and step index
  function getWorkflowSteps(currentStepIndex = 2, baseDate = new Date()) {
    // Minute offsets relative to current time for each step (0 to 4)
    // If stepIndex is 2 (middle):
    // step 0 completed ~45m ago, step 1 completed ~25m ago, step 2 active ~5m ago, step 3 est in 15m, step 4 est in 35m
    const stepOffsetsByCurrent = {
      0: [-5, 15, 35, 55, 75],
      1: [-25, -5, 20, 40, 60],
      2: [-45, -25, -5, 15, 35],
      3: [-60, -40, -20, -5, 15],
      4: [-70, -50, -30, -10, 5],
      5: [-75, -55, -35, -15, -2]
    };

    const offsets = stepOffsetsByCurrent[Math.min(Math.max(currentStepIndex, 0), 5)] || [-45, -25, -5, 15, 35];

    const baseDescriptions = [
      {
        title: "Vehicle Check-in & Initial Scan",
        desc: "Bay technician logged VIN and verified baseline diagnostics."
      },
      {
        title: "Vehicle Lifted & Multi-Point Inspection",
        desc: "Detailed 30-point inspection covering brakes, suspension, belts, and undercarriage."
      },
      {
        title: "Active Work: Fluid Drain & Filter Replacement",
        desc: "Draining oil, replacing OEM filter, and torquing drain plug to factory specs."
      },
      {
        title: "Secondary Inspection & Finding Verification",
        desc: "Serpentine belt wear documented and submitted for customer approval."
      },
      {
        title: "Final Quality Check & Road Test",
        desc: "Torque check on wheels, fluid level confirmation, and final wash."
      }
    ];

    return baseDescriptions.map((step, idx) => ({
      title: step.title,
      desc: step.desc,
      time: formatTime(getRelativeDate(offsets[idx], baseDate))
    }));
  }

  // Dynamic ETA target (Step 5 completion target or finished)
  function getDynamicETA(currentStepIndex = 2, baseDate = new Date()) {
    if (currentStepIndex >= 5) {
      return "Completed (" + formatTime(getRelativeDate(-2, baseDate)) + ")";
    }
    const targetOffsets = [75, 60, 35, 15, 5];
    const mins = targetOffsets[Math.min(Math.max(currentStepIndex, 0), 4)] || 15;
    return formatTime(getRelativeDate(mins, baseDate));
  }

  // Generate real calendar days for online booking starting today in viewer's timezone
  function getBookingDays(count = 6) {
    const geo = detectGeoTimezone();
    const days = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const dowShort = new Intl.DateTimeFormat(geo.locale, { weekday: "short", timeZone: geo.timeZone }).format(d);
      const monthShort = new Intl.DateTimeFormat(geo.locale, { month: "short", timeZone: geo.timeZone }).format(d);
      const dayNum = parseInt(new Intl.DateTimeFormat(geo.locale, { day: "numeric", timeZone: geo.timeZone }).format(d), 10);
      const year = d.getFullYear();

      days.push({
        dow: dowShort,
        num: dayNum,
        month: monthShort,
        year: year,
        isToday: i === 0,
        fullFormatted: `${dowShort}, ${monthShort} ${dayNum}`
      });
    }

    return days;
  }

  // Active interval registry to avoid duplicate ticking timers
  const activeTimers = {};

  // Bind live clock element with live ticking timestamp & geo location
  function bindLiveClock(elementIdOrElement, options = {}) {
    const el = (typeof elementIdOrElement === "string")
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

    if (!el) return;

    const timerKey = el.id || "anonymous-clock-" + Math.random();
    if (activeTimers[timerKey]) {
      clearInterval(activeTimers[timerKey]);
    }

    const updateClock = () => {
      const now = new Date();
      const geo = detectGeoTimezone();

      const timeStr = formatTime(now, {
        hour: "numeric",
        minute: "2-digit",
        second: options.showSeconds !== false ? "2-digit" : undefined,
        hour12: true
      });

      const dateStr = formatDate(now, {
        weekday: "short",
        month: "short",
        day: "numeric"
      });

      if (options.renderCustom) {
        options.renderCustom(el, { timeStr, dateStr, geo, now });
        return;
      }

      // Default high-precision display: "11:42:08 AM MDT • Denver • Thu, Sep 24"
      if (options.compact) {
        el.innerHTML = `<span style="color:#fff; font-weight:700;">${timeStr}</span> <span style="opacity:0.75;">${geo.abbreviation}</span>`;
      } else {
        el.innerHTML = `<span style="color:#fff; font-weight:700;">${timeStr} ${geo.abbreviation}</span> &bull; <span style="color:var(--text-secondary);">${geo.city}</span> &bull; <span style="opacity:0.8;">${dateStr}</span>`;
      }
    };

    updateClock();
    activeTimers[timerKey] = setInterval(updateClock, 1000);
  }

  // Export to global window object
  window.GeoTime = {
    detect: detectGeoTimezone,
    formatTime,
    formatTimeWithSeconds,
    formatDate,
    getRelativeDate,
    getRelativeTimeString,
    getWorkflowSteps,
    getDynamicETA,
    getBookingDays,
    bindLiveClock
  };

})(typeof window !== "undefined" ? window : global);
