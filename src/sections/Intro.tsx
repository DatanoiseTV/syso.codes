interface Props {
  repos: number;
  stars: number;
}

export function Intro({ repos, stars }: Props) {
  return (
    <header className="intro wide" id="top">
      <p className="intro__kicker">
        <span className="intro__kicker-dot" aria-hidden="true" />
        Sylwester · Berlin · open to work
      </p>
      <h1 className="intro__name">Sylwester.</h1>
      <p className="intro__bio">
        Engineer working on <strong>embedded audio firmware</strong>,{" "}
        <strong>FPGA gateware</strong>, <strong>DSP languages</strong>, and{" "}
        <strong>native macOS apps</strong>. Mostly open source.
      </p>
      <div className="intro__contact">
        <a href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
          github.com/DatanoiseTV ↗
        </a>
        <span className="intro__contact-meta">
          {repos} repositories · {stars.toLocaleString()} stars
        </span>
      </div>
    </header>
  );
}
