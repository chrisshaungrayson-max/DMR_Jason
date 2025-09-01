# Tasks: Gluestack UI Migration with Floating Action Button

## Relevant Files

- `lib/theme/gluestack-theme.ts` - Custom Gluestack theme configuration mapping constants/colors.ts tokens
- `lib/theme/gluestack-theme.test.ts` - Unit tests for theme configuration
- `app/(tabs)/_layout.tsx` - Tab layout requiring FAB implementation and center tab removal
- `app/components/FloatingActionButton.tsx` - New FAB component with spring animations
- `app/components/FloatingActionButton.test.tsx` - Unit tests for FAB component
- `app/(tabs)/index.tsx` - Dashboard screen requiring component migrations
- `app/(tabs)/profile.tsx` - Profile screen requiring component migrations  
- `app/(tabs)/history.tsx` - History screen requiring component migrations
- `app/(tabs)/settings.tsx` - Settings screen requiring component migrations
- `app/tdee-input.tsx` - TDEE input screen requiring form component migrations
- `app/tdee-results.tsx` - TDEE results screen requiring component migrations
- `app/results.tsx` - Results screen requiring component migrations
- `app/modal.tsx` - Modal screen requiring complete modal component migration
- `app/components/TDEEActionModal.tsx` - Action modal requiring migration to Gluestack Modal
- `app/components/FoodLogPopover.tsx` - Popover requiring migration to Gluestack components
- `app/components/ConfirmationDialog.tsx` - Dialog requiring migration to AlertDialog
- `app/components/CustomDatePicker.tsx` - Date picker requiring input component migration
- `app/components/ImageExportButton.tsx` - Export button requiring Button migration
- `e2e/smoke.spec.ts` - E2E tests requiring selector updates for new components
- `app/__tests__/tdee-results.test.tsx` - Unit tests requiring component selector updates

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Create Custom Gluestack Theme Configuration
  - [x] 1.1 Create `lib/theme/` directory structure
  - [x] 1.2 Create `lib/theme/gluestack-theme.ts` with custom theme extending @gluestack-ui/config
  - [x] 1.3 Map `Colors.light` and `Colors.dark` from constants/colors.ts to Gluestack color tokens
  - [x] 1.4 Configure theme switching support for `useUser().colorScheme` hook
  - [x] 1.5 Add gold tint colors (#b8a369, #d0c7a9) as primary accent tokens
  - [x] 1.6 Create unit tests for theme configuration in `lib/theme/gluestack-theme.test.ts`
  - [x] 1.7 Test theme switching between light and dark modes

- [x] 2.0 Migrate Core UI Components to Gluestack
  - [x] 2.1 Replace Button components with Gluestack Button in `app/components/ImageExportButton.tsx`
  - [x] 2.2 Replace Text components with Gluestack Text/Heading in all screen files
  - [x] 2.3 Replace TextInput components with Gluestack Input in `app/modal.tsx` and `app/tdee-input.tsx`
  - [x] 2.4 Replace View containers with Gluestack Box/VStack/HStack in main screens
  - [x] 2.5 Replace Pressable components with Gluestack Pressable in interactive elements
  - [x] 2.6 Update custom card components to use Gluestack Card in results screens
  - [x] 2.7 Preserve Lucide React Native icons within new Gluestack components
  - [x] 2.8 Test component functionality and visual consistency after migrations

- [x] 3.0 Implement Floating Action Button (FAB)
  - [x] 3.1 Create `app/components/FloatingActionButton.tsx` with Gluestack FAB component
  - [x] 3.2 Position FAB 24px from bottom-right screen edge using absolute positioning
  - [x] 3.3 Implement 56x56px size with Plus icon from Lucide React Native
  - [x] 3.4 Add spring-in animation using react-native-reanimated
  - [x] 3.5 Configure FAB to trigger existing `TDEEActionModal` functionality
  - [x] 3.6 Add accessibility labels ("Add", "Open actions menu") and proper hit area
  - [x] 3.7 Apply theme tint color with white icon and Gluestack shadow elevation
  - [ ] 3.8 Create unit tests for FAB component in `app/components/FloatingActionButton.test.tsx`
  - [x] 3.9 Test FAB visibility and functionality across all tab screens

- [x] 4.0 Migrate Modal and Overlay Components
  - [x] 4.1 Replace Modal in `app/modal.tsx` with Gluestack Modal component
  - [x] 4.2 Migrate `app/components/TDEEActionModal.tsx` to Gluestack Modal/ActionSheet
  - [x] 4.3 Migrate `app/components/FoodLogPopover.tsx` to Gluestack Popover/Modal
  - [x] 4.4 Replace `app/components/ConfirmationDialog.tsx` with Gluestack AlertDialog
  - [ ] 4.5 Update `app/components/CustomDatePicker.tsx` to use Gluestack Input components
  - [x] 4.6 Ensure proper modal backdrop, animations, and dismissal behavior
  - [x] 4.7 Test modal accessibility and keyboard navigation
  - [x] 4.8 Verify modal theming matches existing design

- [x] 5.0 Update Tab Layout and Remove Center Tab
  - [x] 5.1 Remove center `Tabs.Screen name="log-food"` tab from `app/(tabs)/_layout.tsx`
  - [x] 5.2 Update tab bar styling to remove center button accommodation
  - [x] 5.3 Add FAB component to tab layout with proper z-index positioning
  - [x] 5.4 Ensure FAB appears on all tab screens (Dashboard, History, Profile, Settings)
  - [x] 5.5 Maintain existing tab bar styling and theme colors
  - [x] 5.6 Test tab navigation and FAB interaction across all screens
  - [x] 5.7 Verify FAB doesn't interfere with tab bar touch targets

- [x] 6.0 Update Tests and Selectors for New Components
  - [x] 6.1 Update `e2e/smoke.spec.ts` selectors to target new Gluestack components
  - [x] 6.2 Add testID props to FAB and key interactive Gluestack elements
  - [ ] 6.3 Update `app/__tests__/tdee-results.test.tsx` component selectors
  - [ ] 6.4 Update component tests in `app/components/__tests__/` directory
  - [x] 6.5 Ensure all existing Playwright e2e tests continue to pass
  - [x] 6.6 Run full test suite and fix any breaking selector changes
  - [x] 6.7 Add accessibility testing for new Gluestack components
  - [x] 6.8 Performance test to ensure no regression in app startup or interaction times
