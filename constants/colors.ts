const tintColorLight = "#b8a369"; // Gold color from the design
const tintColorDark = "#d0c7a9"; // Lighter gold for dark mode
const overlayLight = 'rgba(0, 0, 0, 0.5)';
const overlayDark = 'rgba(0, 0, 0, 0.7)';

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
    gold: "#b8a369",
    lightGold: "#d0c7a9",
    darkText: "#333",
    lightText: "#666",
    border: "#ddd",
    cardBackground: "#fff",
    overlay: overlayLight,
    placeholder: "#888",
    disabled: "#cccccc"
  },
  dark: {
    text: "#fff",
    background: "#121212",
    tint: tintColorDark,
    tabIconDefault: "#666",
    tabIconSelected: tintColorDark,
    gold: "#d0c7a9",
    lightGold: "#b8a369",
    darkText: "#f0f0f0",
    lightText: "#aaa",
    border: "#333",
    cardBackground: "#1e1e1e",
    overlay: overlayDark,
    placeholder: "#666",
    disabled: "#444444"
  },
};