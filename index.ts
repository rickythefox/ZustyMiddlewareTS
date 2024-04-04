import { State, StateCreator, StoreMutatorIdentifier } from 'zustand'

export default function zustyMiddleware<
  T extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  createFunction: StateCreator<T, Mps, Mcs>
): StateCreator<T, Mps, Mcs> {
  return (set, get, api) => {
    const store = createFunction(set, get, api);

    const applicationStore: { [key: string]: string } = {};
    for (const key in store) {
      applicationStore[key] = '' + store[key] + '';
    }

    for (let key in store) {
      if (typeof store[key] === 'function') {
        let originalFunction = store[key] as Function;
        // @ts-ignore
        store[key] = (...args: any[]) => {
          const prevState = get();
          const startTime = performance.now();
          originalFunction(...args);
          const endTime = performance.now();
          const nextState = get();

          const actionCompleteTime = endTime - startTime;

          window.postMessage({
            body: 'actionAndStateSnapshot',
            action: key,
            actionCompleteTime,
            prevState: JSON.stringify(prevState),
            nextState: JSON.stringify(nextState),
            store: JSON.stringify(applicationStore),
          });
        };
      }
    }
    return store;
  };
}
