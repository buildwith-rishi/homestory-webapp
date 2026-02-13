import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DesignSystemPage from "./pages/DesignSystemPage";
import { SmoothScroll } from "./components/shared";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import {
  DashboardLayout,
  DashboardOverview,
  MeetingsPage,
  MeetingDetailsPage,
  ProjectsPage,
  ProjectDetails,
  LeadsPage,
  UpdatesPage,
  VoiceAgentPage,
  EngineersPage,
  SettingsPage,
  Customers,
  CustomerDetails,
  Marketing,
  Analytics,
  UserManagement,
  KanbanView,
  EmailEditor,
} from "./pages/dashboard";
import LeadDetails from "./pages/dashboard/LeadDetails";
import { MeetingRoom } from "./pages/dashboard/MeetingRoom";
import { MeetingsCalendarPage } from "./pages/dashboard/MeetingsCalendar";
import { InstagramPage } from "./pages/instagram";
import { MobileAppShell } from "./components/mobile/MobileAppShell";
import {
  EngineerHome,
  EngineerTasks,
  PhotoUpload,
  ReportIssue,
  EngineerProfile,
  EngineerIssues,
} from "./pages/mobile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <SmoothScroll>
                <LandingPage />
              </SmoothScroll>
            }
          />
          <Route
            path="/design-system"
            element={
              <SmoothScroll>
                <DesignSystemPage />
              </SmoothScroll>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/Admin" element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard – accessible to ALL authenticated roles.
              Individual pages are permission-gated below. */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard overview – visible to any role with dashboard.view or dashboard.* */}
            <Route index element={<DashboardOverview />} />

            {/* CRM: Leads */}
            <Route
              path="leads"
              element={
                <ProtectedRoute requiredPermission="leads.read">
                  <LeadsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leads/:id"
              element={
                <ProtectedRoute requiredPermission="leads.read">
                  <LeadDetails />
                </ProtectedRoute>
              }
            />

            {/* Follow-Ups */}
            <Route
              path="updates"
              element={
                <ProtectedRoute requiredPermission="activity.read">
                  <UpdatesPage />
                </ProtectedRoute>
              }
            />

            {/* Meetings */}
            <Route
              path="meetings"
              element={
                <ProtectedRoute requiredPermission="meetings.read">
                  <MeetingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="meetings/:meetingId"
              element={
                <ProtectedRoute requiredPermission="meetings.read">
                  <MeetingDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="meetings/calendar"
              element={
                <ProtectedRoute requiredPermission="meetings.read">
                  <MeetingsCalendarPage />
                </ProtectedRoute>
              }
            />

            {/* Customers / Contacts */}
            <Route
              path="customers"
              element={
                <ProtectedRoute requiredPermission="contacts.read">
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:customerId"
              element={
                <ProtectedRoute requiredPermission="contacts.read">
                  <CustomerDetails />
                </ProtectedRoute>
              }
            />

            {/* Projects */}
            <Route
              path="projects"
              element={
                <ProtectedRoute requiredPermission="projects.read">
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="projects/:projectId"
              element={
                <ProtectedRoute requiredPermission="projects.read">
                  <ProjectDetails />
                </ProtectedRoute>
              }
            />

            {/* Kanban */}
            <Route
              path="kanban"
              element={
                <ProtectedRoute requiredPermission="projects.read">
                  <KanbanView />
                </ProtectedRoute>
              }
            />

            {/* Team/Engineers */}
            <Route
              path="engineers"
              element={
                <ProtectedRoute requiredPermission="users.read">
                  <EngineersPage />
                </ProtectedRoute>
              }
            />

            {/* Marketing – restricted to SUPER_ADMIN, ADMIN, BDR */}
            <Route
              path="marketing"
              element={
                <ProtectedRoute
                  allowedRoleIds={["SUPER_ADMIN", "ADMIN", "BDR"]}
                >
                  <Marketing />
                </ProtectedRoute>
              }
            />

            {/* Analytics / Reports */}
            <Route
              path="analytics"
              element={
                <ProtectedRoute requiredPermission="reports.view">
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Email Editor */}
            <Route
              path="email-editor"
              element={
                <ProtectedRoute
                  allowedRoleIds={["SUPER_ADMIN", "ADMIN", "BDR"]}
                >
                  <EmailEditor />
                </ProtectedRoute>
              }
            />

            {/* Voice Agent – admin only */}
            <Route
              path="voice-agent"
              element={
                <ProtectedRoute allowedRoleIds={["SUPER_ADMIN", "ADMIN"]}>
                  <VoiceAgentPage />
                </ProtectedRoute>
              }
            />

            {/* Settings – everyone can access their own settings */}
            <Route path="settings" element={<SettingsPage />} />

            {/* User Management – admin only */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoleIds={["SUPER_ADMIN", "ADMIN"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/instagram"
            element={
              <ProtectedRoute allowedRoleIds={["SUPER_ADMIN", "ADMIN", "BDR"]}>
                <InstagramPage />
              </ProtectedRoute>
            }
          />

          {/* Meeting Room - Full screen experience */}
          <Route
            path="/dashboard/meeting-room"
            element={
              <ProtectedRoute requiredPermission="meetings.read">
                <MeetingRoom />
              </ProtectedRoute>
            }
          />

          {/* Mobile App – Site Engineer primary, also admin */}
          <Route
            path="/app"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <EngineerHome />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/tasks"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <EngineerTasks />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/upload"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <PhotoUpload />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/issues"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <EngineerIssues />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/issues/report"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <ReportIssue />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <EngineerProfile />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
