# PRD: Gluestack UI Migration with Floating Action Button

## Introduction/Overview

This feature migrates the existing React Native fitness app from custom UI components to Gluestack UI components while maintaining the current design theme and user experience. Additionally, it replaces the current center tab "+" button with a modern floating action button (FAB) positioned in the bottom-right corner of the screen.

The migration will modernize the UI framework, improve component consistency, reduce maintenance overhead, and provide better accessibility support while preserving the app's distinctive gold-themed design and dark mode functionality.

## Goals

1. **Complete UI Framework Migration**: Replace all common UI primitives (buttons, inputs, modals, cards, etc.) with Gluestack UI equivalents
2. **Theme Preservation**: Maintain exact color scheme from `constants/colors.ts` including gold tint and light/dark mode support
3. **FAB Implementation**: Replace center tab "+" button with a floating action button that provides the same functionality
4. **Accessibility Enhancement**: Improve accessibility through Gluestack's built-in a11y features
5. **Code Consistency**: Standardize component usage across the entire application
6. **Performance Optimization**: Leverage Gluestack's optimized component implementations

## User Stories

1. **As a user**, I want the app to look and feel exactly the same after the migration so that my experience remains consistent
2. **As a user**, I want to access the food logging and TDEE calculation features through a modern floating button so that the interface feels more intuitive
3. **As a user**, I want the app to maintain dark mode functionality so that I can use it comfortably in different lighting conditions
4. **As a developer**, I want consistent UI components throughout the app so that maintenance and feature development is easier
5. **As a developer**, I want improved accessibility features so that the app is usable by more people

## Functional Requirements

### Theme Integration
1. The system must create a custom Gluestack theme that maps existing colors from `constants/colors.ts`
2. The system must support light and dark mode switching via `useUser().colorScheme`
3. The system must preserve the gold tint color (#b8a369 light, #d0c7a9 dark) as the primary accent

### Component Migration
4. The system must replace all Button components with Gluestack Button
5. The system must replace all Text components with Gluestack Text/Heading
6. The system must replace all TextInput components with Gluestack Input
7. The system must replace all Modal components with Gluestack Modal/AlertDialog
8. The system must replace all Pressable components with Gluestack Pressable
9. The system must replace all View containers with appropriate Gluestack Box/VStack/HStack
10. The system must replace all custom card components with Gluestack Card
11. The system must keep RadarChart component unchanged (non-goal exception)
12. The system must preserve Lucide React Native icons within Gluestack components

### FAB Implementation
13. The system must add a Gluestack FAB component positioned 24px from bottom-right screen edge
14. The system must show FAB on all tab screens (Dashboard, History, Profile, Settings)
15. The system must implement spring-in animation for FAB appearance
16. The system must make FAB trigger the same `TDEEActionModal` as current "+" button
17. The system must remove the center `Tabs.Screen name="log-food"` tab entirely
18. The system must maintain current tab bar styling without the center button

### Accessibility
19. The system must add accessibility labels to FAB ("Add", "Open actions menu")
20. The system must increase FAB hit area for better touch targets
21. The system must ensure proper focus order for screen readers
22. The system must maintain existing accessibility features in migrated components

### Testing
23. The system must update test selectors to target new Gluestack components
24. The system must add testID props to FAB and key interactive elements
25. The system must ensure all existing Playwright e2e tests continue to pass

## Non-Goals (Out of Scope)

1. **Custom Chart Components**: RadarChart, TrendLineChart, StreakHeatmap will remain unchanged
2. **Web Platform Support**: Migration targets iOS and Android only
3. **Design System Changes**: No visual design changes beyond component framework
4. **New Features**: No additional functionality beyond FAB replacement
5. **Animation Library Changes**: Keep existing react-native-reanimated setup
6. **Navigation Changes**: Tab structure remains the same (minus center tab)

## Design Considerations

### Theme Configuration
- Extend `@gluestack-ui/config` with custom theme tokens
- Map `Colors.light` and `Colors.dark` to Gluestack color tokens
- Ensure theme switching works with existing `useUser().colorScheme` hook

### Component Mapping
- `View` → `Box`, `VStack`, `HStack` (based on layout needs)
- `Text` → `Text`, `Heading` (based on typography hierarchy)
- `Pressable` → `Pressable` (Gluestack version)
- `TextInput` → `Input`, `Textarea`
- `Modal` → `Modal`, `AlertDialog`, `Actionsheet`
- Custom buttons → `Button` with variants
- Custom cards → `Card` with custom styling

### FAB Specifications
- Position: `position: 'absolute', bottom: 24, right: 24`
- Size: 56x56px (standard Material Design FAB)
- Icon: Plus from Lucide React Native
- Color: Theme tint color with white icon
- Shadow: Gluestack FAB default elevation
- Animation: Spring-in with scale transform

## Technical Considerations

### Dependencies
- Gluestack UI already installed and configured in `app/_layout.tsx`
- Keep existing `react-native-reanimated` for FAB animations
- Maintain `lucide-react-native` for icons
- No additional dependencies required

### Implementation Strategy
- Create custom theme configuration file
- Update components in logical groups (buttons, inputs, modals, etc.)
- Test each component group before moving to next
- Update tab layout to remove center tab and add FAB
- Run full test suite after each major component group

### Performance Impact
- Gluestack components are optimized and should improve performance
- FAB positioning won't impact tab bar performance
- Theme switching performance should remain the same

## Success Metrics

1. **Visual Consistency**: 100% visual parity with current design
2. **Functionality Preservation**: All existing features work identically
3. **Test Coverage**: All existing tests pass with updated selectors
4. **Performance**: No regression in app startup or interaction times
5. **Accessibility Score**: Improved accessibility audit scores
6. **Code Quality**: Reduced custom styling code by 70%+

## Open Questions

1. Should FAB have any hide/show logic based on keyboard state or scroll position?
2. Are there any specific Gluestack component variants we should standardize on?
3. Should we add haptic feedback to the FAB press interaction?
4. Do we need any custom Gluestack component extensions beyond theme colors?

## Implementation Phases

### Phase 1: Theme Setup
- Create custom Gluestack theme configuration
- Test theme switching with sample components

### Phase 2: Core Components
- Migrate Button, Text, Input components
- Update forms and basic interactions

### Phase 3: Layout Components
- Migrate View → Box/VStack/HStack
- Update card and container components

### Phase 4: Modal & Overlays
- Migrate Modal, Alert, Popover components
- Test TDEEActionModal and FoodLogPopover

### Phase 5: FAB Implementation
- Remove center tab from tab layout
- Add FAB component with proper positioning
- Implement spring animations and accessibility

### Phase 6: Testing & Polish
- Update all test selectors
- Run full e2e test suite
- Performance testing and optimization
