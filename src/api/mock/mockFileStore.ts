import { File, Paths } from 'expo-file-system';
import type { MockState } from './mockState';
import type { MockStore } from './mockTransport';

/** The dummy server's data in one JSON file in the app's documents, so a session survives a restart. */
const MOCK_FILE_NAME = 'mock-api.json';

export const mockFileStore: MockStore = {
  load() {
    try {
      const file = new File(Paths.document, MOCK_FILE_NAME);
      return file.exists ? (JSON.parse(file.textSync()) as MockState) : null;
    } catch (error) {
      console.warn('[reviewer] mock API data unreadable; starting from the seed', error);
      return null;
    }
  },
  save(state) {
    try {
      new File(Paths.document, MOCK_FILE_NAME).write(JSON.stringify(state));
    } catch (error) {
      console.warn('[reviewer] mock API data not saved', error);
    }
  },
};
