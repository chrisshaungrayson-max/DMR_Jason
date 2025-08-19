/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// --- Mocks ---
vi.mock('react-native', () => {
  const React = require('react');
  return {
    View: ({ children }: any) => React.createElement('div', null, children),
    Text: ({ children }: any) => React.createElement('span', null, children),
    ScrollView: ({ children }: any) => React.createElement('div', null, children),
    Pressable: ({ onPress, children }: any) => React.createElement('button', { onClick: onPress }, children),
    TouchableOpacity: ({ onPress, accessibilityLabel, children, disabled, testID }: any) =>
      React.createElement('button', { onClick: onPress, 'aria-label': accessibilityLabel, disabled, 'data-testid': testID }, children),
    TextInput: ({ value, onChangeText }: any) =>
      React.createElement('input', {
        value: value ?? '',
        onChange: (e: any) => onChangeText?.(e.target.value),
      }),
    Switch: ({ value, onValueChange }: any) =>
      React.createElement('input', {
        type: 'checkbox',
        checked: !!value,
        onChange: (e: any) => onValueChange?.(e.target.checked),
      }),
    Modal: ({ visible, children }: any) => (visible ? React.createElement('div', null, children) : null),
    StyleSheet: { create: (s: any) => s },
    Platform: { OS: 'ios' },
    Alert: { alert: vi.fn() },
    Image: (props: any) => React.createElement('img', props),
  };
});

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('expo-haptics', () => ({ notificationAsync: vi.fn(), NotificationFeedbackType: { Success: 1, Warning: 2 } }));
vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));
vi.mock('@/services/storage', () => ({ uploadAvatarAsync: vi.fn().mockResolvedValue('https://example.com/img.jpg') }));

// Capture CustomDatePicker props for interaction
let lastDatePickerProps: any = null;
vi.mock('@/app/components/CustomDatePicker', () => ({ __esModule: true, default: (props: any) => { lastDatePickerProps = props; return null; } }));

// Stable theme
vi.mock('@/store/user-store', () => ({
  useUser: () => ({
    user: {
      name: 'Jane Doe',
      profilePicture: '',
      height: '170',
      weight: '70',
      age: '30',
      sex: 'female',
      activityLevel: 'moderate',
      useMetricUnits: true,
    },
    updateUser: vi.fn(),
    logout: vi.fn(),
    colorScheme: 'light',
  }),
}));

// Goals hook mock (overridden per test)
const createGoalMock = vi.fn();
const baseGoalsState: any = {
  goals: [] as any[],
  archived: [],
  isLoading: false,
  error: null,
  topNActive: (n: number) => [] as any[],
  refreshProgress: vi.fn(),
  createGoal: createGoalMock,
  setActive: vi.fn(),
  deactivate: vi.fn(),
  deleteGoal: vi.fn(),
};
vi.mock('@/store/goals-store', () => ({ useGoals: () => baseGoalsState }));

import ProfileScreen from '@/app/(tabs)/profile';
import { strings } from '@/utils/strings';

describe.sequential('Profile create goal flow', () => {
  beforeEach(() => {
    createGoalMock.mockReset();
    baseGoalsState.goals = []; // default: no active goals
    baseGoalsState.archived = [];
    lastDatePickerProps = null;
  });
  
  afterEach(() => {
    cleanup();
  });

  it('creates a calorie_streak goal after selecting end date and submitting', async () => {
    render(<ProfileScreen />);

    // Open create modal
    const openBtn = screen.getByTestId('open-create-goal');
    fireEvent.click(openBtn);

    // Choose goal type: calorie_streak is default, keep it

    // Open end date picker and set a date via mocked component
    const endDateBtn = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    fireEvent.click(endDateBtn);
    expect(lastDatePickerProps).toBeTruthy();
    // Simulate selecting end date
    const picked = new Date(Date.UTC(2099, 0, 31, 12, 0, 0));
    lastDatePickerProps.onDateChange(picked);
    lastDatePickerProps.onClose();

    // Submit create
    const endDateBtnAfter1 = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    const expectedEnd1 = (endDateBtnAfter1.textContent || '').trim();
    const submitBtn = screen.getByTestId('submit-create-goal');
    fireEvent.click(submitBtn);

    // Assert createGoal called with validated params
    expect(createGoalMock).toHaveBeenCalledTimes(1);
    const payload = createGoalMock.mock.calls[0][0];
    expect(payload.type).toBe('calorie_streak');
    expect(payload.params).toMatchObject({ targetDays: 14, basis: 'recommended' });
    expect(payload.start_date).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(payload.end_date).toBe(expectedEnd1);
    expect(payload.active).toBe(true);
  });

  it('disables create and shows conflict notice when same-type active goal exists', async () => {
    // Inject one active calorie_streak goal
    baseGoalsState.goals = [{ id: 'g1', type: 'calorie_streak', status: 'active', active: true, start_date: '2024-01-01' } as any];

    render(<ProfileScreen />);

    const openBtn = screen.getByTestId('open-create-goal');
    fireEvent.click(openBtn);

    // Conflict notice visible
    expect(await screen.findByText(strings.profile.goal.conflictTitle)).toBeTruthy();
    expect(screen.getByText(strings.profile.goal.conflictBody)).toBeTruthy();

    // Create button disabled and shows resolve text
    const submitBtn = await screen.findByTestId('submit-create-goal');
    expect(submitBtn.getAttribute('disabled')).not.toBeNull();
    expect(screen.getByText(strings.profile.goal.createResolveConflict)).toBeTruthy();
  });

  it('creates a body_fat goal with default targetPct', async () => {
    render(<ProfileScreen />);

    const openBtn = screen.getByTestId('open-create-goal');
    fireEvent.click(openBtn);

    // Select type: body_fat
    const bodyFatBtn = await screen.findByRole('button', { name: 'body fat' });
    fireEvent.click(bodyFatBtn);

    // Pick end date
    const endDateBtn = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    fireEvent.click(endDateBtn);
    const picked = new Date(Date.UTC(2099, 1, 15, 12, 0, 0));
    lastDatePickerProps.onDateChange(picked);
    lastDatePickerProps.onClose();

    // Submit
    const endDateBtnAfter2 = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    const expectedEnd2 = (endDateBtnAfter2.textContent || '').trim();
    const submitBtn = screen.getByTestId('submit-create-goal');
    fireEvent.click(submitBtn);

    expect(createGoalMock).toHaveBeenCalledTimes(1);
    const payload = createGoalMock.mock.calls[0][0];
    expect(payload.type).toBe('body_fat');
    expect(payload.params).toMatchObject({ targetPct: 15 });
    expect(payload.end_date).toBe(expectedEnd2);
  });

  it('creates a weight goal with direction up', async () => {
    render(<ProfileScreen />);

    const openBtn = screen.getByTestId('open-create-goal');
    fireEvent.click(openBtn);

    // Select type: weight
    const weightBtn = await screen.findByRole('button', { name: 'weight' });
    fireEvent.click(weightBtn);

    // Toggle direction to up
    const gainBtn = await screen.findByText('Gain');
    fireEvent.click(gainBtn);

    // End date
    const endDateBtn = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    fireEvent.click(endDateBtn);
    lastDatePickerProps.onDateChange(new Date(Date.UTC(2099, 1, 20, 12, 0, 0)));
    lastDatePickerProps.onClose();

    // Submit
    const endDateBtnAfter3 = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    const expectedEnd3 = (endDateBtnAfter3.textContent || '').trim();
    const submitBtn = await screen.findByTestId('submit-create-goal');
    fireEvent.click(submitBtn);

    expect(createGoalMock).toHaveBeenCalledTimes(1);
    const payload = createGoalMock.mock.calls[0][0];
    expect(payload.type).toBe('weight');
    expect(payload.params).toMatchObject({ targetWeightKg: 75, direction: 'up' });
    expect(payload.end_date).toBe(expectedEnd3);
  });

  it('creates a lean_mass_gain goal with default targetKg', async () => {
    render(<ProfileScreen />);

    const openBtn = screen.getByTestId('open-create-goal');
    fireEvent.click(openBtn);

    const leanBtn = await screen.findByRole('button', { name: 'lean mass gain' });
    fireEvent.click(leanBtn);

    const endDateBtn = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    fireEvent.click(endDateBtn);
    lastDatePickerProps.onDateChange(new Date(Date.UTC(2099, 2, 1, 12, 0, 0)));
    lastDatePickerProps.onClose();

    const endDateBtnAfter4 = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    const expectedEnd4 = (endDateBtnAfter4.textContent || '').trim();
    const submitBtn = await screen.findByTestId('submit-create-goal');
    fireEvent.click(submitBtn);

    expect(createGoalMock).toHaveBeenCalledTimes(1);
    const payload = createGoalMock.mock.calls[0][0];
    expect(payload.type).toBe('lean_mass_gain');
    expect(payload.params).toMatchObject({ targetKg: 2 });
    expect(payload.end_date).toBe(expectedEnd4);
  });

  it('creates a protein_streak goal with grams/day and days', async () => {
    render(<ProfileScreen />);

    const openBtn = screen.getByTestId('open-create-goal');
    fireEvent.click(openBtn);

    const proteinBtn = await screen.findByRole('button', { name: 'protein streak' });
    fireEvent.click(proteinBtn);

    const endDateBtn = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    fireEvent.click(endDateBtn);
    lastDatePickerProps.onDateChange(new Date(Date.UTC(2099, 1, 10, 12, 0, 0)));
    lastDatePickerProps.onClose();

    const endDateBtnAfter5 = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    const expectedEnd5 = (endDateBtnAfter5.textContent || '').trim();
    const submitBtn = await screen.findByTestId('submit-create-goal');
    fireEvent.click(submitBtn);

    expect(createGoalMock).toHaveBeenCalledTimes(1);
    const payload = createGoalMock.mock.calls[0][0];
    expect(payload.type).toBe('protein_streak');
    expect(payload.params).toMatchObject({ gramsPerDay: 140, targetDays: 14 });
    expect(payload.end_date).toBe(expectedEnd5);
  });

  it('shows validation error for body_fat when target % is out of range', async () => {
    render(<ProfileScreen />);

    const openBtn = screen.getByTestId('open-create-goal');
    fireEvent.click(openBtn);

    const bodyFatBtn = await screen.findByRole('button', { name: 'body fat' });
    fireEvent.click(bodyFatBtn);

    // Change target % to an invalid value (e.g., 2)
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '2' } });

    const endDateBtn = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    fireEvent.click(endDateBtn);
    lastDatePickerProps.onDateChange(new Date(Date.UTC(2099, 1, 1, 12, 0, 0)));
    lastDatePickerProps.onClose();

    const endDateBtnAfter6 = await screen.findByRole('button', { name: strings.profile.goal.endDate });
    const expectedEnd6 = (endDateBtnAfter6.textContent || '').trim();
    const submitBtn = await screen.findByTestId('submit-create-goal');
    fireEvent.click(submitBtn);

    // Error notice present
    expect(await screen.findByText("Can't create goal")).toBeTruthy();
    expect(
      screen.getByText('Choose a body fat percentage between 5% and 45%.')
    ).toBeTruthy();
    // Ensure no create call
    expect(createGoalMock).not.toHaveBeenCalled();
  });
});
