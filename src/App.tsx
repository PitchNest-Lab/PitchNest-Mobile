import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BillingProvider } from './contexts/BillingContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NativeRuntime } from './components/native/NativeRuntime';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UpgradeProvider } from './components/ui/UpgradeModal';
import { getAuthToken, getStoredUser } from './lib/authStorage';
import { lazyPage } from './lib/lazyPage';

const NativeAppLayout = lazyPage(() => import('./components/native/NativeAppLayout'));
const LoginPage = lazyPage(() => import('./pages/LoginPage'));
const SignupPage = lazyPage(() => import('./pages/SignupPage'));
const ForgotPassword = lazyPage(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyPage(() => import('./pages/ResetPassword'));
const VerifyEmail = lazyPage(() => import('./components/VerifyEmail'));
const Onboarding = lazyPage(() => import('./pages/Onboarding'));
const Dashboard = lazyPage(() => import('./pages/Dashboard'));
const PrePitchSetup = lazyPage(() => import('./pages/PrePitchSetup'));
const LivePitchRoom = lazyPage(() => import('./pages/LivePitchRoom'));
const PostPitchReport = lazyPage(() => import('./pages/PostPitchReport'));
const PitchReplayScreen = lazyPage(() => import('./pages/PitchReplayScreen'));
const MyPitchesArchive = lazyPage(() => import('./pages/MyPitchesArchive'));
const SettingsLayout = lazyPage(() => import('./pages/settings/SettingsLayout'));
const ProfileSettings = lazyPage(() => import('./pages/settings/ProfileSection'));
const AccountSettings = lazyPage(() => import('./pages/settings/AccountSection'));
const AppearanceSettings = lazyPage(() => import('./pages/settings/AppearanceSection'));
const NotificationSettings = lazyPage(() => import('./pages/settings/NotificationsSection'));
const VoiceSettings = lazyPage(() => import('./pages/settings/VoiceSection'));
const PrivacyPolicy = lazyPage(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazyPage(() => import('./pages/legal/TermsOfService'));
const RefundPolicy = lazyPage(() => import('./pages/legal/RefundPolicy'));
const DeleteAccount = lazyPage(() => import('./pages/legal/DeleteAccount'));
const Support = lazyPage(() => import('./pages/legal/Support'));
const PublicPitch = lazyPage(() => import('./pages/PublicPitch'));

/**
 * Android intentionally exposes only the private pitch-practice workflow and
 * essential account/legal screens. The founder ecosystem, organizations,
 * staff tools, business workspace, marketing pages, and billing stay on web.
 */
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <BillingProvider>
            <UpgradeProvider>
              <ErrorBoundary>
                <NativeRuntime>
                  <React.Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<NativeHomeGate />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify" element={<VerifyEmail />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/refunds" element={<RefundPolicy />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/delete-account" element={<DeleteAccount />} />
                      <Route path="/share/:shareId" element={<PublicPitch />} />

                      <Route
                        element={
                          <ProtectedRoute>
                            <NativeAppLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/setup" element={<PrePitchSetup />} />
                        <Route path="/archive" element={<MyPitchesArchive />} />
                        <Route path="/replay" element={<PitchReplayScreen />} />
                        <Route path="/report" element={<PostPitchReport />} />
                      </Route>

                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <SettingsLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route path="profile" element={<ProfileSettings />} />
                        <Route path="account" element={<AccountSettings />} />
                        <Route path="appearance" element={<AppearanceSettings />} />
                        <Route path="notifications" element={<NotificationSettings />} />
                        <Route path="voice" element={<VoiceSettings />} />
                        <Route path="billing" element={<Navigate to="/settings" replace />} />
                        <Route path="*" element={<Navigate to="/settings" replace />} />
                      </Route>

                      <Route
                        path="/onboarding"
                        element={
                          <ProtectedRoute>
                            <Onboarding />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/room"
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <SocketProvider>
                                <LivePitchRoom />
                              </SocketProvider>
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/live" element={<Navigate to="/room" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </React.Suspense>
                </NativeRuntime>
              </ErrorBoundary>
            </UpgradeProvider>
          </BillingProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

function NativeHomeGate() {
  const { user, isLoading } = useAuth();
  if (user && user.accountType !== 'organization') return <Navigate to="/dashboard" replace />;
  if (isLoading && hasStoredFounderSession()) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function hasStoredFounderSession(): boolean {
  try {
    if (!getAuthToken()) return false;
    const stored = JSON.parse(getStoredUser() || 'null');
    return Boolean(stored?.id) && stored.accountType !== 'organization';
  } catch {
    return false;
  }
}

function RouteFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 dark:bg-[#09090B]" role="status" aria-label="Loading">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-zinc-800 dark:border-t-indigo-400" />
    </div>
  );
}
