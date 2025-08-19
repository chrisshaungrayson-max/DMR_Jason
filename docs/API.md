# API Documentation

## Overview

The fitness goals feature integrates with Supabase for data persistence and provides a comprehensive API for goal management, progress tracking, and analytics.

## Database Schema

### Goals Table

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
  
  -- Constraints
  UNIQUE(user_id, type, active) WHERE active = true,
  CHECK (start_date <= end_date),
  CHECK (params IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_goals_user_active ON goals(user_id, active);
CREATE INDEX idx_goals_type ON goals(type);
CREATE INDEX idx_goals_status ON goals(status);
```

### Goal Types Enum

```sql
CREATE TYPE goal_type AS ENUM (
  'calorie_streak',
  'protein_streak', 
  'body_fat_percentage',
  'weight_target',
  'lean_mass_gain'
);
```

### Goal Status Enum

```sql
CREATE TYPE goal_status AS ENUM (
  'active',
  'paused',
  'achieved',
  'failed',
  'cancelled'
);
```

## REST API Endpoints

### Goals

#### List Goals
```http
GET /rest/v1/goals
```

**Query Parameters:**
- `user_id=eq.{uuid}` - Filter by user ID
- `active=eq.{boolean}` - Filter by active status
- `type=eq.{goal_type}` - Filter by goal type
- `status=eq.{goal_status}` - Filter by status
- `select=*` - Select specific columns

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "calorie_streak",
    "params": {
      "targetDays": 14,
      "basis": "recommended"
    },
    "start_date": "2024-01-01",
    "end_date": "2024-01-15",
    "active": true,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Goal
```http
POST /rest/v1/goals
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "type": "calorie_streak",
  "params": {
    "targetDays": 14,
    "basis": "recommended"
  },
  "start_date": "2024-01-01",
  "end_date": "2024-01-15"
}
```

**Response:** Created goal object with generated ID

#### Update Goal
```http
PATCH /rest/v1/goals?id=eq.{id}
```

**Request Body:**
```json
{
  "status": "achieved",
  "active": false,
  "updated_at": "2024-01-15T00:00:00Z"
}
```

#### Delete Goal
```http
DELETE /rest/v1/goals?id=eq.{id}
```

### Nutrition Data

#### Daily Records
```http
GET /rest/v1/days
```

**Query Parameters:**
- `user_id=eq.{uuid}` - Filter by user ID
- `date=gte.{date}` - Records from date onwards
- `date=lte.{date}` - Records up to date
- `order=date.desc` - Order by date

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid", 
    "date": "2024-01-01",
    "calories": 2200,
    "protein": 150,
    "carbs": 250,
    "fat": 80,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

## Goal Parameters Schema

### Calorie Streak
```typescript
interface CalorieStreakParams {
  targetDays: number;        // Number of consecutive days
  basis: 'recommended' | 'custom';
  customCalories?: number;   // Required if basis is 'custom'
}
```

### Protein Streak
```typescript
interface ProteinStreakParams {
  targetDays: number;
  gramsPerDay: number;       // Daily protein target in grams
}
```

### Body Fat Percentage
```typescript
interface BodyFatParams {
  targetPercentage: number;  // Target body fat %
  currentPercentage: number; // Starting body fat %
}
```

### Weight Target
```typescript
interface WeightTargetParams {
  targetWeight: number;      // Target weight in kg
  currentWeight: number;     // Starting weight in kg
  weeklyRate: number;        // kg per week (positive for gain, negative for loss)
}
```

### Lean Mass Gain
```typescript
interface LeanMassParams {
  targetGain: number;        // Target gain in kg
  weeklyRate: number;        // kg per week
}
```

## Progress Calculation

### Streak Goals

Progress is calculated by checking daily compliance:

```typescript
interface StreakProgress {
  currentStreak: number;     // Current consecutive compliant days
  longestStreak: number;     // Longest streak achieved
  targetDays: number;        // Goal target
  complianceRate: number;    // Overall compliance percentage
  isCompliant: boolean;      // Today's compliance status
  daysRemaining: number;     // Days left to achieve goal
}
```

**Compliance Rules:**
- **Calorie Streak**: Daily calories >= recommended or custom target
- **Protein Streak**: Daily protein >= specified grams per day

### Numeric Goals

Progress uses 7-day rolling averages for stability:

```typescript
interface NumericProgress {
  currentValue: number;      // Latest 7-day average
  targetValue: number;       // Goal target
  startValue: number;        // Starting value
  progressPercent: number;   // Progress towards goal (0-100)
  weeklyRate: number;        // Current rate of change per week
  projectedCompletion: string; // Estimated completion date
  onTrack: boolean;          // Whether on pace to meet goal
}
```

## Error Handling

### Common Error Responses

#### Validation Error (400)
```json
{
  "code": "PGRST116",
  "message": "JSON object requested, multiple (or no) rows returned",
  "details": "The result contains 0 rows"
}
```

#### Conflict Error (409)
```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint",
  "details": "Key (user_id, type, active)=(uuid, calorie_streak, true) already exists."
}
```

#### Not Found (404)
```json
{
  "code": "PGRST116", 
  "message": "JSON object requested, multiple (or no) rows returned",
  "details": "The result contains 0 rows"
}
```

## Rate Limits

Supabase applies the following limits:
- **Free Tier**: 500 requests per second
- **Pro Tier**: 1000 requests per second
- **Enterprise**: Custom limits

## Authentication

All endpoints require authentication via Supabase Auth:

```http
Authorization: Bearer {jwt_token}
```

Row Level Security (RLS) ensures users can only access their own data:

```sql
-- Goals RLS Policy
CREATE POLICY "Users can manage their own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);
```

## Webhooks

### Goal Achievement Notifications

When a goal is automatically marked as achieved, a webhook can be triggered:

```json
{
  "type": "goal.achieved",
  "data": {
    "goal_id": "uuid",
    "user_id": "uuid", 
    "goal_type": "calorie_streak",
    "achieved_at": "2024-01-15T00:00:00Z"
  }
}
```

## SDK Usage Examples

### TypeScript Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Create a goal
const { data, error } = await supabase
  .from('goals')
  .insert({
    user_id: userId,
    type: 'calorie_streak',
    params: { targetDays: 14, basis: 'recommended' },
    start_date: '2024-01-01',
    end_date: '2024-01-15'
  })
  .select();

// Get active goals
const { data: goals } = await supabase
  .from('goals')
  .select('*')
  .eq('user_id', userId)
  .eq('active', true);

// Update goal status
const { error } = await supabase
  .from('goals')
  .update({ status: 'achieved', active: false })
  .eq('id', goalId);
```

### Real-time Subscriptions

```typescript
// Subscribe to goal changes
const subscription = supabase
  .channel('goals')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'goals' },
    (payload) => {
      console.log('Goal updated:', payload);
    }
  )
  .subscribe();
```

## Performance Considerations

### Indexing Strategy

- Primary queries filter by `user_id` and `active` status
- Secondary indexes on `type` and `status` for analytics
- Composite index on `(user_id, active)` for dashboard queries

### Query Optimization

- Use `select` parameter to limit returned columns
- Apply filters server-side rather than client-side
- Batch operations when possible
- Use pagination for large result sets

### Caching

- Cache goal configurations and user preferences
- Invalidate cache on goal status changes
- Use Supabase real-time for cache invalidation

## Migration Guide

### Schema Changes

When updating goal types or parameters:

1. **Add new enum values** (backward compatible)
2. **Update application code** to handle new types
3. **Run data migration** if needed
4. **Deploy application updates**

### Breaking Changes

Version 2.0 introduces:
- New `goal_measurements` table for manual entries
- Updated progress calculation algorithms
- Enhanced parameter validation

Migrate existing goals:
```sql
-- Example migration script
UPDATE goals 
SET params = jsonb_set(params, '{version}', '2')
WHERE params->>'version' IS NULL;
```
