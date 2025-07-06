// Mock data for testing the system when live scraping is blocked

export const mockBLSData = {
  year: '2024',
  count: 1534000,
}

export const mockIndeedData = {
  count: 25430,
  searchTerms: 'software developer',
  location: 'United States',
  source: 'Indeed',
  url: 'https://www.indeed.com/jobs?q=software+developer&l=United+States',
  timestamp: new Date().toISOString(),
}

export const mockBLSHTML = `
<!DOCTYPE html>
<html>
<head><title>BLS Mock Data</title></head>
<body>
<h1>Software Developers, Applications and Systems Software 2024</h1>
<table>
<tr><th>Statistic</th><th>Value</th></tr>
<tr><td>Employment, 2024</td><td>1,534,000</td></tr>
<tr><td>Location quotient</td><td>1.23</td></tr>
</table>
</body>
</html>
`

export const mockIndeedHTML = `
<!DOCTYPE html>
<html>
<head><title>Indeed Mock Data</title></head>
<body>
<div data-testid="searchCountPages">25,430 jobs</div>
<div class="jobTitle">Software Developer</div>
<div class="jobTitle">Full Stack Developer</div>
<div class="jobTitle">Senior Software Engineer</div>
</body>
</html>
`
