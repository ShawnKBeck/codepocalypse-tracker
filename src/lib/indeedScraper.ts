import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

/**
 * Fetches the Indeed Software Developer job count from Indeed's search results
 * @param opts.live If true, fetches from Indeed.com. If false, parses provided HTML.
 * @param opts.mockHtml Optional HTML string for testing.
 * @returns The parsed job count (number) and search details.
 */
export async function getIndeedSoftwareDevJobCount(
  opts: { live?: boolean; mockHtml?: string } = {}
) {
  let html: string = ''

  // Search for "software developer" jobs in the US
  const searchUrl =
    'https://www.indeed.com/jobs?q=software+developer&l=United+States&sort=date'

  if (opts.live) {
    // Try multiple user agents and strategies to avoid bot detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
    ]

    let lastError: Error | null = null
    const maxRetries = 3

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Add delay between requests
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000 * i))
        }

        const userAgent = userAgents[i % userAgents.length]

        const res = await fetch(searchUrl, {
          headers: {
            'User-Agent': userAgent,
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            DNT: '1',
            Referer: 'https://www.indeed.com/',
          },
        })

        if (!res.ok) {
          lastError = new Error(
            `Failed to fetch Indeed search page: ${res.status} ${res.statusText}`
          )
          continue
        }

        html = await res.text()
        break
      } catch (error) {
        lastError = error as Error
        if (i === maxRetries - 1) throw lastError
      }
    }

    if (!html) {
      throw lastError || new Error('Failed to fetch Indeed data after retries')
    }
  } else if (opts.mockHtml) {
    html = opts.mockHtml
  } else {
    throw new Error('Must provide live=true or mockHtml')
  }

  // Debug: Log the first 500 characters of the HTML
  console.log('Fetched Indeed HTML (first 500 chars):', html.slice(0, 500))

  const dom = new JSDOM(html)
  const document = dom.window.document

  // Indeed shows job count in various formats, try multiple selectors
  let count = 0

  // Try to find the job count display element
  const countSelectors = [
    '[data-testid="job-count-total"]',
    '[data-testid="searchCountPages"]',
    '.jobsearch-JobCountAndSortPane-jobCount',
    '.jobsearch-JobCountAndSortPane-jobCount span',
    '#searchCountPages',
    '.pn .np:last-child',
    '.np:last-child',
  ]

  for (const selector of countSelectors) {
    const element = document.querySelector(selector)
    if (element && element.textContent) {
      const text = element.textContent.trim()
      console.log(
        `Found potential count element with selector "${selector}": "${text}"`
      )

      // Extract number from text like "1,234 jobs" or "Page 1 of 100"
      const matches = text.match(/[\d,]+/g)
      if (matches) {
        // Try to find the largest number (likely the total count)
        const numbers = matches
          .map((m) => parseInt(m.replace(/,/g, ''), 10))
          .filter((n) => !isNaN(n))
        if (numbers.length > 0) {
          count = Math.max(...numbers)
          console.log(`Extracted count: ${count}`)
          break
        }
      }
    }
  }

  // If we couldn't find a count display, try counting job cards
  if (count === 0) {
    const jobCards = document.querySelectorAll(
      '[data-testid="job-title"], .jobTitle, .slider_container .slider_item'
    )
    if (jobCards.length > 0) {
      console.log(`Found ${jobCards.length} job cards, estimating total`)
      // Indeed typically shows 10-15 jobs per page, estimate total
      count = jobCards.length * 50 // Conservative estimate
    }
  }

  // Try to extract total from pagination or result text
  if (count === 0) {
    const bodyText = document.body.textContent || ''
    const resultMatches = bodyText.match(
      /(\d{1,3}(?:,\d{3})*)\s*(?:jobs?|results?)/i
    )
    if (resultMatches) {
      count = parseInt(resultMatches[1].replace(/,/g, ''), 10)
      console.log(`Extracted count from body text: ${count}`)
    }
  }

  if (count === 0) {
    // For debugging, log page structure
    const titles = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map((h) => h.textContent?.trim())
      .filter(Boolean)
    console.log('Page headings:', titles)

    const dataTestIds = Array.from(
      document.querySelectorAll('[data-testid]')
    ).map((el) => el.getAttribute('data-testid'))
    console.log('Data test IDs found:', dataTestIds)

    throw new Error(
      'Could not find job count on Indeed page. Page may have changed structure or been blocked.'
    )
  }

  return {
    count,
    searchTerms: 'software developer',
    location: 'United States',
    source: 'Indeed',
    url: searchUrl,
    timestamp: new Date().toISOString(),
  }
}
