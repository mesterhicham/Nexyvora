import { useState, useEffect, lazy, Suspense } from "react";
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
import { tr } from "@/utils/tr";
import Home from "./pages/Home";
const Login = lazy(() => import("./pages/Login"));
const Auth = lazy(() => import("./pages/Auth"));
const FormationLanding = lazy(() => import("./pages/public/FormationLanding"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const VerifyDiploma = lazy(() => import("./pages/VerifyDiploma"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAcademy = lazy(() => import("./pages/admin/AdminAcademy"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const WalletManagement = lazy(() => import("./pages/admin/WalletManagement"));
const AdminBonusPools = lazy(() => import("./pages/admin/AdminBonusPools"));
const WithdrawalMonitoring = lazy(() => import("./pages/admin/WithdrawalMonitoring"));
const DepositManagement = lazy(() => import("./pages/admin/DepositManagement"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminTeamTree = lazy(() => import("./pages/admin/AdminTeamTree"));
const AdminKYC = lazy(() => import("./pages/admin/AdminKYC"));
const LeaderRanks = lazy(() => import("./pages/admin/LeaderRanks"));
const LeaderAchievers = lazy(() => import("./pages/admin/LeaderAchievers"));
const AdminChallenges = lazy(() => import("./pages/admin/AdminChallenges"));
const GenerationSettings = lazy(() => import("./pages/admin/GenerationSettings"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const StudentsManagement = lazy(() => import("./pages/admin/StudentsManagement"));
const TeachersManagement = lazy(() => import("./pages/admin/TeachersManagement"));
const ProgramsManagement = lazy(() => import("./pages/admin/ProgramsManagement"));
const SpecialtiesManagement = lazy(() => import("./pages/admin/SpecialtiesManagement"));
const CohortsManagement = lazy(() => import("./pages/admin/CohortsManagement"));
const ModulesManagement = lazy(() => import("./pages/admin/ModulesManagement"));
const DiplomasManagement = lazy(() => import("./pages/admin/DiplomasManagement"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const PlatformSettings = lazy(() => import("./pages/admin/PlatformSettings"));
const AdminPolicies = lazy(() => import("./pages/admin/AdminPolicies"));
const PoliciesPage = lazy(() => import("./pages/public/PoliciesPage"));
const HolidaysManagement = lazy(() => import("./pages/admin/HolidaysManagement"));
const NewsManagement = lazy(() => import("./pages/admin/NewsManagement"));
const EmailSettings = lazy(() => import("./pages/admin/EmailSettings"));
const ZoomMeetings = lazy(() => import("./pages/admin/ZoomMeetings"));
const PlacementTestManagement = lazy(() => import("./pages/admin/PlacementTestManagement"));
const PaymentsManagement = lazy(() => import("./pages/admin/PaymentsManagement"));
const FormationsManagement = lazy(() => import("./pages/admin/FormationsManagement"));
const ProgramPricing = lazy(() => import("./pages/admin/ProgramPricing"));
const AdminPaymentSettings = lazy(() => import("./pages/admin/AdminPaymentSettings"));
const AdminCurrencySettings = lazy(() => import("./pages/admin/AdminCurrencySettings"));
import { CurrencyProvider } from "@/contexts/CurrencyContext";
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherModules = lazy(() => import("./pages/teacher/TeacherModules"));
const TeacherLessons = lazy(() => import("./pages/teacher/TeacherLessons"));
const TeacherAssignments = lazy(() => import("./pages/teacher/TeacherAssignments"));
const TeacherAttendance = lazy(() => import("./pages/teacher/TeacherAttendance"));
const TeacherAnnouncements = lazy(() => import("./pages/teacher/TeacherAnnouncements"));
const TeacherMeetingsPage = lazy(() => import("./pages/teacher/TeacherMeetingsPage"));
const TeacherFormations = lazy(() => import("./pages/teacher/TeacherFormations"));
const FormationProgressDashboard = lazy(() => import("./pages/teacher/FormationProgressDashboard"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentCourses = lazy(() => import("./pages/student/StudentCourses"));
const StudentCourseDetail = lazy(() => import("./pages/student/StudentCourseDetail"));
const StudentLessons = lazy(() => import("./pages/student/StudentLessons"));
const StudentLessonView = lazy(() => import("./pages/student/StudentLessonView"));
const StudentAssignments = lazy(() => import("./pages/student/StudentAssignments"));
const StudentGrades = lazy(() => import("./pages/student/StudentGrades"));
const StudentDiploma = lazy(() => import("./pages/student/StudentDiploma"));
const PlacementTest = lazy(() => import("./pages/student/PlacementTest"));
const StudentMeetings = lazy(() => import("./pages/student/StudentMeetings"));
const StudentFormations = lazy(() => import("./pages/student/StudentFormations"));
const FormationWatch = lazy(() => import("./pages/student/FormationWatch"));
const StudentAttendance = lazy(() => import("./pages/student/StudentAttendance"));
const StudentAcademy = lazy(() => import("./pages/student/StudentAcademy"));
const PackagesStore = lazy(() => import("./pages/student/PackagesStore"));
const MyPackage = lazy(() => import("./pages/student/MyPackage"));
const StudentWallet = lazy(() => import("./pages/student/StudentWallet"));
const StudentTeam = lazy(() => import("./pages/student/StudentTeam"));
const StudentRanks = lazy(() => import("./pages/student/StudentRanks"));
const StudentChallenges = lazy(() => import("./pages/student/StudentChallenges"));
const StudentCommunity = lazy(() => import("./pages/student/StudentCommunity"));
const StudentBonusPool = lazy(() => import("./pages/student/StudentBonusPool"));
const StudentFounder = lazy(() => import("./pages/student/StudentFounder"));
const StudentActivation = lazy(() => import("./pages/student/StudentActivation"));
const AdminFounderManagement = lazy(() => import("./pages/admin/AdminFounderManagement"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const StudentNewsCenter = lazy(() => import("./pages/student/StudentNewsCenter"));
const StudentTeamTree = lazy(() => import("./pages/student/StudentTeamTree"));
const AdminPromisedPackages = lazy(() => import("./pages/admin/AdminPromisedPackages"));
const StudentSupport = lazy(() => import("./pages/student/StudentSupport"));
const ServicesStore = lazy(() => import("./pages/student/ServicesStore"));
const ServiceDetails = lazy(() => import("./pages/student/ServiceDetails"));
const ServiceOrders = lazy(() => import("./pages/student/ServiceOrders"));
const CustomProjectRequest = lazy(() => import("./pages/student/CustomProjectRequest"));
const ServicesManagement = lazy(() => import("./pages/admin/ServicesManagement"));
const ServicesOrdersManagement = lazy(() => import("./pages/admin/ServicesOrdersManagement"));
const CustomProjectsManagement = lazy(() => import("./pages/admin/CustomProjectsManagement"));
const ChatPage = lazy(() => import("./pages/shared/ChatPage"));
const MeetingRoom = lazy(() => import("./pages/shared/MeetingRoom"));
const ProfileSettings = lazy(() => import("./pages/shared/ProfileSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Pages are code-split: each route downloads its own chunk on first visit.
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}

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
        <p className="text-xs font-bold text-slate-400">
          {tr('جاري التحقق من تفعيل الحساب...', 'Checking account activation...', 'Vérification de l\'activation du compte...')}
        </p>
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
  if (!user) {
    const isTeacherRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/teacher');
    return <Navigate to={isTeacherRoute ? "/auth?role=teacher&redirect=/teacher" : "/auth"} replace />;
  }
  if (!role || !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function DashboardRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-white p-6">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

function ProfileRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={`/${role || 'student'}/profile`} replace />;
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
              <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/teacher/login" element={<Navigate to="/auth?role=teacher&redirect=/teacher" replace />} />
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
                <Route path="/admin/platform-settings" element={<PlatformSettings />} />
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
                <Route path="/admin/services" element={<ServicesManagement />} />
                <Route path="/admin/services/orders" element={<ServicesOrdersManagement />} />
                <Route path="/admin/services/custom-projects" element={<CustomProjectsManagement />} />
                <Route path="/admin/users" element={<UsersManagement />} />
                <Route path="/admin/formation-progress" element={<FormationProgressDashboard />} />
                <Route path="/admin/chat" element={<ChatPage />} />
                <Route path="/admin/community" element={<StudentCommunity role="admin" />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/profile" element={<ProfileSettings />} />
              </Route>

              {/* Teacher Routes (Protected) */}
              <Route element={<RequireRole allowedRoles={['teacher', 'admin']} />}>
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/programs" element={<ProgramsManagement role="teacher" />} />
                <Route path="/teacher/specialties" element={<SpecialtiesManagement role="teacher" />} />
                <Route path="/teacher/formations" element={<TeacherFormations />} />
                <Route path="/teacher/modules" element={<TeacherModules />} />
                <Route path="/teacher/lessons" element={<TeacherLessons />} />
                <Route path="/teacher/cohorts" element={<CohortsManagement role="teacher" />} />
                <Route path="/teacher/meetings" element={<TeacherMeetingsPage />} />
                <Route path="/teacher/meetings/:meetingId" element={<MeetingRoom />} />
                <Route path="/teacher/assignments" element={<TeacherAssignments />} />
                <Route path="/teacher/attendance" element={<TeacherAttendance />} />
                <Route path="/teacher/formation-progress" element={<FormationProgressDashboard />} />
                <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
                <Route path="/teacher/community" element={<StudentCommunity role="teacher" />} />
                <Route path="/teacher/chat" element={<ChatPage />} />
                <Route path="/teacher/support" element={<StudentSupport />} />
                <Route path="/teacher/profile" element={<ProfileSettings />} />
              </Route>
              {/* Student Activation & Shared Support */}
              <Route path="/student/activation" element={<StudentActivation />} />
              <Route path="/student/support" element={<StudentSupport />} />
              <Route path="/support" element={<StudentSupport />} />

              {/* Protected Student Routes (Require Active $30 Community Package) */}
              <Route element={<RequireActiveMembership />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/academy" element={<StudentAcademy />} />
                <Route path="/student/services" element={<ServicesStore />} />
                <Route path="/student/services/my-orders" element={<ServiceOrders />} />
                <Route path="/student/services/custom-project" element={<CustomProjectRequest />} />
                <Route path="/student/services/:slug" element={<ServiceDetails />} />
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
                <Route path="/student/formations/:enrollmentId/watch" element={<FormationWatch />} />
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
              <Route path="/profile" element={<ProfileRedirect />} />
              <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
              <Route path="*" element={<NotFound />} />

            </Routes>
              </Suspense>
          </CurrencyProvider>
        </AuthProvider>
        </BrowserRouter>
      </PWAProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
