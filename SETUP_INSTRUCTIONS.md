# Setup Instructions for Monthly Email System

## Environment Variables

To enable the monthly email system, you need to create a `.env.local` file in the root directory with the following variables:

```bash
# Resend API Key for Email Sending
RESEND_API_KEY=re_C77gtmDS_47Zsww59tdeMPC7CETs5GWdU

# BLS API Key (optional - for primary data source)
# BLS_API_KEY=your_bls_api_key_here

# FRED API Key (optional - for economic data)
# FRED_API_KEY=your_fred_api_key_here

# Report Email Recipients
REPORT_EMAIL_SHAWN=shawnkbeck@gmail.com
REPORT_EMAIL_MARK=moosefarnham@gmail.com

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Monthly Email System

The monthly email system has been set up with the following features:

### API Endpoint

- **URL**: `/api/monthly-report`
- **Methods**: GET, POST
- **Purpose**: Generates and sends monthly reports

### Email Features

- Beautiful HTML email template with comprehensive data
- Automatic data collection from BLS, FRED, and alternative sources
- Bet status tracking and trend analysis
- Error reporting and fallback handling
- Mobile-responsive design

### Scheduling Options

#### Option 1: External Cron Service (Recommended)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://easycron.com) to call the API endpoint on the 6th of every month:

```bash
# Cron expression for 6th of every month at 9:00 AM
0 9 6 * * *

# URL to call:
https://your-domain.com/api/monthly-report
```

#### Option 2: Manual Trigger

You can manually trigger the monthly report by visiting:

- `https://your-domain.com/api/monthly-report`

#### Option 3: Vercel Cron (Pro Plan)

If you're using Vercel Pro, you can set up a cron job:

Create `vercel.json` in your root directory:

```json
{
  "crons": [
    {
      "path": "/api/monthly-report",
      "schedule": "0 9 6 * *"
    }
  ]
}
```

### Email Content

The monthly email includes:

1. **Status Banner**: Current bet winner with confidence level
2. **Key Metrics**:
   - BLS Employment Data with change percentage
   - FRED Tech Employment trends
   - Job Openings data
   - Alternative sources job count
3. **Trend Analysis**: Economic health score and market sentiment
4. **Bet Status**: Current winner and confidence level
5. **Error Reporting**: Any data collection issues

### Testing the System

To test the monthly email system:

1. Set up the environment variables in `.env.local`
2. Run the development server: `npm run dev`
3. Visit `http://localhost:3000/api/monthly-report` in your browser
4. Check the console for logs and verify the email was sent

### Troubleshooting

- **Email not sending**: Check that `RESEND_API_KEY` is correctly set
- **Data collection errors**: The system has fallback mechanisms, but errors will be reported in the email
- **API rate limits**: The system handles rate limiting gracefully with retry logic

### Security Notes

- The `.env.local` file is ignored by Git for security
- API keys should never be committed to version control
- Use environment variables for all sensitive configuration
