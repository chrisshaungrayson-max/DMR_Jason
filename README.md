# Nutrition & Fitness Goals App

A React Native Expo app for tracking nutrition and managing fitness goals with analytics.

## Features

### 🎯 Fitness Goals
- **Goal Types**: Calorie streaks, protein streaks, body fat %, weight targets, lean mass gain
- **Smart Progress Tracking**: Automatic calculation based on nutrition data
- **Achievement System**: Goals auto-complete when criteria are met
- **Analytics**: Trend charts, streak heatmaps, and ideal macro comparisons
- **One Active Goal Per Type**: Prevents conflicts and maintains focus

### 📊 Nutrition Tracking
- Daily calorie and macro logging
- Integration with goal progress calculations
- Historical data visualization
- Ideal macro recommendations

### 📱 User Experience
- Clean, accessible interface with dark/light theme support
- Coach-like guidance and validation messages
- Empty states with helpful action prompts
- Comprehensive E2E testing for reliability

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account (for backend)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd DMR_Jason_LAM-main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
npx supabase db push

# Start the development server
npm run start
```

### Environment Variables

Required:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Authentication (Clerk):
```bash
# Clerk publishable key (client-safe)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

See `lib/config.ts` for how this is loaded.

### Configure Supabase to trust Clerk (External JWT)
To allow Supabase Row Level Security (RLS) to evaluate `auth.uid()` using Clerk user IDs:

1) Clerk Dashboard → JWT Templates → create a template named `supabase` with claim:
   - `aud = authenticated`
2) Supabase → Settings → API → JWT:
   - Audience: `authenticated`
   - Issuer: `https://<your-frontend-api>`
   - JWKS URL: `https://<your-frontend-api>/.well-known/jwks.json`
3) The app already requests this token via `getToken({ template: 'supabase' })` and injects it into all Supabase requests.

### Verify end-to-end
- In development, open the in-app Dev Panel and use:
  - Get `auth.uid()` (RPC `public.get_auth_uid`) to confirm the current Clerk user ID.
  - Check profile exists (created on first sign-in by the app).
  - Preview Clerk token (first 24 chars) for sanity.

Optional (Goals Configuration):
```bash
# Number of top goals to display on Dashboard (default: 3)
EXPO_PUBLIC_TOP_N_GOALS=3

# Feature flags (default: true)
EXPO_PUBLIC_ENABLE_PROTEIN_GOALS=true
EXPO_PUBLIC_ENABLE_BODY_COMPOSITION_GOALS=true
EXPO_PUBLIC_ENABLE_STREAK_ANALYTICS=true

# Streak configuration
EXPO_PUBLIC_STREAK_STRICT_MODE=true
EXPO_PUBLIC_DEFAULT_STREAK_DAYS=14

# Analytics configuration
EXPO_PUBLIC_TREND_CHART_WEEKS=8
EXPO_PUBLIC_HEATMAP_DAYS=28

# Goal limits
EXPO_PUBLIC_MAX_ACTIVE_GOALS=10
EXPO_PUBLIC_MAX_GOAL_DURATION_DAYS=365
```

## Architecture

### Database Schema

#### Goals Table
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type goal_type NOT NULL,
  params JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  status goal_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type, active) WHERE active = true
);
```

#### Goal Types
- `calorie_streak`: Daily calorie compliance streaks
- `protein_streak`: Daily protein target streaks  
- `body_fat_percentage`: Body fat % reduction goals
- `weight_target`: Weight loss/gain goals
- `lean_mass_gain`: Lean muscle mass goals

### Key Components

#### State Management
- `store/goals-store.tsx`: Goal CRUD operations and progress computation
- `store/nutrition-store.tsx`: Nutrition data with goal integration
- `store/user-store.tsx`: User preferences and ideal macros

#### Services
- `services/goals.ts`: Goal business logic and validation
- `services/nutrition.ts`: Nutrition data access
- `lib/config.ts`: Centralized configuration management

#### UI Components
- `components/GoalCard.tsx`: Reusable goal display with progress
- `components/TrendLineChart.tsx`: Weekly trend visualization
- `components/StreakHeatmap.tsx`: Daily compliance heatmap
- `components/EmptyState.tsx`: Consistent empty state messaging

### Goal Progress Calculation

#### Streak Goals (Calorie/Protein)
- **Daily Compliance**: Checks if daily intake meets target
- **Strict Mode**: No grace days - every day must comply
- **Achievement**: Completes when target consecutive days reached

#### Numeric Goals (Weight/Body Fat/Lean Mass)
- **Weekly Averages**: Uses 7-day rolling averages for stability
- **Minimum Data**: Requires at least weekly measurements
- **Timezone Aware**: Respects user's local timezone for day boundaries

## Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run e2e:test

# Test coverage
npm run test:coverage
```

### Code Structure

```
app/
├── (tabs)/           # Main tab navigation screens
│   ├── index.tsx     # Dashboard with goal widgets
│   ├── profile.tsx   # Goal management UI
│   └── history.tsx   # Analytics and trends
├── components/       # Reusable UI components
services/            # Business logic layer
store/               # State management
types/               # TypeScript definitions
utils/               # Helper functions
lib/                 # Configuration and utilities
supabase/            # Database migrations
e2e/                 # End-to-end tests
```

### Adding New Goal Types

1. **Update Types** (`types/goal.ts`):
```typescript
export enum GoalType {
  // ... existing types
  NEW_TYPE = 'new_type',
}

export interface NewTypeParams {
  targetValue: number;
  // ... other params
}
```

2. **Add Service Logic** (`services/goals.ts`):
```typescript
export function calculateNewTypeProgress(goal: Goal, data: any[]): GoalProgress {
  // Implementation
}
```

3. **Update UI Components**:
- Add goal type to creation form
- Handle display in `GoalCard`
- Add analytics if needed

## API Reference

### Supabase Endpoints

#### Goals
- `GET /rest/v1/goals` - List user's goals with filtering
- `POST /rest/v1/goals` - Create new goal
- `PATCH /rest/v1/goals?id=eq.{id}` - Update goal status
- `DELETE /rest/v1/goals?id=eq.{id}` - Delete goal

#### Nutrition Data
- `GET /rest/v1/days` - Daily nutrition records
- `GET /rest/v1/profiles` - User profile data

### Query Filters

Goals support filtering by:
- `user_id=eq.{uuid}` - User's goals
- `active=eq.{boolean}` - Active/inactive goals
- `type=eq.{goal_type}` - Specific goal type
- `status=eq.{goal_status}` - Goal status

## Testing

### E2E Test Coverage

The smoke test covers:
1. **Goal Creation**: Create calorie streak goal via Profile UI
2. **Dashboard Display**: Verify goal appears in active widgets
3. **Analytics Verification**: Check trend charts and heatmaps render
4. **Achievement Flow**: Mock compliant data and verify goal completion
5. **State Transitions**: Ensure achieved goals move to archived state

### Unit Test Coverage

- Goal validation and business logic
- Progress calculation algorithms
- Store actions and selectors
- Component rendering and interactions
- Analytics data transformations

## Deployment

### Environment Setup

1. **Supabase**: Set up database with migrations
2. **Environment Variables**: Configure production values
3. **Build**: `npm run build` for web or `eas build` for mobile

### CI/CD

GitHub Actions workflow (`.github/workflows/e2e.yml`) runs:
- Dependency installation
- Playwright browser setup
- E2E test execution
- Artifact upload on failure

## Configuration

The app uses `lib/config.ts` for centralized configuration management. All settings can be overridden via environment variables without code changes.

### Feature Flags

Disable features in production:
```bash
EXPO_PUBLIC_ENABLE_PROTEIN_GOALS=false
EXPO_PUBLIC_ENABLE_BODY_COMPOSITION_GOALS=false
```

### Performance Tuning

Adjust analytics scope:
```bash
EXPO_PUBLIC_TREND_CHART_WEEKS=4  # Reduce for faster loading
EXPO_PUBLIC_HEATMAP_DAYS=14      # Smaller heatmaps
```

## Troubleshooting

### Common Issues

**Goals not appearing on Dashboard:**
- Check if goals are active (`active: true`)
- Verify `TOP_N_GOALS` configuration
- Ensure user has active goals of different types

**Progress not updating:**
- Verify nutrition data exists for calculation period
- Check timezone configuration matches user's location
- Ensure goal parameters are valid

**E2E tests failing:**
- Check Expo dev server is running on correct port
- Verify environment variables are set
- Ensure Playwright browsers are installed

### Debug Mode

Enable detailed logging:
```bash
DEBUG=goals:* npm run start
```

## Contributing

1. **Code Style**: Follow existing TypeScript and React Native conventions
2. **Testing**: Add unit tests for new features, update E2E tests for UI changes
3. **Documentation**: Update README and inline comments
4. **Accessibility**: Ensure new components have proper ARIA labels and testIDs

## License

Created by Rork
