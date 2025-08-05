import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  LoadingSpinner,
  PageTransition,
} from "./components/AnimationComponents";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import CreateAgent from "./pages/CreateAgent";
import AgentCreationWizard from "./components/AgentCreationWizard";
import PhoneNumbers from "./pages/PhoneNumbers";
import Analytics from "./pages/Analytics";
import LandingPage from "./pages/LandingPage";
import ActiveCalls from "./pages/ActiveCalls";
import CallQueues from "./pages/CallQueues";
import CallRecordings from "./pages/CallRecordings";
import MissedCalls from "./pages/MissedCalls";
import PostCall from "./pages/PostCall";
import "./App.css";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </PageTransition>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </PageTransition>
    );
  }

  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              theme: {
                primary: "green",
                secondary: "black",
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route path="/verify-email" element={<EmailVerification />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <Layout>
                  <Agents />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/create"
            element={
              <ProtectedRoute>
                <AgentCreationWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/create/simple"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateAgent />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/phone-numbers"
            element={
              <ProtectedRoute>
                <Layout>
                  <PhoneNumbers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calls/active"
            element={
              <ProtectedRoute>
                <Layout>
                  <ActiveCalls />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calls/queues"
            element={
              <ProtectedRoute>
                <Layout>
                  <CallQueues />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calls/recordings"
            element={
              <ProtectedRoute>
                <Layout>
                  <CallRecordings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calls/missed"
            element={
              <ProtectedRoute>
                <Layout>
                  <MissedCalls />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calls/post-call"
            element={
              <ProtectedRoute>
                <Layout>
                  <PostCall />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
