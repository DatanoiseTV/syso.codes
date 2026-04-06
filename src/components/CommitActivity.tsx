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

export function CommitActivity() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

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

  // figure out which week-index each month label belongs to (first week
  // whose first day is in that month)
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
            <p className="section-eyebrow">Activity</p>
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
          className={`activity__chart${revealed ? " activity__chart--revealed" : ""}`}
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

          {/* Day labels (Mon / Wed / Fri) along the left */}
          <div className="activity__days" aria-hidden="true">
            <span style={{ gridRow: 2 }}>Mon</span>
            <span style={{ gridRow: 4 }}>Wed</span>
            <span style={{ gridRow: 6 }}>Fri</span>
          </div>

          {/* The actual grid */}
          <div className="activity__grid" role="img" aria-label={`${commitActivity.total} contributions in the last year`}>
            {commitActivity.weeks.map((week, weekIndex) =>
              week.days.map((day) => {
                const level = levelFor(day.count);
                const cellIndex = weekIndex * 7 + day.weekday;
                return (
                  <div
                    key={day.date}
                    className={`activity__cell activity__cell--l${level}`}
                    style={
                      {
                        gridColumn: weekIndex + 1,
                        gridRow: day.weekday + 1,
                        "--i": cellIndex,
                      } as React.CSSProperties
                    }
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const parent = (e.currentTarget.closest(".activity__chart") as HTMLElement)?.getBoundingClientRect();
                      if (!parent) return;
                      setHovered({
                        date: day.date,
                        count: day.count,
                        x: rect.left + rect.width / 2 - parent.left,
                        y: rect.top - parent.top - 6,
                      });
                    }}
                  />
                );
              })
            )}
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
