import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { VerifyOtpPage } from '../features/auth/pages/VerifyOtpPage'
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout'
import { DashboardDevicesPage } from '../features/dashboard/pages/DashboardDevicesPage'
import { DashboardOverviewPage } from '../features/dashboard/pages/DashboardOverviewPage'
import { DashboardTopicsPage } from '../features/dashboard/pages/DashboardTopicsPage'
import { WaitlistPage } from '../features/waitlist/pages/WaitlistPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WaitlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/iotroot/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverviewPage />} />
          <Route path="devices" element={<DashboardDevicesPage />} />
          <Route path="topics" element={<DashboardTopicsPage />} />
          <Route path="*" element={<Navigate to="/iotroot/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
