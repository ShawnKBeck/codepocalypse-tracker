# Codepocalypse Tracker

A Next.js application that tracks software developer job market trends to settle a friendly bet between Shawn and Mark about whether there will be more or fewer software development jobs in 5 years.

## 🎯 The Bet

**Shawn** believes job numbers will grow despite AI advances.  
**Mark** believes they will decline.

This app tracks the trend using multiple data sources and keeps both parties updated with regular reports.

## 📊 Data Sources

- **Bureau of Labor Statistics (BLS)**: Official government employment statistics. See [BLS API Integration Report](BLS_API_INTEGRATION_REPORT.md) for details.
- **Indeed Job Postings**: Real-time job posting counts for market demand indicators
- **Local Storage**: Historical data tracking with trend analysis

## 🚀 Features

- **Multi-source data collection** from BLS and Indeed
- **Historical data storage** with local JSON files
- **Trend analysis** showing up/down/stable patterns
- **Email notifications** with comprehensive reports
- **Real-time dashboard** with modern responsive UI
- **Error handling** with graceful degradation when sources fail

## 🛠️ Tech Stack

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Node.js** for server-side scraping
- **JSDOM** for HTML parsing
- **Resend** for email notifications

## 📱 API Endpoints

- `GET /api/report` - Fetch latest data from both sources
- `POST /api/report` - Fetch data and send email reports
- `GET /api/test` - Test with mock data (for development)

## 🏃‍♂️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit http://localhost:3000
```

## 🔧 Environment Variables

Create a `.env.local` file:

```
RESEND_API_KEY=your_resend_api_key
REPORT_EMAIL_SHWN=shawn@example.com
REPORT_EMAIL_MARK=mark@example.com
```

## 📈 Data Structure

The app stores historical data in `data/job-counts.json`:

```json
{
  "bls": [
    {
      "date": "2024-01-15T10:00:00.000Z",
      "count": 1534000,
      "year": "2024",
      "source": "BLS"
    }
  ],
  "indeed": [
    {
      "date": "2024-01-15T10:00:00.000Z",
      "count": 25430,
      "source": "Indeed"
    }
  ]
}
```

## 🧪 Testing

Use the test endpoint to verify functionality:

```bash
curl http://localhost:3000/api/test
```

## 📊 Trend Analysis

The app tracks trends between data points:

- **up**: Job count increased
- **down**: Job count decreased
- **stable**: Job count unchanged
- **no-data**: Insufficient data for comparison

## 🎉 Future Enhancements

- Add more data sources (LinkedIn, GitHub, Stack Overflow)
- Implement data visualization charts
- Add geographic filtering
- Include salary trend analysis
- Deploy automated scheduling

---

_Let the data decide! 🧠🦾📉📈_
