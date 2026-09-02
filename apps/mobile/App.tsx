import { StatusBar } from "expo-status-bar";
import { AppStateProvider } from "./src/state/AppStateContext";
import { createAsyncStorageStateStore } from "./src/persist/asyncStorageStore";
import { HomeScreen } from "./src/screens/HomeScreen";

const store = createAsyncStorageStateStore();

export default function App() {
  return (
    <AppStateProvider store={store}>
      <StatusBar style="light" />
      <HomeScreen />
    </AppStateProvider>
  );
}
