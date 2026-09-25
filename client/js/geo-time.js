/**
 * TORQUE & CO / HABESHA AUTO — GEOLOCATION & DYNAMIC TIME ENGINE
 * Resolves browser/device geographic timezone, locale, and calculates dynamic local timestamps,
 * business hours, appointment scheduling calendars, and live shop workflow ETAs.
 */

(function (window) {
  "use strict";

  // Official Business Operating Hours
  // Monday - Friday: 8:00 AM - 5:00 PM
  // Saturday: 9:00 AM - 3:00 PM
  // Sunday: Closed
  const BUSINESS_HOURS = {
    schedule: {
      1: { name: "Monday", openHour: 8, openMinute: 0, closeHour: 17, closeMinute: 0, label: "8:00 AM – 5:00 PM" },
      2: { name: "Tuesday", openHour: 8, openMinute: 0, closeHour: 17, closeMinute: 0, label: "8:00 AM – 5:00 PM" },
      3: { name: "Wednesday", openHour: 8, openMinute: 0, closeHour: 17, closeMinute: 0, label: "8:00 AM – 5:00 PM" },
      4: { name: "Thursday", openHour: 8, openMinute: 0, closeHour: 17, closeMinute: 0, label: "8:00 AM – 5:00 PM" },
      5: { name: "Friday", openHour: 8, openMinute: 0, closeHour: 17, closeMinute: 0, label: "8:00 AM – 5:00 PM" },
      6: { name: "Saturday", openHour: 9, openMinute: 0, closeHour: 15, closeMinute: 0, label: "9:00 AM – 3:00 PM" },
      0: { name: "Sunday", isClosed: true, label: "Closed" }
    },
    summaryText: "Mon–Fri: 8:00 AM – 5:00 PM | Sat: 9:00 AM – 3:00 PM | Sun: Closed",
    keyDropPolicy: "Key Drop Box is ONLY accessible & permitted during business hours (Mon–Fri 8:00 AM–5:00 PM, Sat 9:00 AM–3:00 PM). Habesha Auto assumes NO responsibility or liability for keys or vehicles left outside business hours, in any neighborhood area, or outside the facility fence."
  };

  // Cache resolved timezone & locale
  let detectedInfo = null;

  function detectGeoTimezone() {
    if (detectedInfo) return detectedInfo;

    let timeZone = "America/Denver"; // sensible default fallback
    let locale = (typeof navigator !== "undefined" && navigator.language) ? navigator.language : "en-US";

    try {
      if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";
      }
    } catch (e) {
      console.warn("Timezone resolution fallback to default:", e);
    }

    // Extract City / Region from IANA string
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

  // Determine if the repair shop is currently open based on business operating hours
  function isShopOpen(baseDate = new Date()) {
    const geo = detectGeoTimezone();
    const d = (baseDate instanceof Date) ? baseDate : new Date(baseDate);

    let dayOfWeek = d.getDay();
    let currentHour = d.getHours();
    let currentMin = d.getMinutes();

    try {
      const hourFormatter = new Intl.DateTimeFormat(geo.locale, { hour: "numeric", hour12: false, timeZone: geo.timeZone });
      const minFormatter = new Intl.DateTimeFormat(geo.locale, { minute: "numeric", timeZone: geo.timeZone });
      currentHour = parseInt(hourFormatter.format(d), 10);
      currentMin = parseInt(minFormatter.format(d), 10);
    } catch (e) {
      // fallback
    }

    const currentMinutesOfDay = currentHour * 60 + currentMin;
    const sched = BUSINESS_HOURS.schedule[dayOfWeek];

    if (!sched || sched.isClosed) {
      return {
        isOpen: false,
        statusText: "Closed",
        badgeClass: "pill-warning",
        label: "Closed (Sundays)",
        hoursText: sched ? sched.label : "Closed",
        schedule: BUSINESS_HOURS.schedule,
        summary: BUSINESS_HOURS.summaryText,
        keyDropPolicy: BUSINESS_HOURS.keyDropPolicy
      };
    }

    const openMinOfDay = sched.openHour * 60 + sched.openMinute;
    const closeMinOfDay = sched.closeHour * 60 + sched.closeMinute;
    const isOpen = currentMinutesOfDay >= openMinOfDay && currentMinutesOfDay < closeMinOfDay;

    return {
      isOpen,
      statusText: isOpen ? "Open Now" : "Closed Now",
      badgeClass: isOpen ? "pill-good" : "pill-warning",
      label: isOpen ? `Open Today (${sched.label})` : `Closed Now (Hours: ${sched.label})`,
      hoursText: sched.label,
      schedule: BUSINESS_HOURS.schedule,
      summary: BUSINESS_HOURS.summaryText,
      keyDropPolicy: BUSINESS_HOURS.keyDropPolicy
    };
  }

  // Time slots per day of week according to business operating hours
  function getTimeSlotsForDay(dayOfWeek) {
    if (dayOfWeek === 0) {
      // Sunday - Closed
      return [];
    }
    if (dayOfWeek === 6) {
      // Saturday - 9:00 AM to 3:00 PM
      return ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "2:30 PM"];
    }
    // Monday - Friday: 8:00 AM to 5:00 PM
    return ["8:00 AM", "9:30 AM", "11:00 AM", "12:30 PM", "2:00 PM", "3:30 PM", "4:30 PM"];
  }

  // Parse time string like "8:00 AM", "12:30 PM", "2:00 PM" into minutes from midnight (0 - 1440)
  function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Parse human-readable service duration into minutes (e.g. "1.5 hrs" -> 90, "45 mins" -> 45, "1.0 hr" -> 60)
  function getServiceDurationMinutes(durationStr) {
    if (!durationStr || typeof durationStr !== "string") return 60;
    const str = durationStr.toLowerCase();
    if (str.includes("–") || str.includes("-")) {
      const parts = str.split(/[–-]/);
      return getServiceDurationMinutes(parts[parts.length - 1]);
    }
    const hrMatch = str.match(/([\d.]+)\s*(?:hr|hour)/);
    if (hrMatch) {
      return Math.round(parseFloat(hrMatch[1]) * 60);
    }
    const minMatch = str.match(/(\d+)\s*(?:min|m)/);
    if (minMatch) {
      return parseInt(minMatch[1], 10);
    }
    return 60;
  }

  // Evaluate time slots for a day considering current time (if today) and cumulative service duration vs closing hour
  function getDetailedTimeSlots(dayOfWeek, isToday = false, durationMinutes = 60, baseDate = new Date()) {
    const rawSlots = getTimeSlotsForDay(dayOfWeek);
    if (!rawSlots || rawSlots.length === 0) return [];

    const sched = BUSINESS_HOURS.schedule[dayOfWeek];
    const closeMinOfDay = sched ? (sched.closeHour * 60 + sched.closeMinute) : 1020; // 5:00 PM default (17:00)
    const closeLabel = sched ? (sched.closeHour > 12 ? `${sched.closeHour - 12}:00 PM` : `${sched.closeHour}:00 AM`) : "5:00 PM";

    let currentMinutesOfDay = 0;
    if (isToday) {
      const d = (baseDate instanceof Date) ? baseDate : new Date(baseDate);
      const geo = detectGeoTimezone();
      try {
        const hourFormatter = new Intl.DateTimeFormat(geo.locale, { hour: "numeric", hour12: false, timeZone: geo.timeZone });
        const minFormatter = new Intl.DateTimeFormat(geo.locale, { minute: "numeric", timeZone: geo.timeZone });
        const h = parseInt(hourFormatter.format(d), 10);
        const m = parseInt(minFormatter.format(d), 10);
        currentMinutesOfDay = h * 60 + m;
      } catch (e) {
        currentMinutesOfDay = d.getHours() * 60 + d.getMinutes();
      }
    }

    return rawSlots.map(slotTime => {
      const slotMinutes = parseTimeToMinutes(slotTime);
      const isPast = isToday && (slotMinutes < currentMinutesOfDay + 30); // 30-min lead buffer
      const finishMinutes = slotMinutes + durationMinutes;
      const isExceedingClose = finishMinutes > closeMinOfDay;
      const isAvailable = !isPast && !isExceedingClose;

      let reason = "";
      if (isPast) {
        reason = "Past time slot";
      } else if (isExceedingClose) {
        const durHours = (durationMinutes / 60).toFixed(1).replace(/\.0$/, "");
        reason = `Exceeds ${closeLabel} close (${durHours}h work)`;
      }

      return {
        time: slotTime,
        minutes: slotMinutes,
        finishMinutes,
        isPast,
        isExceedingClose,
        isAvailable,
        reason
      };
    });
  }

  // Dynamically calculate the 5 workflow steps relative to current time and step index
  function getWorkflowSteps(currentStepIndex = 2, baseDate = new Date()) {
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

    const shopStatus = isShopOpen(baseDate);
    if (!shopStatus.isOpen) {
      const d = (baseDate instanceof Date) ? new Date(baseDate) : new Date();
      let dayOfWeek = d.getDay();
      let sched = BUSINESS_HOURS.schedule[dayOfWeek];
      const currentMinOfDay = d.getHours() * 60 + d.getMinutes();
      const openMinToday = sched ? (sched.openHour * 60 + sched.openMinute) : 480;

      if (sched && !sched.isClosed && currentMinOfDay < openMinToday) {
        const targetMin = openMinToday + mins;
        const targetHour = Math.floor(targetMin / 60);
        const targetMinute = targetMin % 60;
        const etaDate = new Date(d);
        etaDate.setHours(targetHour, targetMinute, 0, 0);
        return `${formatTime(etaDate)} (Reopening)`;
      } else {
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        let nextDow = nextDay.getDay();
        let nextSched = BUSINESS_HOURS.schedule[nextDow];
        while (!nextSched || nextSched.isClosed) {
          nextDay.setDate(nextDay.getDate() + 1);
          nextDow = nextDay.getDay();
          nextSched = BUSINESS_HOURS.schedule[nextDow];
        }
        const openMin = nextSched.openHour * 60 + nextSched.openMinute;
        const targetMin = openMin + mins;
        const targetHour = Math.floor(targetMin / 60);
        const targetMinute = targetMin % 60;
        nextDay.setHours(targetHour, targetMinute, 0, 0);
        const dayLabel = (nextDay.getDate() === d.getDate() + 1) ? "Tomorrow" : nextDay.toLocaleDateString("en-US", { weekday: "short" });
        return `${dayLabel} ${formatTime(nextDay)} (Reopening)`;
      }
    }

    return formatTime(getRelativeDate(mins, baseDate));
  }

  // Generate real calendar days for online booking starting today in viewer's timezone
  function getBookingDays(count = 7, durationMinutes = 60, baseDate = new Date()) {
    const geo = detectGeoTimezone();
    const days = [];
    const now = (baseDate instanceof Date) ? baseDate : new Date(baseDate);

    for (let i = 0; i < count; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const dowShort = new Intl.DateTimeFormat(geo.locale, { weekday: "short", timeZone: geo.timeZone }).format(d);
      const monthShort = new Intl.DateTimeFormat(geo.locale, { month: "short", timeZone: geo.timeZone }).format(d);
      const dayNum = parseInt(new Intl.DateTimeFormat(geo.locale, { day: "numeric", timeZone: geo.timeZone }).format(d), 10);
      const year = d.getFullYear();
      const dayOfWeek = d.getDay();
      const sched = BUSINESS_HOURS.schedule[dayOfWeek];
      const isClosed = Boolean(sched && sched.isClosed);
      const isToday = i === 0;

      const detailedSlots = getDetailedTimeSlots(dayOfWeek, isToday, durationMinutes, now);
      const availableSlots = detailedSlots.filter(s => s.isAvailable);
      const hasAvailableSlots = !isClosed && availableSlots.length > 0;

      days.push({
        dow: dowShort,
        num: dayNum,
        month: monthShort,
        year: year,
        dayOfWeek: dayOfWeek,
        isToday: isToday,
        isClosed: isClosed,
        hasAvailableSlots: hasAvailableSlots,
        availableSlotsCount: availableSlots.length,
        hoursLabel: sched ? sched.label : "Closed",
        slots: getTimeSlotsForDay(dayOfWeek),
        detailedSlots: detailedSlots,
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
      const shopStatus = isShopOpen(now);

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
        options.renderCustom(el, { timeStr, dateStr, geo, shopStatus, now });
        return;
      }

      let statusBadgeHtml = `<span class="pill ${shopStatus.badgeClass}" style="font-size:10.5px; padding:2px 8px;">${shopStatus.statusText}</span>`;
      if (options.context === "staff" || options.isStaffView) {
        if (!shopStatus.isOpen) {
          statusBadgeHtml = `<span class="pill pill-accent" style="font-size:10.5px; padding:2px 8px; font-weight:700; background:rgba(255,90,31,0.18); color:#fb923c; border:1px solid rgba(255,90,31,0.4);">🌙 Night Shift / Active Labor</span>`;
        } else {
          statusBadgeHtml = `<span class="pill pill-good" style="font-size:10.5px; padding:2px 8px; font-weight:700; background:rgba(34,197,94,0.15); color:#86efac; border:1px solid rgba(34,197,94,0.35);">Open Floor (Active Shift)</span>`;
        }
      }

      if (options.compact) {
        el.innerHTML = `<span style="color:#fff; font-weight:700;">${timeStr}</span> <span style="opacity:0.75;">${geo.abbreviation}</span>`;
      } else {
        el.innerHTML = `<span style="color:#fff; font-weight:700;">${timeStr} ${geo.abbreviation}</span> • <span style="color:var(--text-secondary);">${geo.city}</span> • <span style="opacity:0.8;">${dateStr}</span> • ${statusBadgeHtml}`;
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
    getTimeSlotsForDay,
    parseTimeToMinutes,
    getServiceDurationMinutes,
    getDetailedTimeSlots,
    isShopOpen,
    BUSINESS_HOURS,
    bindLiveClock
  };

})(typeof window !== "undefined" ? window : global);
