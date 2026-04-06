// Fetches a year of contribution data from the GitHub GraphQL API and
// writes it to src/data/commitActivity.ts.
//
// Usage:
//   node scripts/gen-commit-activity.mjs
//
// Requires the `gh` CLI to be installed and authenticated.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const USER = "DatanoiseTV";

const query = `
query {
  user(login: "${USER}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            weekday
          }
        }
      }
    }
  }
}`;

const out = execSync(`gh api graphql -f query='${query}'`, { encoding: "utf8" });
const data = JSON.parse(out);
const cal = data.data.user.contributionsCollection.contributionCalendar;

// Flatten + compute streaks
const allDays = cal.weeks.flatMap((w) => w.contributionDays);
const today = new Date().toISOString().slice(0, 10);

let currentStreak = 0;
let longestStreak = 0;
let runningStreak = 0;
for (const day of allDays) {
  if (day.contributionCount > 0) {
    runningStreak += 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  } else {
    runningStreak = 0;
  }
}
// Current streak: count back from today (or yesterday) until we hit a zero day
const reversed = [...allDays].reverse();
let started = false;
for (const day of reversed) {
  if (day.date > today) continue;
  if (day.contributionCount > 0) {
    currentStreak += 1;
    started = true;
  } else if (started) {
    break;
  } else if (day.date === today) {
    // today has 0 contributions but streak might still be running from yesterday
    continue;
  } else {
    break;
  }
}

const max = Math.max(...allDays.map((d) => d.contributionCount));
const total = cal.totalContributions;
const activeDays = allDays.filter((d) => d.contributionCount > 0).length;

const ts = `// AUTO-GENERATED — re-run \`node scripts/gen-commit-activity.mjs\`
// Source: GitHub GraphQL contributionsCollection.contributionCalendar
// User: ${USER}

export interface CommitDay {
  date: string;
  count: number;
  weekday: number;
}

export interface CommitWeek {
  days: CommitDay[];
}

export const commitActivity = {
  user: ${JSON.stringify(USER)},
  total: ${total},
  max: ${max},
  activeDays: ${activeDays},
  currentStreak: ${currentStreak},
  longestStreak: ${longestStreak},
  fetchedAt: ${JSON.stringify(new Date().toISOString())},
  weeks: ${JSON.stringify(
    cal.weeks.map((w) => ({
      days: w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        weekday: d.weekday,
      })),
    })),
    null,
    2
  )},
} as const;
`;

writeFileSync(resolve(root, "src/data/commitActivity.ts"), ts);
console.log(
  `Wrote ${cal.weeks.length} weeks · ${total} total · ${activeDays} active days · current streak ${currentStreak} · longest streak ${longestStreak}`
);
