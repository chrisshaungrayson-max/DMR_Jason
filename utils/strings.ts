// Centralized user-facing strings for localization readiness
// Simple structure with English defaults

export const strings = {
  empty: {
    goals: {
      title: 'No active goals yet',
      description: 'Create your first goal from your profile to start tracking progress.',
      actionLabel: 'Go to Profile',
      actionHint: 'Opens your profile to create and manage goals.',
    },
    history: {
      title: 'No nutrition records yet',
      description: 'Log your meals to see history, trends, and streaks here.',
      actionLabel: 'Go to Home',
      actionHint: 'Navigates to the Home tab where you can log a meal.',
    },
  },
  profile: {
    goal: {
      openCreateLabel: 'Create Goal',
      openCreateHint: 'Opens the create goal form',
      closeLabel: 'Close create goal',
      closeHint: 'Dismisses the create goal form',
      modalTitle: 'Create Goal',
      basics: 'Basics',
      type: 'Type',
      startDate: 'Start Date',
      startDateAuto: '(auto)',
      endDate: 'End Date',
      endDateHint: 'Opens date picker to set end date',
      errorTitle: "Can't create goal",
      conflictTitle: 'Conflict',
      conflictBody: 'You already have an active goal of this type. Deactivate it first to create a new one.',
      createAction: 'Create Goal',
      createCreating: 'Creating…',
      createResolveConflict: 'Resolve conflict to continue',
      createdToast: 'Goal created',
    },
    notices: {
      headsUpTitle: 'Heads up',
      headsUpBody: 'Goals cannot be edited after creation. To make changes, delete and recreate the goal.',
    },
  },
} as const;
