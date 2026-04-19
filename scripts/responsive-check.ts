// Requires: npm i -D @playwright/test && npx playwright install chromium
// tsx not in devDeps — run with: npx ts-node scripts/responsive-check.ts
// TODO: add tsx or ts-node to devDependencies for reliable execution

import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";
import { join } from "path";

const viewports = [
  { name: "mobile", width: 375, height: 667 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const routes = ["/"];

const BASE_URL = "http://localhost:5173";
const AUDIT_DIR = ".responsive-audit";

function routeSlug(route: string): string {
  if (route === "/") return "_root";
  return route.replace(/^\//, "").replace(/\//g, "-");
}

async function checkHorizontalScroll(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth
      ? `scrollWidth ${document.documentElement.scrollWidth} > innerWidth ${window.innerWidth}`
      : null;
  });
}

async function checkTouchTargets(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(() => {
    const selectors = 'button,a,input,select,textarea,[role="button"]';
    const failing: string[] = [];
    for (const el of Array.from(document.querySelectorAll(selectors))) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const cls = el.className ? `.${String(el.className).split(" ")[0]}` : "";
        failing.push(`${tag}${id}${cls} ${Math.round(r.width)}x${Math.round(r.height)}px`);
      }
    }
    return failing.length ? failing.slice(0, 5).join(", ") : null;
  });
}

async function checkFontSize(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(() => {
    const failing: string[] = [];
    const leaves = Array.from(
      document.querySelectorAll("p,span,li,td,th,label,div")
    ).filter(
      (el) => el.children.length === 0 && (el.textContent ?? "").trim().length > 0
    );
    for (const el of leaves) {
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 16) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        failing.push(`${tag}${id} ${size}px`);
      }
    }
    return failing.length ? failing.slice(0, 5).join(", ") : null;
  });
}

async function checkFixedWidthOverflow(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(() => {
    const failing: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("[style]"))) {
      const style = el.getAttribute("style") ?? "";
      if (!style.includes("width")) continue;
      const r = el.getBoundingClientRect();
      if (r.width > window.innerWidth) {
        const tag = el.tagName.toLowerCase();
        failing.push(`${tag} ${Math.round(r.width)}px > ${window.innerWidth}px`);
      }
    }
    return failing.length ? failing.slice(0, 5).join(", ") : null;
  });
}

async function main() {
  const browser = await chromium.launch();
  let anyFailed = false;

  for (const route of routes) {
    const slug = routeSlug(route);
    const outDir = join(AUDIT_DIR, slug);
    await mkdir(outDir, { recursive: true });

    console.log(`\nRoute: ${route}`);

    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });

      const screenshotPath = join(outDir, `${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const [hScroll, touchTargets, fontSize, fixedOverflow] = await Promise.all([
        checkHorizontalScroll(page),
        checkTouchTargets(page),
        checkFontSize(page),
        checkFixedWidthOverflow(page),
      ]);

      const results = [
        { check: "No H-Scroll", failure: hScroll },
        { check: "Touch targets >=44px", failure: touchTargets },
        { check: "Text >=16px", failure: fontSize },
        { check: "No fixed overflow", failure: fixedOverflow },
      ];

      for (const r of results) {
        const status = r.failure ? "FAIL" : "pass";
        if (r.failure) {
          anyFailed = true;
          console.log(`  [${vp.name}] ${status} -- ${r.check}: ${r.failure}`);
        } else {
          console.log(`  [${vp.name}] ${status} -- ${r.check}`);
        }
      }

      await context.close();
    }
  }

  await browser.close();

  if (anyFailed) {
    console.error("\nResponsive check FAILED. See above for details.");
    process.exit(1);
  } else {
    console.log("\nAll responsive checks passed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
