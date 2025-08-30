module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  moduleNameMapper: {
    // Path alias '@/...' -> project root
    '^@/(.*)$': '<rootDir>/$1',
    // Stub expo-router to our local test mock
    '^expo-router$': '<rootDir>/test-mocks/expo-router.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-.*|@react-native|@react-native/.*|expo|expo-.*|@expo|@expo/.*|react-native-css-interop)/)'
  ],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
