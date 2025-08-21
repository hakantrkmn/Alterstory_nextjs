# Supabase Setup Instructions

This document provides step-by-step instructions for setting up the Supabase backend infrastructure for the Interactive Story Platform.

## Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Create a Supabase account at https://supabase.com

## Local Development Setup

1. Initialize Supabase in your project (if not already done):
   ```bash
   supabase init
   ```

2. Start the local Supabase stack:
   ```bash
   supabase start
   ```

3. Apply the database migrations:
   ```bash
   supabase db reset
   ```

4. The local Supabase services will be available at:
   - API URL: http://127.0.0.1:54321
   - Studio URL: http://127.0.0.1:54323
   - Inbucket URL: http://127.0.0.1:54324

## Production Setup

1. Create a new Supabase project:
   ```bash
   supabase projects create interactive-story-platform
   ```

2. Link your local project to the remote project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Push the database schema to production:
   ```bash
   supabase db push
   ```

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth (optional)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

## Authentication Setup

### Email/Password Authentication
Email/password authentication is enabled by default in the configuration.

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add the redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
7. Update your environment variables with the client ID and secret

## Storage Setup

The avatar storage bucket is automatically created with the migrations. The bucket allows:
- Users to upload one avatar per account
- Public read access to all avatars
- Users can only modify their own avatars

## Database Schema Overview

The database includes the following tables:
- `profiles`: User profile information
- `stories`: Story content and metadata
- `story_contributions`: Tracks user contributions to story trees
- `story_votes`: Like/dislike votes on stories
- `comments`: Comments on story segments
- `admin_users`: Admin user accounts

## Admin Panel Access

A default admin user is created with:
- Username: `admin`
- Password: `admin123`

**Important**: Change this password in production!

## Testing the Setup

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000 and test:
   - User registration
   - User login
   - Story creation
   - Story continuation
   - Voting and commenting

## Troubleshooting

### Common Issues

1. **Migration errors**: Ensure you have the latest Supabase CLI version
2. **Authentication issues**: Check your environment variables
3. **Storage issues**: Verify the storage bucket was created correctly
4. **RLS policy errors**: Check that policies are properly applied

### Useful Commands

```bash
# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts

# View logs
supabase logs

# Stop local services
supabase stop
```

## Security Notes

1. Row Level Security (RLS) is enabled on all tables
2. Users can only access their own data where appropriate
3. Admin functions are protected with SECURITY DEFINER
4. Storage policies restrict avatar uploads to authenticated users
5. All user inputs are validated at the database level

## Next Steps

After completing the Supabase setup:
1. Test all authentication flows
2. Verify database operations work correctly
3. Test storage functionality
4. Proceed to implement the frontend components