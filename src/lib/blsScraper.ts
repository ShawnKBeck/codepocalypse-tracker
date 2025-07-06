import { JSDOM } from 'jsdom';

/**
 * Fetches the BLS Software Developer job count from the official BLS page or from provided HTML (for testing).
 * @param opts.live If true, fetches from BLS.gov. If false, parses provided HTML.
 * @param opts.mockHtml Optional HTML string for testing.
 * @returns The parsed job count (number) and the year (string).
 */
import fetch from 'node-fetch';

export async function getSoftwareDevJobCount(opts: { live?: boolean; mockHtml?: string } = {}) {
  let html: string;
  const url = 'https://www.bls.gov/oes/current/oes151254.htm';
  if (opts.live) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Referer': 'https://www.bls.gov/oes/current/oes151254.htm',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch BLS OEWS page');
    html = await res.text();
  } else if (opts.mockHtml) {
    html = opts.mockHtml;
  } else {
    throw new Error('Must provide live=true or mockHtml');
  }

  // Debug: Log the first 500 characters of the HTML
  console.log('Fetched HTML (first 500 chars):', html.slice(0, 500));

  const dom = new JSDOM(html);
  const document = dom.window.document;

  // The BLS page contains a table with "Employment, [year]" and value like "1,534,000"
  // We look for the row with "Employment, [year]"
  const allRows = Array.from(document.querySelectorAll('table'))
    .flatMap(table => Array.from((table as HTMLTableElement).querySelectorAll('tr')));

  if (allRows.length === 0) {
    throw new Error('No table rows found. HTML snippet: ' + html.slice(0, 500));
  }

  // For debugging: log all rows containing 'Employment'
  const employmentRows = allRows.filter(tr => typeof tr.textContent === 'string' && tr.textContent.includes('Employment'));
  if (employmentRows.length > 0) {
    console.log('Employment rows:', employmentRows.map(tr => tr.textContent));
  }

  // For debugging: log all first cells from each row
  const firstCells = allRows.map(tr => (tr.querySelector('td,th')?.textContent || '').trim());
  console.log('All first cells:', firstCells);

  // Find the row where the first cell contains 'Employment' (ignore case/whitespace)
  const employmentRow = allRows.find(tr => {
    const cell = tr.querySelector('td,th');
    return cell && /employment/i.test(cell.textContent?.replace(/\s+/g, ' ').trim() || '');
  });

  if (!employmentRow) {
    throw new Error(`Could not find Employment row. First cells were: ${JSON.stringify(firstCells)}`);
  }

  const cells = Array.from(employmentRow.querySelectorAll('td,th'));
  if (cells.length < 2) {
    throw new Error('Employment row does not have enough cells');
  }
  const countStr = (cells[1].textContent || '').replace(/[^\d]/g, '');
  const count = parseInt(countStr, 10);
  if (isNaN(count)) {
    throw new Error(`Could not parse employment number from cell: "${cells[1].textContent}"`);
  }

  // Try to extract the year from the page heading or use current year
  let year = new Date().getFullYear().toString();
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent) {
    const match = h1.textContent.match(/(\d{4})/);
    if (match) year = match[1];
  }

  return {
    year,
    count,
  };
}
