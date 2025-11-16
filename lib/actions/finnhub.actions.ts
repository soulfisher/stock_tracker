"use server";

import { validateArticle, formatArticle, getDateRange } from "@/lib/utils";

// Constants
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

/**
 * Fetch JSON data from an API with optional revalidation
 * @param url URL to fetch
 * @param revalidateSeconds Optional seconds to revalidate the cache
 * @returns Parsed JSON response
 */
export async function fetchJSON(url: string, revalidateSeconds?: number) {
  const options: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    cache: revalidateSeconds ? "force-cache" : "no-store",
  };

  // Add revalidation if specified
  if (revalidateSeconds) {
    options.next = {
      revalidate: revalidateSeconds,
    };
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Get news articles for specific symbols or general market news
 * @param symbols Optional array of stock symbols to get news for
 * @returns Array of formatted news articles
 */
export async function getNews(
  symbols?: string[],
): Promise<FormattedNewsArticle[]> {
  try {
    // Get date range for the last 5 days
    const { from, to } = getDateRange(5);

    // If symbols are provided, get company-specific news
    if (symbols && symbols.length > 0) {
      // Clean and uppercase symbols
      const cleanSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (cleanSymbols.length === 0) {
        return await getGeneralMarketNews(from, to);
      }

      return await getCompanyNews(cleanSymbols, from, to);
    }

    // Otherwise get general market news
    return await getGeneralMarketNews(from, to);
  } catch (error) {
    console.error("Error fetching news:", error);
    throw new Error("Failed to fetch news");
  }
}

/**
 * Get company-specific news for a list of symbols
 * @param symbols Array of stock symbols
 * @param from Start date (YYYY-MM-DD)
 * @param to End date (YYYY-MM-DD)
 * @returns Array of formatted news articles
 */
async function getCompanyNews(
  symbols: string[],
  from: string,
  to: string,
): Promise<FormattedNewsArticle[]> {
  const formattedArticles: FormattedNewsArticle[] = [];
  const maxRounds = 6; // Maximum number of rounds to collect articles

  // Round-robin through symbols, collecting one article per symbol per round
  for (let round = 0; round < maxRounds; round++) {
    if (formattedArticles.length >= 6) break; // Stop if we have enough articles

    for (const symbol of symbols) {
      if (formattedArticles.length >= 6) break; // Stop if we have enough articles

      try {
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        const articles: RawNewsArticle[] = await fetchJSON(url);

        // Find a valid article that's not already included
        const validArticle = articles.find(
          (article) =>
            validateArticle(article) &&
            !formattedArticles.some((a) => a.url === article.url),
        );

        if (validArticle) {
          formattedArticles.push(formatArticle(validArticle, true, symbol));
        }
      } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        // Continue to next symbol on error
      }
    }
  }

  // Sort by datetime (newest first)
  return formattedArticles.sort((a, b) => b.datetime - a.datetime);
}

/**
 * Get general market news
 * @param from Start date (YYYY-MM-DD)
 * @param to End date (YYYY-MM-DD)
 * @returns Array of formatted news articles
 */
async function getGeneralMarketNews(
  from: string,
  to: string,
): Promise<FormattedNewsArticle[]> {
  try {
    const url = `${FINNHUB_BASE_URL}/news?category=general&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    const articles: RawNewsArticle[] = await fetchJSON(url);

    // Filter valid articles and deduplicate
    const validArticles = articles.filter(validateArticle);
    const uniqueArticles = deduplicate(validArticles);

    // Take top 6 and format them
    return uniqueArticles
      .slice(0, 6)
      .map((article, index) => formatArticle(article, false, undefined, index));
  } catch (error) {
    console.error("Error fetching general market news:", error);
    return [];
  }
}

/**
 * Deduplicate articles by id, url, or headline
 * @param articles Array of raw news articles
 * @returns Deduplicated array of articles
 */
function deduplicate(articles: RawNewsArticle[]): RawNewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = article.id?.toString() || article.url || article.headline || "";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Type definitions
interface RawNewsArticle {
  id?: number;
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  datetime?: number;
  image?: string;
  category?: string;
  related?: string;
}

interface FormattedNewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image: string;
  category: string;
  related: string;
}
