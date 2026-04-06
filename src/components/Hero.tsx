interface Props {
  publicRepos: number;
  totalStars: number;
  followers: number;
}

export function Hero({ publicRepos, totalStars, followers }: Props) {
  return (
    <header className="hero">
      <div className="hero__inner">
        <div className="hero__eyebrow">
          <span className="hero__dot" /> Berlin · open source · since forever
        </div>
        <h1 className="hero__title">
          I build tools where<br />
          <span className="hero__title-accent">audio meets silicon.</span>
        </h1>
        <p className="hero__lede">
          Hi, I&apos;m <strong>Sylwester</strong> — also known as{" "}
          <a className="hero__handle" href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            DatanoiseTV
          </a>
          . I write embedded firmware, FPGA gateware, DSP languages,
          low-latency network audio and native macOS apps. Most of it lives on
          GitHub, all of it is open source.
        </p>
        <div className="hero__stats">
          <Stat label="Public repos on GitHub" value={publicRepos.toLocaleString()} />
          <Stat label="Total stars earned" value={totalStars.toLocaleString()} />
          <Stat label="Followers" value={followers.toLocaleString()} />
          <Stat label="Stack" value="C · C++ · Go · Swift · Verilog · TS · Asm" wide />
        </div>
        <div className="hero__cta">
          <a className="btn btn--primary" href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            github.com/DatanoiseTV →
          </a>
          <a className="btn btn--ghost" href="#projects">
            Browse the lab ↓
          </a>
        </div>
      </div>
      <HeroBackground />
    </header>
  );
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`stat${wide ? " stat--wide" : ""}`}>
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function HeroBackground() {
  return (
    <svg className="hero__bg" viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="glow1" cx="80%" cy="0%" r="60%">
          <stop offset="0%" stopColor="rgba(255, 107, 53, 0.18)" />
          <stop offset="100%" stopColor="rgba(255, 107, 53, 0)" />
        </radialGradient>
        <radialGradient id="glow2" cx="0%" cy="100%" r="55%">
          <stop offset="0%" stopColor="rgba(255, 107, 53, 0.04)" />
          <stop offset="100%" stopColor="rgba(255, 107, 53, 0)" />
        </radialGradient>
      </defs>
      <rect width="1440" height="800" fill="url(#glow1)" />
      <rect width="1440" height="800" fill="url(#glow2)" />
    </svg>
  );
}
