# Supabase Database Configuration

This directory contains all the database configuration files for the Interactive Story Platform.

## File Structure

```
supabase/
├── config.toml              # Supabase project configuration
├── seed.sql                 # Initial data for development
├── migrations/              # Database schema migrations
│   ├── 001_initial_schema.sql    # Core tables and constraints
│   ├── 002_indexes.sql           # Performance indexes
│   ├── 003_functions_and_triggers.sql  # Database functions
│   ├── 004_triggers.sql          # Database triggers
│   ├── 005_rls_policies.sql      # Row Level Security policies
│   └── 006_storage_setup.sql     # Storage bucket and policies
└── README.md               # This file
```

## Migration Files

### 001_initial_schema.sql
Creates the core database tables:
- `profiles`: User profile information
- `stories`: Story content and hierarchy
- `story_contributions`: Tracks user contributions per story tree
- `story_votes`: Like/dislike voting system
- `comments`: Comment system for stories
- `admin_users`: Admin panel authentication

### 002_indexes.sql
Creates database indexes for optimal query performance on frequently accessed columns.

### 003_functions_and_triggers.sql
Implements database functions for:
- Automatic counter updates (likes, comments, continuations)
- User profile creation on signup
- Admin authentication
- Cascade delete operations
- Platform statistics

### 004_triggers.sql
Sets up database triggers for:
- Automatic profile creation when users sign up
- Real-time counter updates
- Timestamp management

### 005_rls_policies.sql
Configures Row Level Security policies to ensure:
- Users can only modify their own data
- Public read access where appropriate
- Secure admin operations

### 006_storage_setup.sql
Sets up the avatar storage bucket with proper access policies.

## Key Features

### Story Tree Structure
- Stories are organized in a tree hierarchy
- Each user can contribute only once per story tree
- Configurable branching limits (default: 3 continuations per segment)
- Automatic level and position tracking

### Security
- Row Level Security enabled on all tables
- JWT-based authentication
- Secure admin functions
- Protected storage policies

### Performance
- Comprehensive indexing strategy
- Automatic counter updates via triggers
- Optimized queries for common operations

### Real-time Features
- Supabase real-time subscriptions enabled
- Live updates for votes, comments, and new continuations
- Real-time counter updates

## Usage

1. Initialize Supabase: `supabase init`
2. Start local development: `supabase start`
3. Apply migrations: `supabase db reset`
4. Validate setup: Run `scripts/validate-supabase.sql` in Supabase Studio

## Environment Configuration

The `config.toml` file configures:
- Local development ports
- Authentication providers (email/password + Google OAuth)
- Storage settings
- Real-time subscriptions
- API settings

## Admin Panel

A default admin user is created with:
- Username: `admin`
- Password: `admin123`

**Important**: Change this password in production environments.

## Contributing

When adding new features:
1. Create new migration files with incremental numbering
2. Update the database types in `src/types/database.ts`
3. Add appropriate RLS policies
4. Include performance indexes
5. Update this README with new features