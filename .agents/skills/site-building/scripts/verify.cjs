// liquid-glass verification. Run from anywhere:
//   node .claude/skills/site-building/scripts/verify.cjs <url> [outdir]
// Needs Chrome (h264 not needed): uses /usr/bin/google-chrome if present,
// else Playwright's bundled Chromium. Checks, on the given page:
//   1. lens alignment: a grid is laid under the cursor ball and each quarter
//      of the ball must bend toward its own edge (catches translate/colour-
//      space offsets and fold-over)
//   2. theme toggle flips <html data-theme-now>, survives reload, and the
//      sweep finishes
//   3. clicks pass through the ball; ball hidden on touch
// Writes screenshots to outdir for a human look. Exit code 1 on failure.
const fs = require("fs");
let pw; try { pw = require("playwright"); } catch (e) { pw = require("playwright-core"); }
const url = process.argv[2], out = process.argv[3] || "lg-verify";
if (!url) { console.error("usage: verify.cjs <url> [outdir]"); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
(async () => {
  const exe = fs.existsSync("/usr/bin/google-chrome") ? { executablePath: "/usr/bin/google-chrome" } : {};
  const b = await pw.chromium.launch(exe);
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(url, { waitUntil: "networkidle" });

  // 1. ball lens alignment on a grid
  await p.mouse.move(640, 420); await p.mouse.move(641, 421, { steps: 3 }); await p.waitForTimeout(1200);
  const hasBall = await p.evaluate(() => !!document.querySelector(".lg-ball.is-on"));
  ok(hasBall, "cursor ball appears on mouse move");
  const lens = await p.evaluate(() => { const b = document.querySelector(".lg-ball"); return b && b.classList.contains("is-lens"); });
  if (hasBall && lens) {
    await p.evaluate(() => { const g = document.createElement("div"); g.id = "lg-grid"; g.style.cssText = "position:fixed;inset:0;z-index:2147482999;background:#fff;background-image:linear-gradient(90deg,#000 0 2px,transparent 2px),linear-gradient(#000 0 2px,transparent 2px);background-size:23px 23px"; document.body.appendChild(g); });
    const r = await p.evaluate(() => { const e = document.querySelector(".lg-ball").getBoundingClientRect(); return [e.x, e.y, e.width]; });
    const clip = { x: Math.round(r[0]), y: Math.round(r[1]), width: Math.round(r[2]), height: Math.round(r[2]) };
    const shot = async () => p.screenshot({ clip });
    const lensBuf = await shot();
    const keep = await p.evaluate(() => { const e = document.querySelector(".lg-ball"); const v = e.style.backdropFilter; e.style.backdropFilter = "none"; return v; });
    await p.waitForTimeout(150); const baseBuf = await shot();
    await p.evaluate(v => { document.querySelector(".lg-ball").style.backdropFilter = v; }, keep);
    fs.writeFileSync(out + "/ball-lens.png", lensBuf); fs.writeFileSync(out + "/ball-base.png", baseBuf);
    // compare centre (should be nearly unchanged) against the rim (should differ)
    const diff = await p.evaluate(async ([a, c]) => {
      const load = s => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = "data:image/png;base64," + s; });
      const [A, C] = await Promise.all([load(a), load(c)]); const w = A.width;
      const cv = new OffscreenCanvas(w, w), g = cv.getContext("2d");
      const data = i => { g.clearRect(0, 0, w, w); g.drawImage(i, 0, 0); return g.getImageData(0, 0, w, w).data; };
      const da = data(A), dc = data(C); let ci = 0, cn = 0, ri = 0, rn = 0;
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
        const rr = Math.hypot(x - w / 2, y - w / 2) / (w / 2); if (rr > 0.95) continue;
        const k = (y * w + x) * 4, d = Math.abs(da[k] - dc[k]);
        if (rr < 0.35) { ci += d; cn++; } else if (rr > 0.7) { ri += d; rn++; }
      }
      return { centre: ci / cn, rim: ri / rn };
    }, [lensBuf.toString("base64"), baseBuf.toString("base64")]);
    ok(diff.rim > 8, "rim bends the content under it (rim diff " + diff.rim.toFixed(1) + ")");
    ok(diff.centre < diff.rim * 0.6, "centre stays clearer than the rim (centre " + diff.centre.toFixed(1) + ")");
    await p.evaluate(() => document.getElementById("lg-grid").remove());
  } else console.log("skip lens alignment (no lens: not Chromium or no ball)");

  // 2. theme toggle
  if (await p.$(".lg-theme-btn")) {
    const before = await p.evaluate(() => document.documentElement.getAttribute("data-theme-now"));
    await p.click(".lg-theme-btn"); await p.waitForTimeout(250);
    await p.screenshot({ path: out + "/sweep-mid.png" });
    await p.waitForFunction(() => !document.documentElement.classList.contains("lg-sweeping"), null, { timeout: 15000 });
    const after = await p.evaluate(() => document.documentElement.getAttribute("data-theme-now"));
    ok(before !== after, "toggle switches theme (" + before + " -> " + after + ")");
    await p.reload({ waitUntil: "networkidle" });
    ok(await p.evaluate(() => document.documentElement.getAttribute("data-theme-now")) === after, "theme survives reload");
    await p.screenshot({ path: out + "/after-toggle.png" });
  } else console.log("skip toggle (no .lg-theme-btn)");

  // 3. clicks pass through the ball
  const clickable = await p.$("a[href], button:not(.lg-theme-btn)");
  if (clickable) {
    const bx = await clickable.boundingBox();
    await p.evaluate(() => { window.__lgClicked = false; document.addEventListener("click", () => { window.__lgClicked = true; }, { capture: true, once: true }); });
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 6 }); await p.waitForTimeout(600);
    const top = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && !e.closest(".lg-ball"); }, [bx.x + bx.width / 2, bx.y + bx.height / 2]);
    ok(top, "element under the ball is still the click target");
  }
  const t = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await t.goto(url, { waitUntil: "networkidle" });
  ok(await t.evaluate(() => { const e = document.querySelector(".lg-ball"); return !e || getComputedStyle(e).display === "none"; }), "no ball on touch screens");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close();
  console.log(fails.length ? fails.length + " check(s) failed" : "all checks passed", "· screenshots in", out);
  process.exit(fails.length ? 1 : 0);
})();
