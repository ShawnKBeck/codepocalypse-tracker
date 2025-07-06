# BLS API Integration Report

## Overview

This document explains how the Codepocalypse Tracker retrieves official software developer employment statistics from the Bureau of Labor Statistics (BLS) API v2.0. The API provides time series data for occupation **SOC 15‑1252** (Software Developers) which is used in the application to show current counts and historical trends.

## Setup

1. Obtain a BLS API key from the [BLS Developer Portal](https://www.bls.gov/developers/).
2. Add `BLS_API_KEY` to your `.env.local` file. The key is required for all requests.

## Implementation Details

The integration is implemented in [`src/lib/blsAPI.ts`](src/lib/blsAPI.ts) and exposed through the Next.js API route [`/api/bls`](src/app/api/bls/route.ts). Key features include:

- **Configurable date range**: Optional `startYear` and `endYear` parameters let you fetch up to 20 years of data.
- **Trend analysis**: The helper `getBLSTrendAnalysis` calculates year‑over‑year changes and volatility.
- **Fallback data**: If the API is unreachable, the module returns baseline 2023 statistics so the app can continue operating.

## Example Request

```bash
curl "http://localhost:3000/api/bls?analysis=true&startYear=2015&endYear=2024"
```

The response includes the latest employment count, a list of historical data points, trend information, and metadata describing the API status and series ID.

## Error Handling

Errors from the BLS API are logged and surfaced in the API response. When a failure occurs, the app marks the response with `apiStatus: ERROR` and provides fallback statistics along with the error message.

## Future Improvements

- Cache successful responses to reduce API calls and improve performance.
- Support additional BLS series such as wage data or regional employment.
- Add automated tests around the BLS client and API route.

