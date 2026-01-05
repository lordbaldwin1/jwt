import { chromium } from "playwright";


async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("usage: pnpm scrape <URL>");
    process.exit(1);
  }

  let pageUrl: URL;
  try {
    pageUrl = new URL(args[0]!);
  } catch (e) {
    console.log(`ERROR: ${(e as Error).message}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://example.com");
  const title = await page.title();
  console.log(title);

  await browser.close();
}

await main();