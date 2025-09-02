# Scanner Pro

A Next.js application for market scanning and analysis with real-time data visualization.

## Features

- Real-time market data scanning
- Interactive charts using Recharts
- WebSocket connections for live updates
- Polygon API integration for market data
- Responsive UI with Tailwind CSS

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Polygon API key for market data access

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
POLYGON_API_KEY=your_polygon_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import your GitHub repository: `Renotrader31/scanner-pro`
5. Configure environment variables:
   - Add `POLYGON_API_KEY` with your API key value
6. Click "Deploy"

### Option 2: Deploy via CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the project:
```bash
vercel --prod
```

4. Follow the prompts:
   - Link to existing project or create new
   - Set up environment variables when prompted

### Option 3: Automatic Deployment from GitHub

1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy:
   - Production deployments from `main` branch
   - Preview deployments from pull requests
3. Configure environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `POLYGON_API_KEY`

## Environment Variables

The following environment variables are required:

| Variable | Description | Required |
|----------|-------------|----------|
| `POLYGON_API_KEY` | API key for Polygon.io market data | Yes |

## Project Structure

```
scanner-pro/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── layout.js    # Root layout
│   └── page.js      # Home page
├── public/          # Static assets
├── .env.local       # Local environment variables (not committed)
├── package.json     # Project dependencies
├── vercel.json      # Vercel configuration
└── tailwind.config.js # Tailwind CSS configuration
```

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Vercel Configuration

The project includes a `vercel.json` file with:
- Framework: Next.js
- Build command: `npm run build`
- API function timeout: 30 seconds
- Environment variable mapping for Polygon API key

## Troubleshooting

### Build Failures
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript/ESLint errors: `npm run lint`
- Verify environment variables are set correctly

### Runtime Errors
- Check Vercel function logs in the dashboard
- Ensure API keys are valid and have proper permissions
- Verify API endpoints are accessible

## Support

For issues or questions, please open an issue in the GitHub repository.

## License

Private project - All rights reserved