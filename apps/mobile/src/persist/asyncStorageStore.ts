import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyState, ensureState, type AppState } from "../logic";

const KEY = "decisive.state.v1";

export type StateStore = {
  load: () => Promise<unknown>;
  save: (state: AppState) => Promise<void>;
};

export function createAsyncStorageStateStore(): StateStore {
  return {
    async load() {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return emptyState();
      return JSON.parse(raw) as unknown;
    },
    async save(state) {
      await AsyncStorage.setItem(KEY, JSON.stringify(ensureState(state)));
    },
  };
}
