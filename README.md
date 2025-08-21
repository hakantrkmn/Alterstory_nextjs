# Interactive Story Platform

A collaborative storytelling platform where users can create branching stories and continue each other's narratives.

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Deployment**: Vercel (recommended)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── feed/              # Main feed page
│   ├── create/            # Story creation page
│   ├── story/[id]/        # Story reading page
│   ├── profile/[username]/ # User profile page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Shadcn/ui components
│   ├── story/            # Story-related components
│   ├── auth/             # Authentication components
│   └── navigation/       # Navigation components
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase client and types
│   ├── utils/            # Helper functions
│   └── hooks/            # Custom React hooks
└── types/                # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Testing Supabase Connection

The homepage includes an automatic Supabase connection test that will:
- ✅ Verify database connectivity
- ✅ Display connection status
- ✅ Show environment variables (partially masked)
- ✅ Enable/disable features based on connection status

If the connection fails:
1. Check your `.env` file has correct Supabase credentials
2. Verify your Supabase project is active
3. Ensure your internet connection is working
4. Use the "Tekrar Dene" (Retry) button to test again

### Database Setup

The database schema and setup will be handled in subsequent tasks. The required tables include:
- `profiles` (user profiles)
- `stories` (story content and tree structure)
- `story_contributions` (track user contributions)
- `story_votes` (like/dislike system)
- `comments` (story comments)

## Features

- **Story Creation**: Users can start new stories
- **Story Continuation**: Continue existing stories with branching paths
- **Story Tree Navigation**: Navigate through story branches
- **User Authentication**: Email/password and Google OAuth
- **Voting System**: Like/dislike stories
- **Comments**: Comment on story segments
- **User Profiles**: View user statistics and contributions
- **Search**: Search stories and users
- **Real-time Updates**: Live comments and votes

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

This project follows a spec-driven development approach. See the `.kiro/specs/interactive-story-platform/` directory for detailed requirements, design, and implementation tasks.

## License

MIT License