# wingMan - Your AI Dating Buddy

Behind every great relationship is a supportive wingman. wingMan is an AI-powered web application that helps you plan unforgettable dates, track your dating journey, and make every moment count.

## Features

- **AI Wingman Chat**: Chat with Gemini AI to get personalized date ideas based on your preferences and profile
- **Smart Date Planning**: Create and manage date plans with integrated location services
- **Google Maps Integration**: Find perfect date spots with real-time map integration
- **PDF Export**: Export your date plans to beautiful PDFs you can save or share
- **Progress Tracking**: Save favorite dates, rate experiences, and track your dating journey

## Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons

### State Management

- **Zustand** - Lightweight state management
- **Jotai** - Atomic state management (optional)

### AI & APIs

- **Google Generative AI SDK** - Gemini AI integration for chat
- **Google Maps API** - Location and mapping services

### PDF Generation

- **@react-pdf/renderer** - PDF generation and export

## Getting Started

### Prerequisites

- Node.js 20+ installed
- API Keys for:
  - Google Gemini AI
  - Google Maps

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.local.example .env.local
```

3. Edit `.env.local` and add your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
wing-man/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── chat/              # AI chat interface
│   ├── dates/             # Date management pages
│   ├── profile/           # User profile pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── api/              # API integrations
│   │   ├── gemini.ts     # Gemini AI integration
│   │   └── googleMaps.ts # Google Maps API
│   ├── store/            # State management
│   │   └── chatStore.ts  # Chat state store
│   └── pdf/              # PDF generation
│       └── DatePlanPDF.tsx
└── public/               # Static assets
```

## API Setup

### Google Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key
3. Add to `.env.local` as `GEMINI_API_KEY`

### Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API and Places API
3. Create credentials (API Key)
4. Add to `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Completed Features

- [x] User authentication (NextAuth.js with Google OAuth)
- [x] AI chat interface with Gemini
- [x] Date planning and conversation management
- [x] Google Maps integration (Places API)
- [x] Date history and rating system
- [x] PDF export functionality
- [x] User profile management
- [x] Responsive design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
