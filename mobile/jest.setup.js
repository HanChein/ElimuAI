import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-constants', () => ({
  Constants: {
    manifest: {
      version: '1.0.0',
    },
  },
}));

jest.mock('expo-device', () => ({
  Device: {
    osName: 'iOS',
    osVersion: '15.0',
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(() => Promise.resolve()),
      startAsync: jest.fn(() => Promise.resolve()),
      stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
      getURI: jest.fn(() => 'file:///test/recording.m4a'),
    })),
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(() => Promise.resolve()),
          pauseAsync: jest.fn(() => Promise.resolve()),
          unloadAsync: jest.fn(() => Promise.resolve()),
          setOnPlaybackStatusUpdate: jest.fn(),
        }
      }))
    }
  }
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: {
      Type: {
        back: 'back',
        front: 'front'
      },
      FlashMode: {
        off: 'off',
        on: 'on'
      }
    }
  }
}));

// Global test setup
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
    ok: true,
  })
);
