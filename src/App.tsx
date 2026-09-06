import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import { ROLES } from './config/roles';

// Module Pages
import Login from './pages/auth/Login';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Dashboard from './pages/dashboard/Dashboard';
import AssetList from './pages/assets/AssetList';
import EmployeeMyAssets from './pages/assets/EmployeeMyAssets';
import AssignmentList from './pages/assignments/AssignmentList';
import TransferList from './pages/transfers/TransferList';
import MaintenanceList from './pages/maintenance/MaintenanceList';
import SupplierList from './pages/suppliers/SupplierList';
import PurchaseList from './pages/purchases/PurchaseList';
import DisposalList from './pages/disposal/DisposalList';
import CampusList from './pages/campuses/CampusList';
import DepartmentList from './pages/departments/DepartmentList';
import EmployeeList from './pages/employees/EmployeeList';
import UserList from './pages/users/UserList';
import AuditList from './pages/audit/AuditList';
import SystemGovernancePage from './pages/system/SystemGovernancePage';
import RoleManagementPage from './pages/system/RoleManagementPage';
import ResetPassword from './pages/auth/ResetPassword';

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Application Shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - Accessible to all authenticated roles */}
              <Route index element={<Dashboard />} />

              {/* Assets Module - view/manage access spans every role per ROLE_PERMISSIONS */}
              <Route
                path="assets"
                element={
                  <ProtectedRoute>
                    <AssetList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="my-assets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.LAB_MANAGER]}>
                    <EmployeeMyAssets />
                  </ProtectedRoute>
                }
              />

              {/* Assignments Module */}
              <Route
                path="assignments"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.OVERALL_ADMIN,
                      ROLES.CAMPUS_ADMIN,
                      ROLES.ICT_OFFICER,
                    ]}
                  >
                    <AssignmentList />
                  </ProtectedRoute>
                }
              />

              {/* Transfers Module */}
              <Route
                path="transfers"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                      ROLES.CAMPUS_ADMIN,
                      ROLES.ASSET_OFFICER,
                      ROLES.UNIT_APPROVER,
                    ]}
                  >
                    <TransferList />
                  </ProtectedRoute>
                }
              />

              {/* Maintenance Module */}
              <Route
                path="maintenance"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                      ROLES.CAMPUS_ADMIN,
                      ROLES.ASSET_OFFICER,
                      ROLES.UNIT_APPROVER,
                      ROLES.LAB_MANAGER,
                      ROLES.TECHNICIAN,
                      ROLES.EMPLOYEE,
                    ]}
                  >
                    <MaintenanceList />
                  </ProtectedRoute>
                }
              />

              {/* Suppliers Module */}
              <Route
                path="suppliers"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                      ROLES.PROCUREMENT_OFFICER,
                    ]}
                  >
                    <SupplierList />
                  </ProtectedRoute>
                }
              />

              {/* Purchases Module */}
              <Route
                path="purchases"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                      ROLES.PROCUREMENT_OFFICER,
                    ]}
                  >
                    <PurchaseList />
                  </ProtectedRoute>
                }
              />

              {/* Disposal Module */}
              <Route
                path="disposal"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                      ROLES.CAMPUS_ADMIN,
                      ROLES.ASSET_OFFICER,
                    ]}
                  >
                    <DisposalList />
                  </ProtectedRoute>
                }
              />

              {/* Campuses Module */}
              <Route
                path="campuses"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                      ROLES.CAMPUS_ADMIN,
                    ]}
                  >
                    <CampusList />
                  </ProtectedRoute>
                }
              />

              {/* Departments Module */}
              <Route
                path="departments"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                    ]}
                  >
                    <DepartmentList />
                  </ProtectedRoute>
                }
              />

              {/* Employees Module */}
              <Route
                path="employees"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.SYSTEM_ADMIN,
                      ROLES.CAMPUS_ADMIN,
                      ROLES.ASSET_OFFICER,
                      ROLES.UNIT_APPROVER,
                    ]}
                  >
                    <EmployeeList />
                  </ProtectedRoute>
                }
              />

              {/* System Users Module (SYSTEM_ADMIN & CAMPUS_ADMIN per permission matrix) */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.CAMPUS_ADMIN]}>
                    <UserList />
                  </ProtectedRoute>
                }
              />

              {/* Audit Trail Module */}
              <Route
                path="audit"
                element={
                  <ProtectedRoute
                    allowedRoles={[ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.AUDIT_OFFICER, ROLES.ICT_OFFICER]}
                  >
                    <AuditList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OVERALL_ADMIN, ROLES.CAMPUS_ADMIN]}>
                    <SystemGovernancePage mode="settings" />
                  </ProtectedRoute>
                }
              />

              {/* Roles & Permissions Module (Overall Administrator only) */}
              <Route
                path="roles"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OVERALL_ADMIN]}>
                    <RoleManagementPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
