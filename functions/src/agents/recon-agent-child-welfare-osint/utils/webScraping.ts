import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

/**
 * Performs web scraping using Puppeteer to extract content from JavaScript-rendered pages.
 */
export class WebScraper {
  private browser: Browser | null = null;

  constructor() {}

  /**
   * Initializes the Puppeteer browser instance.
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({ headless: true });
    } catch (error) {
      console.error('Failed to launch the browser:', error);
      throw new Error('WebScraper initialization failed');
    }
  }

  /**
   * Scrapes data from a given URL using Puppeteer.
   * @param url The webpage URL to scrape data from.
   * @param evaluateFunction The function executed to extract data from the page.
   */
  async scrape(url: string, evaluateFunction: (page: Page) => Promise<any>): Promise<any> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    let page: Page | null = null;
    try {
      page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      const result = await evaluateFunction(page);
      return result;
    } catch (error) {
      console.error(`Failed to scrape the page at ${url}:`, error);
      throw new Error('Page scraping failed');
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Closes the Puppeteer browser instance.
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error('Failed to close the browser:', error);
      } finally {
        this.browser = null;
      }
    }
  }
}
