import { createContext, useContext, useSyncExternalStore } from 'react'

export const WorkspaceContext = createContext(null)

export function useWorkspace() {
  const store = useContext(WorkspaceContext)
  if (!store) throw new Error('Workspace provider is required.')
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return { ...state, store }
}
