# Product Requirements Document: TDEE Results Image Export

## Introduction/Overview

The TDEE Results screen currently has a broken export feature that fails to capture the full scrollable content and provide a reliable image export experience. This feature will redesign the export functionality from scratch to generate a high-quality image of the entire TDEE report that users can save to their phone's camera roll for future reference or sharing with healthcare providers, trainers, or for personal record-keeping.

**Problem Statement:** Users cannot reliably export their TDEE calculation results as a visual report, limiting their ability to save, reference, or share their personalized fitness recommendations.

**Goal:** Provide a robust, user-friendly image export feature that captures the complete TDEE results in a single, high-quality image that maintains visual fidelity and can be saved to the device's camera roll.

## Goals

1. **Reliability:** Create a stable export system that consistently generates complete TDEE result images without failures
2. **Completeness:** Capture the entire scrollable TDEE results content in a single comprehensive image
3. **Quality:** Maintain visual fidelity with current app styling and ensure readability in the exported image
4. **User Experience:** Provide clear feedback during export process with intuitive save confirmation
5. **Performance:** Generate exports efficiently without blocking the UI or causing app performance issues

## User Stories

1. **As a fitness enthusiast**, I want to save my TDEE results as an image so that I can reference my macro targets when meal planning offline.

2. **As someone working with a nutritionist**, I want to export my TDEE calculations as an image so that I can easily share my personalized recommendations during consultations.

3. **As a user tracking my fitness journey**, I want to save TDEE result images over time so that I can compare how my targets change as my goals evolve.

4. **As a mobile user**, I want the export process to be fast and provide clear feedback so that I know when my image has been successfully saved.

5. **As someone who values data privacy**, I want my TDEE results saved locally to my camera roll so that I maintain control over my personal fitness data.

## Functional Requirements

1. **Image Generation**
   - The system must capture the entire scrollable TDEE results content as a single vertical image
   - The system must include all sections: welcome message, metrics cards, user information table, fitness goals, calorie comparison chart, macro distribution chart, macro breakdown table, and personalized recommendations
   - The system must maintain the current app styling, colors, fonts, and layout in the exported image
   - The system must generate images in JPEG format with good compression for reasonable file sizes

2. **Export Button**
   - The system must add a new "Save Image" button alongside the existing export button in the header actions
   - The button must display a download icon and "Save Image" text
   - The button must be disabled during export process and show loading state

3. **Export Process**
   - The system must show a loading spinner on the button during image generation
   - The system must display a toast notification confirming successful save to camera roll
   - The system must handle the export process without blocking the main UI thread
   - The system must provide appropriate error handling if export fails

4. **Save Functionality**
   - The system must save the generated image directly to the device's camera roll/photo library
   - The system must show a confirmation dialog asking "Save TDEE results to camera roll?" before proceeding
   - The system must request appropriate camera roll permissions if not already granted
   - The system must generate unique filenames using timestamp (e.g., "tdee-results-2024-08-30-143022.jpg")

5. **Cross-Platform Support**
   - The system must work consistently on both iOS and Android devices
   - The system must handle platform-specific camera roll access patterns
   - The system must gracefully handle permission denials with appropriate user messaging

## Non-Goals (Out of Scope)

1. **Social Media Integration** - No direct sharing to social platforms or social media optimization
2. **Cloud Storage** - No automatic backup to cloud services
3. **Multiple Export Formats** - Only JPEG format, no PNG, PDF, or other formats
4. **Watermarking** - No branding or timestamp watermarks on the exported image
5. **Batch Export** - No ability to export multiple TDEE calculations at once
6. **Print Functionality** - No direct printing capabilities
7. **Email Integration** - No direct email sharing from the export feature

## Design Considerations

- **Visual Consistency:** The exported image must maintain exact visual parity with the current app design system
- **Readability:** Text and charts must remain clearly readable in the compressed JPEG format
- **Layout Optimization:** The vertical layout should flow naturally as a single continuous image
- **Loading States:** Clear visual feedback during the export process using existing app loading patterns
- **Error States:** Consistent error messaging following app's current error handling patterns

## Technical Considerations

- **React Native ViewShot:** Utilize react-native-view-shot library for reliable image capture
- **Memory Management:** Implement proper cleanup of generated image files and memory usage
- **Permission Handling:** Integrate with expo-media-library for camera roll access
- **Performance:** Use background processing to avoid UI blocking during image generation
- **Fallback Strategy:** Implement graceful degradation if primary capture method fails
- **File Management:** Handle temporary file creation and cleanup appropriately

## Success Metrics

1. **Reliability:** 95%+ success rate for image export attempts
2. **User Adoption:** 30%+ of TDEE result viewers use the image export feature within first month
3. **Performance:** Image generation completes within 5 seconds for typical TDEE results
4. **User Satisfaction:** Zero critical bugs reported related to export functionality
5. **Support Reduction:** Decrease in support tickets related to "can't save results" by 80%

## Open Questions

1. Should there be a maximum image height limit to prevent extremely large files for users with many goals/recommendations?
2. How should the system handle users who deny camera roll permissions - show alternative options or just error messaging?
3. Should the feature include analytics tracking to measure usage and identify potential improvements?
4. What specific error messages should be shown for different failure scenarios (permissions, storage full, etc.)?
5. Should there be any image quality settings or should it be fixed at the optimal balance of quality/file size?
