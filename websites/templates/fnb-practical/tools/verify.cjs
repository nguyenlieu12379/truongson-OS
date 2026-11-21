// Check a built F&B site end to end in headless Chrome.
//   node tools/verify.cjs <url> [screenshot-dir]
// Desktop 1280 and phone 390: no console errors, no sideways page scroll, open-now status filled,
// add two drinks, cart count, cart list, remove, survives reload, Esc closes, phone menu swipes at ~2/3 width.
const { chromium } = require("playwright");
const url = process.argv[2]; const shots = process.argv[3];
if (!url) { console.error("usage: node tools/verify.cjs <url> [screenshot-dir]"); process.exit(1); }
(async () => {
  const b = await chromium.launch(); let fails = 0; const errs = [];
  const ok = (cond, msg) => { console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) fails++; };
  for (const [w, h, name] of [[1280, 800, "desktop"], [390, 844, "phone"]]) {
    console.log(name);
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(name + ": " + e.message));
    p.on("console", (m) => { if (m.type() === "error") errs.push(name + ": " + m.text()); });
    await p.goto(url, { waitUntil: "networkidle" });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload({ waitUntil: "networkidle" });
    const status = await p.$$eval(".status .status__t", (l) => l.map((x) => x.textContent));
    ok(status.length && status.every((t) => /Open now|Closed/.test(t)), "open-now status: " + status.join(" | "));
    ok(await p.$eval(".bar__cta", (a) => a.getAttribute("href")) === "#menu", "header Order goes to the menu");
    const drinks = await p.$$eval(".drink", (d) => d.map((x) => x.dataset.drink));
    ok(drinks.length >= 2, drinks.length + " drink buttons");
    for (const dname of drinks.slice(0, 2)) {
      const btn = p.locator(`.drink[data-drink="${dname.replace(/"/g, '\\"')}"]`);
      await btn.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await btn.click({ force: true });
      await p.waitForSelector("#add[open]"); await p.click('#add button[type="submit"]'); await p.waitForTimeout(150);
    }
    ok(await p.textContent(".cart-btn__n") === "2", "cart badge shows 2");
    await p.click(".cart-btn", { force: true }); await p.waitForSelector("#cart[open]");
    ok(await p.$$eval(".cart__item", (l) => l.length) === 2, "cart lists 2 drinks");
    await p.click("#checkout"); ok(await p.$eval("#demo-note", (d) => !d.hidden), "checkout shows the real order routes");
    if (shots) await p.screenshot({ path: `${shots}/${name}-cart.png` });
    await p.click(".cart__item .rm"); ok(await p.$$eval(".cart__item", (l) => l.length) === 1, "remove works");
    await p.keyboard.press("Escape"); ok(!(await p.$eval("#cart", (d) => d.open)), "Esc closes the cart");
    await p.reload({ waitUntil: "networkidle" }); ok(await p.textContent(".cart-btn__n") === "1", "cart survives a reload");
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, "no sideways page scroll");
    if (w < 800) {
      const r = await p.evaluate(() => { const c = document.querySelector(".menu__col"); return c.getBoundingClientRect().width / innerWidth; });
      ok(r > 0.6 && r < 0.72, "phone menu section width " + r.toFixed(2) + " of screen");
    }
    if (shots) { await p.locator("#menu").scrollIntoViewIfNeeded(); await p.waitForTimeout(1200); await p.screenshot({ path: `${shots}/${name}-menu.png` }); }
    await ctx.close();
  }
  ok(errs.length === 0, "no console errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); console.log(fails ? `${fails} check(s) failed` : "all checks passed"); process.exit(fails ? 1 : 0);
})();
