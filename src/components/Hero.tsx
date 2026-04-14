import { useCountUp } from "../hooks/useCountUp";

interface Props {
  publicRepos: number;
  totalStars: number;
}

export function Hero({ publicRepos, totalStars }: Props) {
  return (
    <header className="hero">
      <div className="hero__inner">
        <p className="hero__eyebrow">Sylwester · Berlin</p>

        <h1 className="hero__title">
          I build tools where audio{" "}
          <span className="hero__title-accent">meets silicon.</span>
        </h1>

        <p className="hero__lede">
          Hi, I&apos;m <strong>Sylwester</strong> — also known as{" "}
          <a className="hero__handle" href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            DatanoiseTV
          </a>
          . I write embedded firmware, FPGA gateware, DSP languages,
          low-latency network audio and native macOS apps. Most of it lives
          on GitHub, and most of it is open source.
        </p>

        <div className="hero__cta">
          <a className="btn btn--primary" href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            github.com/DatanoiseTV →
          </a>
          <a className="btn btn--ghost" href="#projects">
            Browse projects
          </a>
        </div>

        <div className="hero__stats">
          <CountingStat label="Public repos" value={publicRepos} />
          <CountingStat label="Stars" value={totalStars} />
          <Stat label="Stack" value="C · C++ · Go · Swift · Verilog · Asm" />
        </div>
      </div>
    </header>
  );
}

function CountingStat({ label, value }: { label: string; value: number }) {
  const [n, ref] = useCountUp(value, { duration: 1600 });
  return (
    <div className="stat" ref={ref as React.RefObject<HTMLDivElement>}>
      <div className="stat__value">{n.toLocaleString()}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat stat--wide">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}
