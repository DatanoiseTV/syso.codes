export function Footer() {
  return (
    <footer className="footer wide">
      <div className="footer__inner">
        <span className="footer__tag">
          © {new Date().getFullYear()} Sylwester — Berlin. Mostly open source.
        </span>
        <span>
          <a href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://syso.name" target="_blank" rel="noreferrer">
            syso.name
          </a>
        </span>
      </div>
    </footer>
  );
}
