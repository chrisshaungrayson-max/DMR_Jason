# Product Requirements Document: TDEE Calculator Feature

## Introduction/Overview

The TDEE (Total Daily Energy Expenditure) Calculator feature will allow users to calculate their daily caloric needs and receive personalized macro recommendations based on their fitness goals. This feature will be integrated into the existing fitness app as a dedicated option accessible through the main add button, providing users with science-based calorie and macro targets to complement their food tracking capabilities.

## Goals

1. **Primary Goal**: Provide users with accurate TDEE calculations using the Harris-Benedict equation
2. **Secondary Goal**: Deliver personalized calorie and macro recommendations based on user-selected fitness goals
3. **Tertiary Goal**: Create an intuitive, single-screen input experience that leverages existing user profile data
4. **Integration Goal**: Seamlessly integrate with existing app design language and export/share functionality

## User Stories

1. **As a fitness enthusiast**, I want to calculate my TDEE so that I can understand my daily caloric needs for my current activity level.

2. **As someone with weight loss goals**, I want to receive specific calorie targets below my TDEE so that I can create an appropriate caloric deficit.

3. **As someone building muscle**, I want to get calorie and macro recommendations that support lean muscle gain so that I can optimize my nutrition strategy.

4. **As a user tracking multiple goals**, I want to select multiple fitness objectives (e.g., lose fat AND gain muscle) so that I can get balanced recommendations.

5. **As an existing app user**, I want my profile information pre-populated in the calculator so that I don't have to re-enter basic details.

6. **As someone who wants to share results**, I want to export or share my TDEE calculation and recommendations so that I can discuss them with trainers or friends.

## Functional Requirements

1. **Navigation Integration**
   - The main "+" button must present two options: "Add Food Entry" and "Calculate TDEE"
   - TDEE option navigates to a dedicated calculator screen

2. **Input Form Requirements**
   - Single-screen form with all inputs visible
   - Pre-populate name, age, height, weight, and activity level from existing user profile
   - Allow users to modify pre-populated values within the calculator
   - Include body fat percentage as optional input with slider control (5-30% range)
   - Provide multi-select fitness goals with options:
     - Lose weight
     - Lose body fat
     - Gain lean muscle
     - Maintain weight
     - Improve athletic performance
     - General health

3. **TDEE Calculation Engine**
   - Use Harris-Benedict equation for BMR calculation
   - Apply activity level multipliers to calculate TDEE
   - Support both metric and imperial units based on user preference

4. **Goal-Based Recommendations**
   - **Weight Loss**: TDEE - 500 calories (1 lb/week loss)
   - **Fat Loss**: TDEE - 300-500 calories with higher protein ratio
   - **Muscle Gain**: TDEE + 300-500 calories with balanced macros
   - **Maintenance**: TDEE calories
   - **Athletic Performance**: TDEE + 200-300 calories with carb emphasis
   - **General Health**: TDEE calories with balanced macros

5. **Macro Distribution Presets**
   - **Weight/Fat Loss**: 40% protein, 30% carbs, 30% fat
   - **Muscle Gain**: 30% protein, 40% carbs, 30% fat
   - **Maintenance**: 25% protein, 45% carbs, 30% fat
   - **Athletic Performance**: 20% protein, 50% carbs, 30% fat
   - **Multiple Goals**: Weighted average based on selections

6. **Results Display**
   - Prominent TDEE value display
   - Clear calorie target recommendations
   - Detailed macro breakdown (grams and percentages)
   - Goal-specific explanatory text
   - Visual charts similar to nutrition results screen

7. **Export and Sharing**
   - PDF export functionality matching existing report format
   - Social sharing capability with formatted text summary
   - Include user info, TDEE, goals, and recommendations in exports

8. **Data Storage**
   - Store calculation in user profile for reference
   - Save as separate TDEE entry for potential future tracking
   - No historical tracking implementation required initially

## Non-Goals (Out of Scope)

1. **Advanced body composition analysis** - No DEXA scan integration or advanced body fat calculation methods
2. **Historical TDEE tracking** - No trend analysis or change tracking over time
3. **Custom macro ratio creation** - Users cannot create their own macro distributions
4. **Integration with wearable devices** - No automatic activity level detection
5. **Meal planning suggestions** - No specific food recommendations based on TDEE
6. **Input validation and error handling** - No complex validation rules for unrealistic inputs
7. **Multiple calculation methods** - Only Harris-Benedict equation, no Mifflin-St Jeor or other alternatives

## Design Considerations

1. **Visual Hierarchy**
   - TDEE value should be the most prominent element on results screen
   - Calorie targets should be secondary focal point
   - Macro breakdown should follow existing nutrition results design patterns

2. **UI Components**
   - Reuse existing form components from profile editing
   - Implement slider component for body fat percentage
   - Use multi-select component similar to existing goal selection patterns
   - Match existing color scheme (#BBA46E primary, existing card backgrounds)

3. **Results Screen Layout**
   - Header with branding consistent with nutrition results
   - Prominent TDEE display with status indicator
   - Goal-based calorie recommendations in card format
   - Macro breakdown with visual charts (pie chart, bar chart)
   - Export/share buttons matching existing functionality

## Technical Considerations

1. **Integration Points**
   - Leverage existing user store for profile data
   - Reuse PDF generation utilities from nutrition reports
   - Integrate with existing sharing mechanisms
   - Follow established navigation patterns

2. **Calculation Dependencies**
   - Implement Harris-Benedict BMR formulas for male/female
   - Create activity level multiplier constants
   - Build goal-based calorie adjustment logic
   - Develop macro distribution calculation engine

3. **State Management**
   - Create TDEE-specific store or extend existing user store
   - Handle form state and validation
   - Manage calculation results and export data

## Success Metrics

1. **User Engagement**: 70% of users who access TDEE calculator complete the full calculation
2. **Feature Adoption**: 40% of active users try the TDEE calculator within first month of release
3. **Export Usage**: 25% of TDEE calculations result in export or share action
4. **User Satisfaction**: Positive feedback on accuracy and usefulness of recommendations
5. **Integration Success**: Seamless user flow with no navigation confusion or technical issues

## Open Questions

1. Should we add a "Save to Profile" option to update user's permanent profile data with TDEE calculation inputs?
2. Do we want to include any educational content about TDEE or macro ratios within the feature?
3. Should there be any integration with the existing goals tracking system in the app?
4. Would users benefit from a "Quick Recalculate" option that only asks for changed parameters?
5. Should we consider adding body fat percentage estimation tools for users who don't know their body fat percentage?
