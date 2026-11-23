import { createId } from '@/lib/ids';
import { isApiMocked } from '../config';
import { mockFileStore } from './mockFileStore';
import { configureMockServer } from './mockTransport';

/** Imported once at launch (app/_layout.tsx). Does nothing unless EXPO_PUBLIC_API_MOCK is on. */
if (isApiMocked) configureMockServer({ store: mockFileStore, createId });
