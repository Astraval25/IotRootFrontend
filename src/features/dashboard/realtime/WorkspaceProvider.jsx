import { useEffect, useState } from 'react'
import * as api from '../api/deviceApi'
import { getAccessToken } from '../../auth/session/authSession'
import { API_BASE_URL } from '../../../shared/config/env'
import { openDashboardSocket } from './dashboardSocket'
import { createWorkspaceStore } from './workspaceStore'
import { WorkspaceContext } from './useWorkspace'

export function WorkspaceProvider({ children }) {
  const [store] = useState(() => createWorkspaceStore(api, callbacks => openDashboardSocket({
    ...callbacks, getToken: getAccessToken, apiBaseUrl: API_BASE_URL,
  })))
  useEffect(() => {
    store.start()
    return () => store.stop()
  }, [store])
  return <WorkspaceContext.Provider value={store}>{children}</WorkspaceContext.Provider>
}
