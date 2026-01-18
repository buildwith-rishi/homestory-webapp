import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SmoothScroll } from './components/shared';
import LandingPage from './pages/LandingPage';
import DesignSystemPage from './pages/DesignSystemPage';
import { LoginPage } from './pages/auth/LoginPage';
import {
  DashboardLayout,
  DashboardOverview,
  MeetingsPage,
  ProjectsPage,
  LeadsPage,
  UpdatesPage,
  VoiceAgentPage,
  EngineersPage,
  SettingsPage,
} from './pages/dashboard';
import { InstagramPage } from './pages/instagram';
import { MobileAppShell } from './components/mobile/MobileAppShell';
import { EngineerHome, EngineerTasks, PhotoUpload, ReportIssue } from './pages/mobile';
import { UserRole } from './types';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SmoothScroll>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/Admin" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="engineers" element={<EngineersPage />} />
            <Route path="updates" element={<UpdatesPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="voice-agent" element={<VoiceAgentPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/instagram"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                <InstagramPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ENGINEER, UserRole.ADMIN]}>
                <MobileAppShell>
                  <EngineerHome />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/tasks"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ENGINEER, UserRole.ADMIN]}>
                <MobileAppShell>
                  <EngineerTasks />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/upload"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ENGINEER, UserRole.ADMIN]}>
                <MobileAppShell>
                  <PhotoUpload />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/issues"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ENGINEER, UserRole.ADMIN]}>
                <MobileAppShell>
                  <ReportIssue />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SmoothScroll>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
