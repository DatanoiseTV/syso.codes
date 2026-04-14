import { useEffect, useMemo, useRef, useState } from "react";
import { commitActivity } from "../data/commitActivity";
import { useCountUp } from "../hooks/useCountUp";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface FlatDay {
  date: string;
  count: number;
  weekday: number;
  weekIndex: number;
  chronoIndex: number;
}

// ease-in-out cubic — gentle acceleration, slow landing
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const PLAYBACK_MS = 10_000; // total playback duration
const TRAIL_LEN = 8; // how many cells behind the playhead glow

export function CommitActivity() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);

  // reveal on scroll
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // flatten days in chronological order
  const flatDays = useMemo<FlatDay[]>(() => {
    const out: FlatDay[] = [];
    commitActivity.weeks.forEach((week, weekIndex) => {
      for (const d of week.days) {
        out.push({
          date: d.date,
          count: d.count,
          weekday: d.weekday,
          weekIndex,
          chronoIndex: out.length,
        });
      }
    });
    return out;
  }, []);

  // running total array so the playback counter is O(1) per frame
  const runningTotals = useMemo(() => {
    let sum = 0;
    return flatDays.map((d) => (sum += d.count));
  }, [flatDays]);

  // today lookup
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayIndex = useMemo(
    () => flatDays.findIndex((d) => d.date === todayIso),
    [flatDays, todayIso]
  );

  // weekday totals
  const weekdayTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    for (const d of flatDays) totals[d.weekday] += d.count;
    return totals;
  }, [flatDays]);
  const weekdayMax = useMemo(
    () => Math.max(1, ...weekdayTotals),
    [weekdayTotals]
  );
  const busiestWeekday = useMemo(
    () => weekdayTotals.indexOf(Math.max(...weekdayTotals)),
    [weekdayTotals]
  );

  // bucket counts into 0..4 levels
  const levelFor = useMemo(() => {
    const max = commitActivity.max;
    return (count: number): number => {
      if (count === 0) return 0;
      if (max <= 4) return Math.min(count, 4);
      const ratio = count / max;
      if (ratio > 0.66) return 4;
      if (ratio > 0.33) return 3;
      if (ratio > 0.1) return 2;
      return 1;
    };
  }, []);

  // eased rAF-driven playback
  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPlaying(false);
      return;
    }
    const total = flatDays.length;
    const startTime = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / PLAYBACK_MS);
      const eased = easeInOutCubic(t);
      const idx = Math.min(total - 1, Math.floor(eased * total));
      setPlayhead(idx);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // settle: hold for ~450ms then clear
        window.setTimeout(() => {
          setPlayhead(null);
          setPlaying(false);
        }, 450);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, flatDays.length]);

  // month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    commitActivity.weeks.forEach((week, weekIndex) => {
      const first = week.days[0];
      if (!first) return;
      const month = new Date(first.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ month: MONTHS[month]!, weekIndex });
        lastMonth = month;
      }
    });
    return labels;
  }, []);

  // playback info: current month + running total (null when not playing)
  const playInfo = useMemo(() => {
    if (playhead == null) return null;
    const day = flatDays[playhead];
    if (!day) return null;
    const d = new Date(day.date);
    return {
      monthName: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      runningTotal: runningTotals[playhead] ?? 0,
      dateLabel: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  }, [playhead, flatDays, runningTotals]);

  const chartClassName = [
    "activity__chart",
    revealed ? "activity__chart--revealed" : "",
    playing || playhead != null ? "activity__chart--playing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section id="activity" className="activity">
      <div className="activity__inner">
        <div className="activity__head">
          <div>
            <p className="section-eyebrow">Activity</p>
            <h2 className="section-title activity__title">
              {playInfo ? (
                <span className="activity__playback-title">
                  <span className="activity__playback-month">
                    {playInfo.monthName}
                  </span>
                  <span className="activity__playback-counter">
                    <span className="activity__count">
                      {playInfo.runningTotal.toLocaleString()}
                    </span>
                    <span className="activity__playback-total">
                      {" "}/ {commitActivity.total.toLocaleString()}
                    </span>
                  </span>
                </span>
              ) : (
                <ActivityTitle total={commitActivity.total} />
              )}
            </h2>
            <p className="section-blurb">
              Pulled live from the GitHub GraphQL API at build time.
              Hit <strong>replay</strong> to watch the year play back —
              each square is one day, colour scales with commits / PRs /
              reviews that day.
            </p>
          </div>

          <div className="activity__stats">
            <Stat label="Total" value={commitActivity.total.toLocaleString()} />
            <Stat label="Active days" value={commitActivity.activeDays.toLocaleString()} />
            <Stat label="Current streak" value={`${commitActivity.currentStreak}d`} />
            <Stat label="Longest streak" value={`${commitActivity.longestStreak}d`} />
          </div>
        </div>

        <div
          ref={ref}
          className={chartClassName}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="activity__months" aria-hidden="true">
            {monthLabels.map((m) => (
              <span
                key={`${m.month}-${m.weekIndex}`}
                className="activity__month"
                style={{ "--col": m.weekIndex } as React.CSSProperties}
              >
                {m.month}
              </span>
            ))}
          </div>

          <button
            type="button"
            className={`activity__play${playing ? " activity__play--active" : ""}`}
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Stop time-lapse" : "Replay the year time-lapse"}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <rect x="2" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
                <rect x="7" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M 3 2 L 10 6 L 3 10 Z" fill="currentColor" />
              </svg>
            )}
            <span>{playing ? "Stop" : "Replay the year"}</span>
          </button>

          <div className="activity__days" aria-hidden="true">
            <span style={{ gridRow: 2 }}>Mon</span>
            <span style={{ gridRow: 4 }}>Wed</span>
            <span style={{ gridRow: 6 }}>Fri</span>
          </div>

          <div
            className="activity__grid"
            role="img"
            aria-label={`${commitActivity.total} contributions in the last year`}
          >
            {flatDays.map((d) => {
              const level = levelFor(d.count);
              const isToday = d.chronoIndex === todayIndex;
              const isPlayhead = playhead === d.chronoIndex;
              const trailK =
                playhead != null && d.chronoIndex < playhead
                  ? playhead - d.chronoIndex
                  : -1;
              const inTrail = trailK > 0 && trailK <= TRAIL_LEN;
              const hiddenByPlayback = playhead != null && d.chronoIndex > playhead;
              return (
                <div
                  key={d.date}
                  className={[
                    "activity__cell",
                    `activity__cell--l${level}`,
                    level === 4 ? "activity__cell--hot" : "",
                    isToday ? "activity__cell--today" : "",
                    isPlayhead ? "activity__cell--playhead" : "",
                    inTrail ? "activity__cell--trail" : "",
                    hiddenByPlayback ? "activity__cell--hidden" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    {
                      gridColumn: d.weekIndex + 1,
                      gridRow: d.weekday + 1,
                      "--i": d.chronoIndex,
                      "--trail-k": inTrail ? trailK : 0,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const parent = (
                      e.currentTarget.closest(".activity__chart") as HTMLElement
                    )?.getBoundingClientRect();
                    if (!parent) return;
                    setHovered({
                      date: d.date,
                      count: d.count,
                      x: rect.left + rect.width / 2 - parent.left,
                      y: rect.top - parent.top - 6,
                    });
                  }}
                />
              );
            })}
          </div>

          <div className="activity__legend" aria-hidden="true">
            <span className="activity__legend-label">Less</span>
            <div className="activity__legend-cell activity__cell--l0" />
            <div className="activity__legend-cell activity__cell--l1" />
            <div className="activity__legend-cell activity__cell--l2" />
            <div className="activity__legend-cell activity__cell--l3" />
            <div className="activity__legend-cell activity__cell--l4" />
            <span className="activity__legend-label">More</span>
          </div>

          <div
            className="activity__weekday"
            role="img"
            aria-label={`Busiest weekday: ${WEEKDAYS[busiestWeekday]}`}
          >
            <span className="activity__weekday-label">By weekday</span>
            <div className="activity__weekday-bars">
              {weekdayTotals.map((t, i) => (
                <div key={i} className="activity__weekday-col">
                  <div
                    className={`activity__weekday-bar${i === busiestWeekday ? " activity__weekday-bar--peak" : ""}`}
                    style={{ height: `${(t / weekdayMax) * 100}%` }}
                    title={`${WEEKDAYS[i]}: ${t.toLocaleString()}`}
                  />
                  <span className="activity__weekday-tick">
                    {WEEKDAYS[i]![0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {hovered && (
            <div
              className="activity__tooltip"
              style={{ left: `${hovered.x}px`, top: `${hovered.y}px` }}
            >
              <strong>{hovered.count}</strong>{" "}
              {hovered.count === 1 ? "contribution" : "contributions"}
              <span className="activity__tooltip-date">
                {formatDate(hovered.date)}
              </span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

function ActivityTitle({ total }: { total: number }) {
  const [n, ref] = useCountUp(total, { duration: 1800 });
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>
      <span className="activity__count">{n.toLocaleString()}</span>{" "}
      contributions in the last year.
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="activity-stat">
      <div className="activity-stat__value">{value}</div>
      <div className="activity-stat__label">{label}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
