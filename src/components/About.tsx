export function About() {
  return (
    <section id="about" className="about">
      <div className="about__inner">
        <p className="section-eyebrow">About</p>
        <h2 className="section-title">Hardware, music, and code — always.</h2>
        <div className="about__body">
          <p>
            I&apos;ve been into hardware and music since I was a kid — soldering
            iron in one hand, tracker software in the other. I started writing{" "}
            <strong>assembly</strong> as a teenager, picked up <strong>C</strong>{" "}
            soon after, then <strong>C++</strong> along the way, and these days
            I&apos;m equally comfortable in <strong>Go</strong>. Professionally
            I spent years as a <strong>DevOps engineer</strong>: keeping
            clusters happy, building CI/CD pipelines, and automating anything
            that moved.
          </p>
          <p>
            What I actually love, though, is the intersection of{" "}
            <strong>music and programming</strong>. Most of what&apos;s on this
            page lives there — synthesizers, audio-over-IP, FPGA gateware, DSP
            languages, native macOS audio tooling. I also sometimes{" "}
            <strong>pair-program with modern AI tools</strong>, which I treat
            as a fast collaborator that helps me ship more of the weird ideas
            I keep on the shelf.
          </p>
        </div>
        <div className="about__skills">
          {[
            "Assembly",
            "C",
            "C++",
            "Go",
            "Swift",
            "Verilog",
            "TypeScript",
            "ESP-IDF",
            "FreeRTOS",
            "JUCE",
            "LiteX",
            "JACK",
            "Vult DSP",
            "Buildroot",
            "DevOps",
          ].map((s) => (
            <span key={s} className="skill">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
