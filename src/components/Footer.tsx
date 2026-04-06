export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div>
          <div className="footer__title">syso.codes</div>
          <div className="footer__sub">Sylwester · Berlin · open source since forever</div>
        </div>
        <div className="footer__links">
          <a href="https://github.com/DatanoiseTV" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://syso.name" target="_blank" rel="noreferrer">
            syso.name
          </a>
        </div>
      </div>
      <div className="footer__bottom">
        © {new Date().getFullYear()} Sylwester. Made in Berlin with way too much coffee.
      </div>
    </footer>
  );
}
