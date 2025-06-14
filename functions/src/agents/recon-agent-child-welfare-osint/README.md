# Recon Agent for Child Welfare OSINT

Welcome to the Recon Agent for Child Welfare OSINT, a cutting-edge web application built to assist in open source intelligence (OSINT) gathering within the realm of child welfare and foster care systems. This application is designed for modular use, incorporating local data processing, advanced web scraping techniques, and AI-powered content analysis.

## Project Specifications

- **Framework & Language**: Built with Next.js and TypeScript, ensuring type safety and modern web standards.
- **CSS Styling**: Uses CSS for styling, allowing easy customization and theme management.
- **Database**: This application is stateless with no server-side database dependencies.
- **API Integration**: Includes API routes for processing analysis requests.
- **Authentication**: No user authentication required for access.

## Core Features

1. **Local Data Analysis**: Efficiently scans and analyzes existing local data files for relevant child welfare information before proceeding with any online queries.

2. **Google CSE Integration**: Utilizes Google Custom Search Engine for controlled and efficient web information gathering.

3. **Advanced Web Scraping**: Employs Playwright/Puppeteer to scrape data from JavaScript-rendered web pages, ensuring a comprehensive data collection.

4. **GPT-4 Content Analysis**: Leverages the power of GPT-4 to summarize content and extract entities from both local and web-based sources.

5. **Structured JSON Output**: Outputs findings in a structured JSON format, ensuring the inclusion of errors and any reconciled data.

## Application Structure

The application is organized as follows:

- **Pages**:
  - **Home**: Explains the capabilities and provides instructions for usage.
  - **Analysis**: For starting new analysis queries and viewing results.
  - **Logs**: Displays recent error logs and performance metrics.

- **Components**:
  - **Header**: For navigation across pages.
  - **Footer**: For additional links and information.
  - **UsageInstructions**: Provides tips and overviews on using the application.
  - **QueryForm**: Form for entering and submitting search queries.
  - **ResultsDisplay**: Presents results in a user-friendly manner.
  - **LogsDisplay**: Shows recent error logs and system notifications.

## Installation and Setup

To get started with the Recon Agent, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone <repository_url>
   cd recon-agent-child-welfare-osint
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to view the application in your browser.

## Building the Application

To build the application for production use:

```bash
npm run build
npm start
```

## API Endpoints

- **POST /api/analyze**: Use this endpoint to submit an analysis query, which will process local data and web sources to generate results.

## Contribution

We welcome contributions from the community to help enhance and refine the application. Please follow standard open-source contribution practices when adding new features or fixing bugs.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

This README provides a comprehensive guide to setup, understand, and contribute to the Recon Agent for Child Welfare OSINT application. GitHub Issues and Pull Requests are encouraged for improvements and bug reports.