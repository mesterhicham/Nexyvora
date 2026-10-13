import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { packageService } from "@/services/apiService";
import { PWAProvider } from "@/contexts/PWAInstallContext";
import { InstallModal } from "@/components/pwa/InstallModal";
import { MobileInstallBanner } from "@/components/pwa/MobileInstallBanner";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { SEOHead } from "@/components/SEOHead";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import FormationLanding from "./pages/public/FormationLanding";
import AdminSetup from "./pages/AdminSetup";
import VerifyDiploma from "./pages/VerifyDiploma";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAcademy from "./pages/admin/AdminAcademy";
import AdminPackages from "./pages/admin/AdminPackages";
import WalletManagement from "./pages/admin/WalletManagement";
import AdminBonusPools from "./pages/admin/AdminBonusPools";
import WithdrawalMonitoring from "./pages/admin/WithdrawalMonitoring";
import DepositManagement from "./pages/admin/DepositManagement";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminTeamTree from "./pages/admin/AdminTeamTree";
import AdminKYC from "./pages/admin/AdminKYC";
import LeaderRanks from "./pages/admin/LeaderRanks";
import LeaderAchievers from "./pages/admin/LeaderAchievers";
import AdminChallenges from "./pages/admin/AdminChallenges";
import GenerationSettings from "./pages/admin/GenerationSettings";
import UsersManagement from "./pages/admin/UsersManagement";
import StudentsManagement from "./pages/admin/StudentsManagement";
import TeachersManagement from "./pages/admin/TeachersManagement";
import ProgramsManagement from "./pages/admin/ProgramsManagement";
import SpecialtiesManagement from "./pages/admin/SpecialtiesManagement";
import CohortsManagement from "./pages/admin/CohortsManagement";
import ModulesManagement from "./pages/admin/ModulesManagement";
import DiplomasManagement from "./pages/admin/DiplomasManagement";
import ReportsPage from "./pages/admin/ReportsPage";
import PlatformSettings from "./pages/admin/PlatformSettings";
import AdminPolicies from "./pages/admin/AdminPolicies";
import PoliciesPage from "./pages/public/PoliciesPage";
import HolidaysManagement from "./pages/admin/HolidaysManagement";
import NewsManagement from "./pages/admin/NewsManagement";
import EmailSettings from "./pages/admin/EmailSettings";
import ZoomMeetings from "./pages/admin/ZoomMeetings";
import PlacementTestManagement from "./pages/admin/PlacementTestManagement";
import PaymentsManagement from "./pages/admin/PaymentsManagement";
import FormationsManagement from "./pages/admin/FormationsManagement";
import ProgramPricing from "./pages/admin/ProgramPricing";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";
import AdminCurrencySettings from "./pages/admin/AdminCurrencySettings";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherModules from "./pages/teacher/TeacherModules";
import TeacherLessons from "./pages/teacher/TeacherLessons";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherMeetingsPage from "./pages/teacher/TeacherMeetingsPage";
import TeacherFormations from "./pages/teacher/TeacherFormations";
import FormationProgressDashboard from "./pages/teacher/FormationProgressDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCourseDetail from "./pages/student/StudentCourseDetail";
import StudentLessons from "./pages/student/StudentLessons";
import StudentLessonView from "./pages/student/StudentLessonView";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentGrades from "./pages/student/StudentGrades";
import StudentDiploma from "./pages/student/StudentDiploma";
import PlacementTest from "./pages/student/PlacementTest";
import StudentMeetings from "./pages/student/StudentMeetings";
import StudentFormations from "./pages/student/StudentFormations";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentAcademy from "./pages/student/StudentAcademy";
import PackagesStore from "./pages/student/PackagesStore";
import MyPackage from "./pages/student/MyPackage";
import StudentWallet from "./pages/student/StudentWallet";
import StudentTeam from "./pages/student/StudentTeam";
import StudentRanks from "./pages/student/StudentRanks";
import StudentChallenges from "./pages/student/StudentChallenges";
import StudentCommunity from "./pages/student/StudentCommunity";
import StudentBonusPool from "./pages/student/StudentBonusPool";
import StudentFounder from "./pages/student/StudentFounder";
import StudentActivation from "./pages/student/StudentActivation";
import AdminFounderManagement from "./pages/admin/AdminFounderManagement";
import AdminSupport from "./pages/admin/AdminSupport";
import StudentNewsCenter from "./pages/student/StudentNewsCenter";
import StudentTeamTree from "./pages/student/StudentTeamTree";
import AdminPromisedPackages from "./pages/admin/AdminPromisedPackages";
import StudentSupport from "./pages/student/StudentSupport";
import ChatPage from "./pages/shared/ChatPage";
import MeetingRoom from "./pages/shared/MeetingRoom";
import ProfileSettings from "./pages/shared/ProfileSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireActiveMembership() {
  const { user, role, loading: authLoading } = useAuth();
  const [membershipState, setMembershipState] = useState<{ checked: boolean; hasActive: boolean }>({
    checked: false,
    hasActive: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setMembershipState({ checked: true, hasActive: false });
      return;
    }
    // Non-student roles (admin, teacher) do not require community package activation
    if (role !== 'student') {
      setMembershipState({ checked: true, hasActive: true });
      return;
    }

    packageService.getMyPackage()
      .then((res) => {
        setMembershipState({
          checked: true,
          hasActive: !!res.hasActivePackage,
        });
      })
      .catch(() => {
        setMembershipState({ checked: true, hasActive: false });
      });
  }, [user, role, authLoading]);

  if (authLoading || !membershipState.checked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400">جاري التحقق من تفعيل الحساب...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!membershipState.hasActive) {
    return <Navigate to="/student/activation" replace />;
  }

  return <Outlet />;
}

function RequireRole({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!role || !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function DashboardRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SEOHead />
      <PWAProvider>
        <InstallModal />
        <MobileInstallBanner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <CurrencyProvider>
              <ImpersonationBanner />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              <Route path="/verify-diploma" element={<VerifyDiploma />} />
              {/* Public Formation Landing Page */}
              <Route path="/formation/:id" element={<FormationLanding />} />
              {/* Public Policies / Legal Pages */}
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/policies/:policyId" element={<PoliciesPage />} />
              {/* Admin Routes (Protected) */}
              <Route element={<RequireRole allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/academy" element={<AdminAcademy />} />
                <Route path="/admin/packages" element={<AdminPackages />} />
                <Route path="/admin/promised-packages" element={<AdminPromisedPackages />} />
                <Route path="/admin/promised-package" element={<AdminPromisedPackages />} />
                <Route path="/admin/wallets" element={<WalletManagement />} />
                <Route path="/admin/bonus-pools" element={<AdminBonusPools />} />
                <Route path="/admin/founders" element={<AdminFounderManagement />} />
                <Route path="/admin/founder" element={<AdminFounderManagement />} />
                <Route path="/admin/withdrawals" element={<WithdrawalMonitoring />} />
                <Route path="/admin/deposits" element={<DepositManagement />} />
                <Route path="/admin/ipn-logs" element={<DepositManagement defaultTab="ipn_log" />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/team-tree" element={<AdminTeamTree />} />
                <Route path="/admin/kyc" element={<AdminKYC />} />
                <Route path="/admin/ranks" element={<LeaderRanks />} />
                <Route path="/admin/leader-achievers" element={<LeaderAchievers />} />
                <Route path="/admin/challenges" element={<AdminChallenges />} />
                <Route path="/admin/generation-settings" element={<GenerationSettings />} />
                <Route path="/admin/students" element={<StudentsManagement />} />
                <Route path="/admin/teachers" element={<TeachersManagement />} />
                <Route path="/admin/programs" element={<ProgramsManagement />} />
                <Route path="/admin/program-pricing" element={<ProgramPricing />} />
                <Route path="/admin/specialties" element={<SpecialtiesManagement />} />
                <Route path="/admin/cohorts" element={<CohortsManagement />} />
                <Route path="/admin/modules" element={<ModulesManagement />} />
                <Route path="/admin/diplomas" element={<DiplomasManagement />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/settings" element={<PlatformSettings />} />
                <Route path="/admin/policies" element={<AdminPolicies />} />
                <Route path="/admin/holidays" element={<HolidaysManagement />} />
                <Route path="/admin/news" element={<NewsManagement />} />
                <Route path="/admin/email-settings" element={<EmailSettings />} />
                <Route path="/admin/email" element={<EmailSettings />} />
                <Route path="/admin/zoom" element={<ZoomMeetings />} />
                <Route path="/admin/placement-test" element={<PlacementTestManagement />} />
                <Route path="/admin/payments" element={<PaymentsManagement />} />
                <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
                <Route path="/admin/currency-settings" element={<AdminCurrencySettings />} />
                <Route path="/admin/formations" element={<FormationsManagement />} />
                <Route path="/admin/users" element={<UsersManagement />} />
                <Route path="/admin/formation-progress" element={<FormationProgressDashboard />} />
                <Route path="/admin/chat" element={<ChatPage />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/profile" element={<ProfileSettings />} />
              </Route>

              {/* Teacher Routes (Protected) */}
              <Route element={<RequireRole allowedRoles={['teacher', 'admin']} />}>
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/modules" element={<TeacherModules />} />
                <Route path="/teacher/lessons" element={<TeacherLessons />} />
                <Route path="/teacher/assignments" element={<TeacherAssignments />} />
                <Route path="/teacher/attendance" element={<TeacherAttendance />} />
                <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
                <Route path="/teacher/meetings" element={<TeacherMeetingsPage />} />
                <Route path="/teacher/formations" element={<TeacherFormations />} />
                <Route path="/teacher/formation-progress" element={<FormationProgressDashboard />} />
                <Route path="/teacher/chat" element={<ChatPage />} />
                <Route path="/teacher/support" element={<StudentSupport />} />
                <Route path="/teacher/profile" element={<ProfileSettings />} />
              </Route>
              {/* Student Activation & Shared Support */}
              <Route path="/student/activation" element={<StudentActivation />} />
              <Route path="/student/support" element={<StudentSupport />} />
              <Route path="/support" element={<StudentSupport />} />
              <Route path="/admin/community" element={<StudentCommunity />} />

              {/* Protected Student Routes (Require Active $30 Community Package) */}
              <Route element={<RequireActiveMembership />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/academy" element={<StudentAcademy />} />
                <Route path="/student/packages" element={<PackagesStore />} />
                <Route path="/student/my-package" element={<MyPackage />} />
                <Route path="/student/wallet" element={<StudentWallet />} />
                <Route path="/student/team" element={<StudentTeam />} />
                <Route path="/student/team-tree" element={<StudentTeamTree />} />
                <Route path="/student/ranks" element={<StudentRanks />} />
                <Route path="/student/bonus-pool" element={<StudentBonusPool />} />
                <Route path="/student/bonus-pools" element={<StudentBonusPool />} />
                <Route path="/student/founder" element={<StudentFounder />} />
                <Route path="/student/founders" element={<StudentFounder />} />
                <Route path="/student/community" element={<StudentCommunity />} />
                <Route path="/student/news" element={<StudentNewsCenter />} />
                <Route path="/student/media-center" element={<StudentNewsCenter />} />
                <Route path="/student/challenges" element={<StudentChallenges />} />
                <Route path="/student/courses" element={<StudentCourses />} />
                <Route path="/student/courses/:courseId" element={<StudentCourseDetail />} />
                <Route path="/student/courses/:moduleId" element={<StudentCourseDetail />} />
                <Route path="/student/formations" element={<StudentFormations />} />
                <Route path="/student/lessons" element={<StudentLessons />} />
                <Route path="/student/lessons/:lessonId" element={<StudentLessonView />} />
                <Route path="/student/assignments" element={<StudentAssignments />} />
                <Route path="/student/attendance" element={<StudentAttendance />} />
                <Route path="/student/grades" element={<StudentGrades />} />
                <Route path="/student/diploma" element={<StudentDiploma />} />
                <Route path="/student/placement-test" element={<PlacementTest />} />
                <Route path="/student/program-selection" element={<Navigate to="/student" replace />} />
                <Route path="/student/payment" element={<Navigate to="/student/wallet" replace />} />
                <Route path="/student/meetings" element={<StudentMeetings />} />
                <Route path="/student/chat" element={<ChatPage />} />
                <Route path="/student/profile" element={<ProfileSettings />} />
              </Route>
              {/* Shared Routes */}
              <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CurrencyProvider>
        </AuthProvider>
        </BrowserRouter>
      </PWAProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
