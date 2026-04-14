import { useMemo } from "react";
import { commitActivity } from "../data/commitActivity";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function Activity() {
  const todayIso = new Date().toISOString().slice(0, 10);

  const levelFor = useMemo(() => {
    const max = commitActivity.max;
    return (count: number) => {
      if (count === 0) return 0;
      if (max <= 4) return Math.min(count, 4);
      const ratio = count / max;
      if (ratio > 0.66) return 4;
      if (ratio > 0.33) return 3;
      if (ratio > 0.1) return 2;
      return 1;
    };
  }, []);

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let last = -1;
    commitActivity.weeks.forEach((w, i) => {
      const first = w.days[0];
      if (!first) return;
      const m = new Date(first.date).getMonth();
      if (m !== last) {
        labels.push({ month: MONTHS[m]!, weekIndex: i });
        last = m;
      }
    });
    return labels;
  }, []);

  return (
    <section className="section wide" id="activity">
      <div className="activity__head">
        <div>
          <p className="section__label">Activity</p>
          <h2 className="section__title">The last year of commits.</h2>
        </div>
        <div className="activity__head-stats">
          <span>
            <strong>{commitActivity.total.toLocaleString()}</strong> commits
          </span>
          <span>
            <strong>{commitActivity.activeDays}</strong> active days
          </span>
          <span>
            <strong>{commitActivity.longestStreak}d</strong> longest streak
          </span>
        </div>
      </div>

      <div className="activity__card">
        <div className="activity__inner">
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
            {commitActivity.weeks.map((w, wi) =>
              w.days.map((d) => {
                const lvl = levelFor(d.count);
                const isToday = d.date === todayIso;
                return (
                  <div
                    key={d.date}
                    className={`cell${lvl > 0 ? ` cell--l${lvl}` : ""}${
                      isToday ? " cell--today" : ""
                    }`}
                    style={{ gridColumn: wi + 1, gridRow: d.weekday + 1 }}
                    title={`${d.date} · ${d.count} ${d.count === 1 ? "commit" : "commits"}`}
                  />
                );
              })
            )}
          </div>
        </div>
        <div className="activity__legend" aria-hidden="true">
          <span>Less</span>
          <div className="cell" />
          <div className="cell cell--l1" />
          <div className="cell cell--l2" />
          <div className="cell cell--l3" />
          <div className="cell cell--l4" />
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
