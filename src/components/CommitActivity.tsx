import { useEffect, useMemo, useRef, useState } from "react";
import { commitActivity } from "../data/commitActivity";

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

// Flatten day data once, with its chronological index so playback can
// reveal cells in real order even though the grid is laid out by week.
interface FlatDay {
  date: string;
  count: number;
  weekday: number;
  weekIndex: number;
  chronoIndex: number;
}

export function CommitActivity() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // playback: when playing, playhead advances day-by-day; cells beyond
  // the playhead are hidden, the current playhead cell is emphasised.
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

  // map date → chronoIndex so we can find today fast
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayIndex = useMemo(
    () => flatDays.findIndex((d) => d.date === todayIso),
    [flatDays, todayIso]
  );

  // weekday totals for the mini bar chart (0=Sun … 6=Sat)
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

  // bucket counts into 0..4 levels relative to the busiest day
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

  // playback loop
  useEffect(() => {
    if (!playing) return;
    let idx = 0;
    setPlayhead(0);
    const totalDays = flatDays.length;
    // ~2.4s total: 371 days / ~150 fps feel → 8ms/day, but only apply
    // once per animation frame so the browser never stalls.
    const MS_PER_DAY = Math.max(4, Math.floor(2400 / totalDays));
    const id = window.setInterval(() => {
      idx += 1;
      if (idx >= totalDays) {
        setPlayhead(null);
        setPlaying(false);
        window.clearInterval(id);
        return;
      }
      setPlayhead(idx);
    }, MS_PER_DAY);
    return () => window.clearInterval(id);
  }, [playing, flatDays.length]);

  // month labels (first week in each month)
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

  return (
    <section id="activity" className="activity">
      <div className="activity__inner">
        <div className="activity__head">
          <div>
            <p className="section-eyebrow">
              <span className="section-num">02</span>Activity
            </p>
            <h2 className="section-title">
              <span className="activity__count">{commitActivity.total.toLocaleString()}</span>{" "}
              contributions in the last year.
            </h2>
            <p className="section-blurb">
              Pulled live from the GitHub GraphQL API at build time.
              Each square is one day, and the colour scales with the number
              of commits, PRs and reviews that day.
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
          className={`activity__chart${revealed ? " activity__chart--revealed" : ""}${playing || playhead != null ? " activity__chart--playing" : ""}`}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Month labels along the top */}
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

          {/* Playback control */}
          <button
            type="button"
            className="activity__play"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Stop time-lapse" : "Play time-lapse of the year"}
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

          {/* Day labels (Mon / Wed / Fri) along the left */}
          <div className="activity__days" aria-hidden="true">
            <span style={{ gridRow: 2 }}>Mon</span>
            <span style={{ gridRow: 4 }}>Wed</span>
            <span style={{ gridRow: 6 }}>Fri</span>
          </div>

          {/* The actual grid */}
          <div
            className="activity__grid"
            role="img"
            aria-label={`${commitActivity.total} contributions in the last year`}
          >
            {flatDays.map((d) => {
              const level = levelFor(d.count);
              const isToday = d.chronoIndex === todayIndex;
              const isPlayhead = playhead === d.chronoIndex;
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
                    hiddenByPlayback ? "activity__cell--hidden" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    {
                      gridColumn: d.weekIndex + 1,
                      gridRow: d.weekday + 1,
                      "--i": d.chronoIndex,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const parent = (e.currentTarget.closest(".activity__chart") as HTMLElement)?.getBoundingClientRect();
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

          {/* Legend */}
          <div className="activity__legend" aria-hidden="true">
            <span className="activity__legend-label">Less</span>
            <div className="activity__legend-cell activity__cell--l0" />
            <div className="activity__legend-cell activity__cell--l1" />
            <div className="activity__legend-cell activity__cell--l2" />
            <div className="activity__legend-cell activity__cell--l3" />
            <div className="activity__legend-cell activity__cell--l4" />
            <span className="activity__legend-label">More</span>
          </div>

          {/* Weekday summary */}
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

          {/* Hover tooltip */}
          {hovered && (
            <div
              className="activity__tooltip"
              style={{
                left: `${hovered.x}px`,
                top: `${hovered.y}px`,
              }}
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
