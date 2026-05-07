import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SessionExpiredModal } from "./components/auth/SessionExpiredModal";
import { SessionPingOnNavigate } from "./components/auth/SessionPingOnNavigate";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AccessDeniedPage } from "./pages/auth/AccessDeniedPage";
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
  EngineersPage,
  Customers,
  CustomerDetails,
  Marketing,
  Analytics,
  ReportsPage,
  UserManagement,
  ViewTasksPage,
  KanbanView,
  EmailEditor,
} from "./pages/dashboard";
import { EngineerDetails } from "./pages/dashboard/EngineerDetails";
import LeadDetails from "./pages/dashboard/LeadDetails";
import { MeetingRoom } from "./pages/dashboard/MeetingRoom";
import { InstagramPage } from "./pages/instagram";

import { MobileAppShell } from "./components/mobile/MobileAppShell";
import {
  EngineerHome,
  EngineerProjects,
  EngineerTasks,
  PhotoUpload,
  ReportIssue,
  DailySiteReport,
  EngineerProfile,
  EngineerIssues,
} from "./pages/mobile";
import { BDRAppShell } from "./components/bdr/BDRAppShell";
import {
  BDRHome,
  BDRTasks,
  BDRProfile,
  BDRLeads,
  BDRMeetings,
  BDRLoginPage,
} from "./pages/bdr";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 100002 }}
        toastOptions={{
          duration: 4000,
          style: { zIndex: 100002 },
        }}
      />
      <SessionExpiredModal />
      <SessionPingOnNavigate />
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
          <Route
            path="/access-denied"
            element={
              <ProtectedRoute loginRedirect="/login">
                <AccessDeniedPage />
              </ProtectedRoute>
            }
          />

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
            <Route
              index
              element={
                <ProtectedRoute requiredPermission="dashboard.view">
                  <DashboardOverview />
                </ProtectedRoute>
              }
            />

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
            <Route
              path="engineers/:id"
              element={
                <ProtectedRoute requiredPermission="users.read">
                  <EngineerDetails />
                </ProtectedRoute>
              }
            />

            {/* Marketing – BDR, SALES, HR, LEAD_PROJECT_MANAGER, DESIGN_HEAD, ADMIN, SUPER_ADMIN */}
            <Route
              path="marketing"
              element={
                <ProtectedRoute
                  allowedRoleIds={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "DESIGN_HEAD",
                    "LEAD_PROJECT_MANAGER",
                    "HR",
                    "BDR",
                    "SALES",
                  ]}
                >
                  <Marketing />
                </ProtectedRoute>
              }
            />

            {/* Analytics / Reports – not accessible to BDR/SALES/DESIGNER/SITE_ENGINEER */}
            <Route
              path="analytics"
              element={
                <ProtectedRoute
                  allowedRoleIds={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "DESIGN_HEAD",
                    "LEAD_PROJECT_MANAGER",
                    "PROJECT_MANAGER",
                    "ACCOUNTS",
                  ]}
                >
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Reports – Generate & Download Design/Execution/Accounts PDFs */}
            <Route
              path="reports"
              element={
                <ProtectedRoute
                  allowedRoleIds={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "DESIGN_HEAD",
                    "LEAD_PROJECT_MANAGER",
                    "PROJECT_MANAGER",
                    "ACCOUNTS",
                  ]}
                >
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Email Editor */}
            <Route
              path="email-editor"
              element={
                <ProtectedRoute
                  allowedRoleIds={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "DESIGN_HEAD",
                    "LEAD_PROJECT_MANAGER",
                    "BDR",
                    "SALES",
                  ]}
                >
                  <EmailEditor />
                </ProtectedRoute>
              }
            />


            {/* Settings – routed disabled for now */}
            {/* <Route path="settings" element={<SettingsPage />} /> */}


            {/* User Management – admin + lead_pm */}
            <Route
              path="users"
              element={
                <ProtectedRoute
                  allowedRoleIds={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "LEAD_PROJECT_MANAGER",
                    "HR",
                  ]}
                >
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="view-tasks"
              element={
                <ProtectedRoute
                  allowedRoleIds={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "LEAD_PROJECT_MANAGER",
                    "PROJECT_MANAGER",
                    "DESIGNER",
                    "DESIGN_HEAD",
                    "HR",
                  ]}
                >
                  <ViewTasksPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/instagram"
            element={
              <ProtectedRoute
                allowedRoleIds={[
                  "SUPER_ADMIN",
                  "ADMIN",
                  "DESIGN_HEAD",
                  "LEAD_PROJECT_MANAGER",
                  "BDR",
                  "SALES",
                ]}
              >
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
            path="/app/projects"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <EngineerProjects />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/projects/:projectId"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <ProjectDetails />
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
                allowedRoleIds={["SUPER_ADMIN", "ADMIN"]}
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
                allowedRoleIds={["SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <ReportIssue />
                </MobileAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/dsr"
            element={
              <ProtectedRoute
                allowedRoleIds={["SITE_ENGINEER", "SUPER_ADMIN", "ADMIN"]}
              >
                <MobileAppShell>
                  <DailySiteReport />
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

          {/* BDR App – Business Development Representative dashboard */}
          <Route path="/bdr/login" element={<BDRLoginPage />} />
          <Route
            path="/bdr"
            element={
              <ProtectedRoute
                allowedRoleIds={["BDR", "SALES", "SUPER_ADMIN", "ADMIN"]}
                loginRedirect="/bdr/login"
              >
                <BDRAppShell>
                  <BDRHome />
                </BDRAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bdr/tasks"
            element={
              <ProtectedRoute
                allowedRoleIds={["BDR", "SALES", "SUPER_ADMIN", "ADMIN"]}
                loginRedirect="/bdr/login"
              >
                <BDRAppShell>
                  <BDRTasks />
                </BDRAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bdr/profile"
            element={
              <ProtectedRoute
                allowedRoleIds={["BDR", "SALES", "SUPER_ADMIN", "ADMIN"]}
                loginRedirect="/bdr/login"
              >
                <BDRAppShell>
                  <BDRProfile />
                </BDRAppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bdr/leads"
            element={
              <ProtectedRoute
                allowedRoleIds={["BDR", "SALES", "SUPER_ADMIN", "ADMIN"]}
                loginRedirect="/bdr/login"
              >
                <BDRAppShell>
                  <BDRLeads />
                </BDRAppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bdr/meetings"
            element={
              <ProtectedRoute
                allowedRoleIds={["BDR", "SALES", "SUPER_ADMIN", "ADMIN"]}
                loginRedirect="/bdr/login"
              >
                <BDRAppShell>
                  <BDRMeetings />
                </BDRAppShell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </>
  );
}

export default App;
