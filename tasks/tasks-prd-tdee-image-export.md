# Task List: TDEE Results Image Export

## Relevant Files

- `app/tdee-results.tsx` - Main TDEE results screen component that needs the new Save Image button and functionality
- `app/tdee-results.test.tsx` - Unit tests for the TDEE results screen component
- `utils/tdee-image-export.ts` - New utility module for image generation and camera roll operations
- `utils/tdee-image-export.test.ts` - Unit tests for image export utility functions
- `app/components/ImageExportButton.tsx` - New reusable image export button component
- `app/components/ImageExportButton.test.tsx` - Unit tests for the image export button component
- `app/components/ConfirmationDialog.tsx` - New confirmation dialog component for save confirmation
- `app/components/ConfirmationDialog.test.tsx` - Unit tests for the confirmation dialog component
- `package.json` - Update dependencies to include expo-media-library if not already present
- `types/image-export.ts` - TypeScript type definitions for image export functionality

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Set up dependencies and permissions for image export functionality
  - [ ] 1.1 Add expo-media-library dependency to package.json if not present
  - [ ] 1.2 Configure app permissions for camera roll access in app.json/expo config
  - [ ] 1.3 Create TypeScript type definitions for image export functionality
  - [ ] 1.4 Set up permission request utilities for cross-platform camera roll access
- [ ] 2.0 Create image capture and export utility functions
  - [ ] 2.1 Create full-content capture function using react-native-view-shot
  - [ ] 2.2 Implement JPEG compression and optimization for reasonable file sizes
  - [ ] 2.3 Build camera roll save functionality with unique timestamp filenames
  - [ ] 2.4 Add memory management and temporary file cleanup utilities
  - [ ] 2.5 Implement fallback strategies for failed image capture attempts
- [ ] 3.0 Build reusable UI components for image export
  - [ ] 3.1 Create ImageExportButton component with loading states and icons
  - [ ] 3.2 Build ConfirmationDialog component for save confirmation
  - [ ] 3.3 Implement toast notification system for success/error feedback
  - [ ] 3.4 Add proper accessibility support for all new UI components
- [ ] 4.0 Integrate image export functionality into TDEE Results screen
  - [ ] 4.1 Add Save Image button to header actions alongside existing export button
  - [ ] 4.2 Create hidden flattened view for full content capture
  - [ ] 4.3 Wire up button to trigger confirmation dialog and image generation
  - [ ] 4.4 Integrate toast notifications for user feedback
  - [ ] 4.5 Handle button loading states during export process
- [ ] 5.0 Implement comprehensive error handling and user feedback
  - [ ] 5.1 Add permission denial handling with appropriate user messaging
  - [ ] 5.2 Implement error recovery for failed image generation attempts
  - [ ] 5.3 Add storage full and other device-specific error handling
  - [ ] 5.4 Create user-friendly error messages for different failure scenarios
  - [ ] 5.5 Add graceful degradation when image export is unavailable
- [ ] 6.0 Add comprehensive testing coverage
  - [ ] 6.1 Write unit tests for image export utility functions
  - [ ] 6.2 Create tests for ImageExportButton component behavior
  - [ ] 6.3 Add tests for ConfirmationDialog component interactions
  - [ ] 6.4 Test TDEE Results screen integration with mocked image export
  - [ ] 6.5 Add integration tests for permission handling scenarios
- [ ] 7.0 Performance optimization and cleanup
  - [ ] 7.1 Optimize image generation performance to meet <5 second target
  - [ ] 7.2 Implement proper memory cleanup for large image captures
  - [ ] 7.3 Add background processing to prevent UI blocking
  - [ ] 7.4 Profile and optimize for different device capabilities
  - [ ] 7.5 Add monitoring for export success rates and performance metrics
