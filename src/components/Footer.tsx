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

      <div className="footer__disclaimer">
        <h4 className="footer__disclaimer-title">Disclaimer</h4>
        <p>
          Everything linked from this page is <strong>open source</strong>,
          released as-is and provided <strong>without any warranty</strong>,
          express or implied. I do my best to ship code that&apos;s correct,
          stable and well-engineered, but I cannot accept liability for any
          damage, loss or other consequence arising from using these
          repositories — please use them at your own risk and review the
          source before deploying anything to hardware or production.
        </p>
        <p>
          Most repos welcome contributions: bug reports, fixes, improvements
          and pull requests are appreciated. Each project carries its own
          licence — read the LICENSE file in the relevant repository before
          redistributing or modifying.
        </p>
      </div>

      <div className="footer__bottom">
        © {new Date().getFullYear()} Sylwester. Made in Berlin with way too much coffee.
      </div>
    </footer>
  );
}
