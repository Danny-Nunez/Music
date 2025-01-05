import type { Browser, Page } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const findChrome = () => {
  // Common Chrome paths on Windows
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH, // Allow override through env variable
  ].filter(Boolean);

  for (const path of paths) {
    if (path && existsSync(path)) {
      return path;
    }
  }
  throw new Error('Chrome not found. Please install Chrome or set CHROME_PATH environment variable.');
};

export async function initPuppeteer() {
  const executablePath = findChrome();
  
  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  return browser;
}

export async function withPuppeteer<T>(
  callback: (browser: Browser, page: Page) => Promise<T>
): Promise<T> {
  let browser = null;
  try {
    browser = await initPuppeteer();
    const page = await browser.newPage();
    return await callback(browser, page);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}