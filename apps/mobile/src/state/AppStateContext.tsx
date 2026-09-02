import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { emptyState, ensureState, type AppState } from "../logic";
import type { StateStore } from "../persist/asyncStorageStore";

type Updater = (state: AppState) => void;

interface Value {
  state: AppState;
  ready: boolean;
  update: (fn: Updater) => Promise<void>;
}

const Ctx = createContext<Value | null>(null);

export function AppStateProvider({
  store,
  children,
}: {
  store: StateStore;
  children: ReactNode;
}) {
  const [state, setState] = useState<AppState>(emptyState());
  const [ready, setReady] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    void (async () => {
      try {
        const next = ensureState(await store.load());
        setState(next);
        await store.save(next);
      } finally {
        setReady(true);
      }
    })();
  }, [store]);

  const update = useCallback(
    async (fn: Updater) => {
      const draft = structuredClone(ref.current);
      fn(draft);
      const next = ensureState(draft);
      ref.current = next;
      setState(next);
      await store.save(next);
    },
    [store],
  );

  const value = useMemo(() => ({ state, ready, update }), [state, ready, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState");
  return v;
}
