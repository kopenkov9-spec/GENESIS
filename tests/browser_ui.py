"""Exercise the shipped HTML in a fresh, offline Chromium profile using Playwright."""
import argparse
import json
from pathlib import Path
import shutil
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DRIVER = r"""
async () => {
  const el = id => document.getElementById(id);
  const pause = () => new Promise(resolve => requestAnimationFrame(resolve));
  async function waitUntil(predicate, message) {
    const end = performance.now() + 12000;
    while (!predicate()) { if (performance.now() > end) throw Error(message); await pause(); }
  }
  const h = {
    async begin() {
      if (document.documentElement.lang === 'bg') await this.click('lang',undefined,'menutop');
      await this.click('start',undefined,'intro');
    },
    async click(id,k,scope) {
      const root = scope ? el(scope) : document;
      const b = [...root.querySelectorAll('button[data-ui]')].find(b =>
        b.dataset.ui === id && (k === undefined || b.dataset.k === String(k)) && b.getClientRects().length && !b.disabled);
      if (!b) throw Error('Missing visible control '+id+'/'+k);
      b.click();
    },
    async settle() {
      await waitUntil(() => el('toast').dataset.code !== 'course', 'Course timed out');
      await pause();
    },
    async code(k) { if (el('toast').dataset.code !== k) throw Error('Expected '+k+' / '+el('toast').textContent); },
    async stock(k) { return Number(document.querySelector('.res-'+k+' b').textContent); },
    async select(id,value) { const s=el(id);s.value=value;s.dispatchEvent(new Event('change',{bubbles:true})); },
    async epoch() { return document.querySelector('.fieldtitle').textContent; },
    async place() { return document.querySelector('.fieldsub').textContent.split(' · ')[0]; },
    async side() { return el('side').innerText; },
    async persistence() { if (!localStorage.getItem('genesis.beyondmatter.slot.manual')) throw Error('Missing manual save'); }
  };
  return await uiJourney(h);
}
"""

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", help="Path to an installed Chromium, Chrome or Edge executable")
    args = parser.parse_args()
    from playwright.sync_api import sync_playwright

    external = []
    errors = []
    url = (ROOT / "GENESIS_Beyond_Matter.html").as_uri()
    with sync_playwright() as pw, tempfile.TemporaryDirectory() as scratch:
        binary = args.browser or shutil.which("chromium") or shutil.which("google-chrome")
        browser = pw.chromium.launch(executable_path=binary, headless=True)
        context = browser.new_context(offline=True, viewport={"width": 1280, "height": 760}, accept_downloads=True)
        context.on("request", lambda r: external.append(r.url) if r.url.startswith(("http:", "https:", "ws:", "wss:")) else None)
        page = context.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        page.locator("#intro h1").wait_for()
        scenario = (HERE / "ui_scenario.js").read_text(encoding="utf8")
        report = page.evaluate("async () => {\n" + scenario + "\nreturn await (" + DRIVER.strip() + ")();\n}")
        page.locator('#playtop [data-ui="saves"]').click()
        with page.expect_download() as download_info:
            page.locator('[data-ui="export"]').click()
        save_path = Path(scratch) / "journey.genesis"
        download_info.value.save_as(save_path)
        assert json.loads(save_path.read_text(encoding="utf8"))["encoding"] == "seed-delta"
        page.reload()
        page.locator('[data-ui="resume"]').click()
        assert page.locator(".fieldtitle").inner_text() == "Transcendence"
        page.locator('#playtop [data-ui="saves"]').click()
        page.locator("#importfile").set_input_files(save_path)
        page.locator("#dialog").wait_for(state="hidden")
        assert page.locator(".fieldtitle").inner_text() == "Transcendence"
        page.locator('#playtop [data-ui="settings"]').click()
        page.locator("#langSel").select_option("bg")
        page.locator("#close").click()
        assert page.locator(".fieldtitle").inner_text() == "Трансценденция"
        page.set_viewport_size({"width": 390, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        assert not external, external
        assert not errors, errors
        print(json.dumps({"browser": browser.version, "externalRequests": external, "pageErrors": errors, **report}, ensure_ascii=False, indent=2))
        browser.close()

if __name__ == "__main__":
    main()
