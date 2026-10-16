import { useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { VerifyOtpPage } from '../features/auth/pages/VerifyOtpPage'
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout'
import { DashboardDevicesPage } from '../features/dashboard/pages/DashboardDevicesPage'
import { DashboardDevicePage } from '../features/dashboard/pages/DashboardDevicePage'
import { DashboardGettingStartedPage } from '../features/dashboard/pages/DashboardGettingStartedPage'
import { DashboardOverviewPage } from '../features/dashboard/pages/DashboardOverviewPage'
import { DashboardSettingsPage } from '../features/dashboard/pages/DashboardSettingsPage'
import { DashboardStoredDataPage } from '../features/dashboard/pages/DashboardStoredDataPage'
import { DashboardTopicDataPage } from '../features/dashboard/pages/DashboardTopicDataPage'
import { DashboardUsagePage } from '../features/dashboard/pages/DashboardUsagePage'
import { WorkspaceProvider } from '../features/dashboard/realtime/WorkspaceProvider'
import { WaitlistPage } from '../features/waitlist/pages/WaitlistPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<WaitlistPage />} />
        <Route path="/iotroot/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/iotroot/dashboard"
          element={
            <ProtectedRoute>
              <WorkspaceProvider><DashboardLayout /></WorkspaceProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverviewPage />} />
          <Route path="getting-started" element={<DashboardGettingStartedPage />} />
          <Route path="devices" element={<DashboardDevicesPage />} />
          <Route path="devices/:deviceId" element={<DashboardDevicePage />} />
          <Route path="devices/:deviceId/topics" element={<DashboardDevicePage />} />
          <Route path="devices/:deviceId/topics/:topicId/data" element={<DashboardTopicDataPage />} />
          <Route path="data" element={<DashboardStoredDataPage />} />
          <Route path="usage" element={<DashboardUsagePage />} />
          <Route path="settings" element={<DashboardSettingsPage />} />
          <Route path="topics" element={<Navigate to="/iotroot/dashboard/devices" replace />} />
          <Route path="*" element={<Navigate to="/iotroot/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
