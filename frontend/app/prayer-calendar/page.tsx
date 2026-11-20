"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LocationChoice = { name: string; latitude: number; longitude: number };
type Timings = { Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string };
type HijriDate = { day: string; month: { en: string; number: number }; year: string; weekday?: { en: string } };
type PrayerResponse = { code: number; data?: { timings: Timings; date: { hijri: HijriDate } } };

const CITIES: LocationChoice[] = [
  { name: "Greater Noida, India", latitude: 28.4744, longitude: 77.5040 },
  { name: "Noida, India", latitude: 28.5355, longitude: 77.3910 },
  { name: "Ghaziabad, India", latitude: 28.6692, longitude: 77.4538 },
  { name: "Delhi, India", latitude: 28.6139, longitude: 77.2090 },
  { name: "Lucknow, India", latitude: 26.8467, longitude: 80.9462 },
  { name: "Patna, India", latitude: 25.5941, longitude: 85.1376 },
  { name: "Mumbai, India", latitude: 19.0760, longitude: 72.8777 },
  { name: "Hyderabad, India", latitude: 17.3850, longitude: 78.4867 },
  { name: "Bengaluru, India", latitude: 12.9716, longitude: 77.5946 },
  { name: "Kolkata, India", latitude: 22.5726, longitude: 88.3639 },
  { name: "Chennai, India", latitude: 13.0827, longitude: 80.2707 },
];

const PRAYERS: { key: keyof Timings; label: string }[] = [
  { key: "Fajr", label: "Fajr" },
  { key: "Dhuhr", label: "Dhuhr" },
  { key: "Asr", label: "Asr" },
  { key: "Maghrib", label: "Maghrib" },
  { key: "Isha", label: "Isha" },
];

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah",
  "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qa'dah", "Dhul Hijjah",
];

function localDateString(date: Date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}-${m}-${date.getFullYear()}`;
}

function hijriParts(date: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric", month: "numeric", year: "numeric",
    }).formatToParts(date);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
    return { day: get("day"), month: get("month"), year: get("year") };
  } catch {
    return { day: 0, month: 0, year: 0 };
  }
}

function hijriLabel(date: Date) {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric", month: "long", year: "numeric",
    }).format(date);
  } catch {
    return "Hijri date unavailable";
  }
}

function eventForHijri(month: number, day: number) {
  if (month === 1 && day === 1) return "Islamic New Year";
  if (month === 1 && day === 10) return "Day of Ashura";
  if (month === 3 && day === 12) return "Mawlid (date observed by some communities)";
  if (month === 7 && day === 27) return "Isra and Mi'raj (observance varies)";
  if (month === 9 && day === 1) return "First day of Ramadan";
  if (month === 9 && day === 27) return "Laylat al-Qadr (commonly observed)";
  if (month === 10 && day === 1) return "Eid al-Fitr";
  if (month === 12 && day === 9) return "Day of Arafah";
  if (month === 12 && day === 10) return "Eid al-Adha";
  return "";
}

function minutesUntil(time: string, now: Date) {
  const match = time.match(/^(\\d{1,2}):(\\d{2})/);
  if (!match) return null;
  const target = new Date(now);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);
  if (target <= now) return null;
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

function minutesUntilTomorrow(time: string, now: Date) {
  const match = time.match(/^(\\d{1,2}):(\\d{2})/);
  if (!match) return null;
  const target = new Date(now);
  target.setDate(target.getDate() + 1);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

function countdownLabel(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function PrayerCalendarPage() {
  const [locationLabel, setLocationLabel] = useState("");
  const [timings, setTimings] = useState<Timings | null>(null);
  const [tomorrowFajr, setTomorrowFajr] = useState("05:00");
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [gpsBusy, setGpsBusy] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadPrayerTimes = useCallback(async (place: LocationChoice, label: string) => {
    setLoading(true);
    setError("");
    setLocationLabel(label);
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const makeUrl = (date: Date) => {
        const query = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          method: "1",
          school: "1",
          calendarMethod: "UAQ",
        });
        return `https://api.aladhan.com/v1/timings/${localDateString(date)}?${query.toString()}`;
      };
      const [todayResponse, tomorrowResponse] = await Promise.all([
        fetch(makeUrl(today), { cache: "no-store" }),
        fetch(makeUrl(tomorrow), { cache: "no-store" }),
      ]);
      if (!todayResponse.ok || !tomorrowResponse.ok) throw new Error("Prayer-time service is temporarily unavailable.");
      const [todayJson, tomorrowJson] = await Promise.all([
        todayResponse.json() as Promise<PrayerResponse>,
        tomorrowResponse.json() as Promise<PrayerResponse>,
      ]);
      if (todayJson.code !== 200 || !todayJson.data?.timings) throw new Error("Prayer timings could not be loaded for this location.");
      setTimings(todayJson.data.timings);
      setHijri(todayJson.data.date.hijri);
      setTomorrowFajr(tomorrowJson.data?.timings?.Fajr || "05:00");
    } catch (e) {
      setTimings(null);
      setHijri(null);
      setError(e instanceof Error ? e.message : "Something went wrong while loading prayer times.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setError("GPS is not available in this browser. Please choose your city instead.");
      return;
    }
    setGpsBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place = {
          name: "Your current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        void loadPrayerTimes(place, "Current location (GPS)");
        setGpsBusy(false);
      },
      () => {
        setError("Location permission was not granted. You can still choose a city manually.");
        setGpsBusy(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const nextPrayer = useMemo(() => {
    if (!timings) return null;
    for (const prayer of PRAYERS) {
      const seconds = minutesUntil(timings[prayer.key], now);
      if (seconds !== null) return { ...prayer, time: timings[prayer.key], seconds };
    }
    const seconds = minutesUntilTomorrow(tomorrowFajr, now);
    return { key: "Fajr" as keyof Timings, label: "Fajr", time: tomorrowFajr, seconds: seconds ?? 0, tomorrow: true };
  }, [timings, tomorrowFajr, now]);

  const monthDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [monthCursor]);

  const upcomingEvents = useMemo(() => {
    const items: { date: Date; title: string }[] = [];
    for (let offset = 0; offset < 370 && items.length < 5; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const parts = hijriParts(date);
      const title = eventForHijri(parts.month, parts.day);
      if (title) items.push({ date, title });
    }
    return items;
  }, [now]);

  const ramadanCountdown = useMemo(() => {
    for (let offset = 0; offset < 370; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const parts = hijriParts(date);
      if (parts.month === 9 && parts.day === 1) return offset;
    }
    return null;
  }, [now]);

  const currentHijri = hijri ? `${hijri.day} ${hijri.month.en} ${hijri.year} AH` : hijriLabel(now);

  return (
    <div className="prayer-page">
      <section className="prayer-hero">
        <div className="prayer-eyebrow">DAILY WORSHIP COMPANION</div>
        <h1>Prayer times & <span>Hijri calendar</span></h1>
        <p>Keep track of the five daily prayers and important dates in the Islamic calendar.</p>
        <div className="prayer-date-strip">
          <div><span>Today</span><strong>{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong></div>
          <div><span>Hijri date</span><strong>{currentHijri}</strong></div>
        </div>
      </section>

      <div className="prayer-content">
        <section className="prayer-panel location-panel">
          <div>
            <div className="prayer-section-kicker">YOUR LOCATION</div>
            <h2>Prayer times near you</h2>
            <p className="prayer-muted">Choose a city or allow GPS when you want local timings. GPS is off by default.</p>
          </div>
          <div className="location-controls">
            <label className="sr-only" htmlFor="prayer-city">Choose city</label>
            <select id="prayer-city" className="input-field" value="" onChange={(event) => {
              const place = CITIES.find((city) => city.name === event.target.value);
              if (place) void loadPrayerTimes(place, place.name);
            }}>
              <option value="" disabled>Choose your city</option>
              {CITIES.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
            </select>
            <button type="button" className="btn-secondary gps-button" onClick={requestGps} disabled={gpsBusy || loading}>
              {gpsBusy ? "Requesting permission…" : "◎ Use my location"}
            </button>
          </div>
          {locationLabel && <p className="location-selected">Showing timings for: <strong>{locationLabel}</strong></p>}
          {error && <p className="prayer-error" role="alert">{error}</p>}
        </section>

        <div className="prayer-main-grid">
          <section className="prayer-panel times-panel">
            <div className="panel-heading">
              <div><div className="prayer-section-kicker">TODAY'S SCHEDULE</div><h2>Five daily prayers</h2></div>
              {loading && <span className="prayer-loading">Updating…</span>}
            </div>
            {!timings && !loading ? (
              <div className="prayer-empty"><span>☾</span><strong>Select your city to see prayer times</strong><p>Your location is never requested automatically.</p></div>
            ) : (
              <div className="prayer-times-list">
                {PRAYERS.map((prayer) => (
                  <div className={nextPrayer?.key === prayer.key ? "prayer-time-row next" : "prayer-time-row"} key={prayer.key}>
                    <span className="prayer-time-icon">{prayer.key === "Fajr" ? "☾" : prayer.key === "Dhuhr" ? "☀" : prayer.key === "Asr" ? "◒" : prayer.key === "Maghrib" ? "◉" : "✦"}</span>
                    <span className="prayer-time-name">{prayer.label}</span>
                    <strong>{timings ? timings[prayer.key] : "--:--"}</strong>
                    {nextPrayer?.key === prayer.key && <span className="next-tag">NEXT</span>}
                  </div>
                ))}
              </div>
            )}
            <p className="calculation-note">Calculation: Karachi method · Hanafi Asr. Timings can differ from your local mosque; follow your mosque's timetable when it differs.</p>
          </section>

          <section className="prayer-panel next-panel">
            <div className="prayer-section-kicker">UP NEXT</div>
            <h2>{nextPrayer ? nextPrayer.label : "Your next prayer"}</h2>
            <p className="prayer-muted">{nextPrayer ? (nextPrayer.tomorrow ? "Tomorrow's first prayer" : "Time remaining") : "Choose a location to begin"}</p>
            <div className="prayer-countdown">{nextPrayer ? countdownLabel(nextPrayer.seconds) : "--:--:--"}</div>
            <div className="countdown-caption">{nextPrayer ? `Prayer time · ${nextPrayer.time}` : "Your daily prayer schedule"}</div>
            <div className="next-panel-decoration">☾</div>
          </section>
        </div>

        <section className="prayer-panel calendar-panel">
          <div className="calendar-heading">
            <div><div className="prayer-section-kicker">ISLAMIC DATES</div><h2>Hijri calendar</h2><p className="prayer-muted">Gregorian month with corresponding Hijri dates.</p></div>
            <div className="calendar-controls">
              <button type="button" aria-label="Previous month" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>‹</button>
              <strong>{monthCursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong>
              <button type="button" aria-label="Next month" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>›</button>
            </div>
          </div>
          <div className="hijri-calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
            {monthDays.map((date, index) => {
              if (!date) return <div className="calendar-blank" key={`blank-${index}`} />;
              const parts = hijriParts(date);
              const event = eventForHijri(parts.month, parts.day);
              const isToday = date.toDateString() === now.toDateString();
              return <div key={date.toISOString()} className={`calendar-day ${isToday ? "today" : ""} ${event ? "has-event" : ""}`}>
                <span className="gregorian-day">{date.getDate()}</span>
                <span className="hijri-day">{parts.day || "—"} {HIJRI_MONTHS[parts.month - 1]?.slice(0, 3) || ""}</span>
                {event && <span className="calendar-event-dot" title={event} />}
              </div>;
            })}
          </div>
          <p className="calendar-caveat">Hijri dates are calculated using the Umm al-Qura calendar and may differ by a day from local moon-sighting announcements.</p>
        </section>

        <div className="prayer-bottom-grid">
          <section className="prayer-panel ramadan-panel">
            <div className="prayer-section-kicker">A MONTH OF MERCY</div>
            <h2>Ramadan countdown</h2>
            <strong className="ramadan-number">{ramadanCountdown === null ? "—" : ramadanCountdown === 0 ? "Ramadan Mubarak" : `${ramadanCountdown} days`}</strong>
            <p className="prayer-muted">Estimated from the calculated Hijri calendar. The official start depends on local moon sighting.</p>
          </section>
          <section className="prayer-panel events-panel">
            <div className="prayer-section-kicker">MARK YOUR CALENDAR</div>
            <h2>Upcoming Islamic dates</h2>
            {upcomingEvents.length ? upcomingEvents.map((item) => <div className="upcoming-event" key={item.title + item.date.toISOString()}><span>{item.title}</span><strong>{item.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></div>) : <p className="prayer-muted">Upcoming dates will appear here.</p>}
          </section>
        </div>
        <p className="prayer-privacy">Privacy: GPS is only requested after you tap “Use my location”. Coordinates are used to request prayer times and are not saved by this page.</p>
      </div>
    </div>
  );
}
