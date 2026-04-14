const SKILL_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Languages",
    items: ["Assembly", "C", "C++", "Go", "Swift", "Verilog", "VHDL", "TypeScript", "Python", "Bash"],
  },
  {
    title: "Embedded & Hardware",
    items: ["ESP-IDF", "FreeRTOS", "Pico SDK", "STM32", "Lattice ECP5", "LiteX / Migen", "KiCad", "JLCPCB"],
  },
  {
    title: "Audio & DSP",
    items: ["JUCE", "VST3 / AU / LV2", "JACK", "ALSA", "AES67 / RAVENNA", "ADAT", "Vult DSP", "whisper.cpp"],
  },
  {
    title: "Linux & Ops",
    items: ["Buildroot", "Yocto", "systemd", "Docker", "GitHub Actions", "Prometheus", "Real-time kernels"],
  },
];

export function About() {
  return (
    <section id="about" className="about">
      <div className="about__inner">
        <div className="about__row">
          <div className="about__avatar">
            <img
              src="https://avatars.githubusercontent.com/u/6614616?v=4"
              alt="Sylwester (DatanoiseTV) avatar"
              loading="lazy"
              width="220"
              height="220"
            />
            <div className="about__avatar-frame" />
            <div className="about__avatar-tag">Sylwester · Berlin</div>
          </div>
          <div className="about__main">
            <p className="section-eyebrow">
              <span className="section-num">01</span>About
            </p>
            <h2 className="section-title">
              Hardware, music, and code —<br />
              <span className="about__title-accent">always.</span>
            </h2>
            <div className="about__body">
              <p>
                I&apos;ve been into hardware and music for as long as I can
                remember — soldering iron in one hand, tracker software in
                the other. I started writing <strong>assembly</strong> as a
                teenager, picked up <strong>C</strong> soon after, then{" "}
                <strong>C++</strong> along the way, and these days I&apos;m
                equally at home in <strong>Go</strong>. Professionally I
                spent years as a <strong>DevOps engineer</strong>: keeping
                clusters happy, building CI/CD pipelines, and automating
                anything that moved.
              </p>
              <p>
                What I actually love, though, is the intersection of{" "}
                <strong>music and programming</strong>. Almost everything on
                this page lives there — synthesizers, audio-over-IP, FPGA
                gateware, DSP languages, native macOS audio tooling, and
                small bits of hardware that ship in real cases on real desks.
                I also sometimes <strong>pair-program with modern AI tools</strong>,
                which I treat as a fast collaborator: it doesn&apos;t replace
                the engineering, but it helps me ship more of the weird ideas
                I keep on the shelf.
              </p>
            </div>
          </div>
        </div>

        <div className="about__skills-grid">
          {SKILL_GROUPS.map((group) => (
            <div key={group.title} className="skill-group">
              <h3 className="skill-group__title">{group.title}</h3>
              <div className="skill-group__items">
                {group.items.map((s) => (
                  <span key={s} className="skill">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
