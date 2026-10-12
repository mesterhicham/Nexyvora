import api from '@/lib/api';

export const authService = {
    checkAdminExists: () => api.get('/auth/check-admin').then(res => res.data),
    setupFirstAdmin: (setupSecret?: string) => api.post('/auth/setup-admin', { setupSecret }).then(res => res.data),
    sendWhatsAppOtp: (phoneNumber: string) => api.post('/auth/whatsapp/send-otp', { phone_number: phoneNumber }).then(res => res.data),
    verifyWhatsAppOtp: (phoneNumber: string, code: string) => api.post('/auth/whatsapp/verify-otp', { phone_number: phoneNumber, code }).then(res => res.data),
    sendEmailOtp: (email: string, type: string = 'registration', name?: string) => 
        api.post('/auth/email/send-otp', { email, type, name }).then(res => res.data),
    verifyEmailOtp: (email: string, code: string, type: string = 'registration') => 
        api.post('/auth/email/verify-otp', { email, code, type }).then(res => res.data),
    forgotPasswordOtp: (email: string) => 
        api.post('/auth/forgot-password-otp', { email }).then(res => res.data),
    resetPasswordWithOtp: (email: string, code: string, newPassword: string) => 
        api.post('/auth/reset-password-otp', { email, code, newPassword }).then(res => res.data),
};

export const userService = {
    getProfile: () => api.get('/user/profile').then(res => res.data),
    updateProfile: (data: any) => api.put('/user/profile', data).then(res => res.data),
    deleteAccount: () => api.delete('/user/account').then(res => res.data),
    changePassword: (data: any) => api.post('/user/change-password', data).then(res => res.data),
    getStats: (role: string) => api.get(`/user/stats/${role}`).then(res => res.data),
    getAdminStats: () => api.get('/user/stats/admin').then(res => res.data),
};

export const academicService = {
    getPrograms: () => api.get('/academic/programs').then(res => res.data),
    getProgram: (id: string) => api.get(`/academic/programs/${id}`).then(res => res.data),
    createProgram: (data: any) => api.post('/academic/programs', data).then(res => res.data),
    updateProgram: ({ id, ...data }: any) => api.put(`/academic/programs/${id}`, data).then(res => res.data),
    deleteProgram: (id: string) => api.delete(`/academic/programs/${id}`).then(res => res.data),

    getSpecialties: () => api.get('/academic/specialties').then(res => res.data),
    createSpecialty: (data: any) => api.post('/academic/specialties', data).then(res => res.data),
    updateSpecialty: ({ id, ...data }: any) => api.put(`/academic/specialties/${id}`, data).then(res => res.data),
    deleteSpecialty: (id: string) => api.delete(`/academic/specialties/${id}`).then(res => res.data),

    getCohorts: () => api.get('/academic/cohorts').then(res => res.data),
    createCohort: (data: any) => api.post('/academic/cohorts', data).then(res => res.data),
    updateCohort: ({ id, ...data }: any) => api.put(`/academic/cohorts/${id}`, data).then(res => res.data),
    deleteCohort: (id: string) => api.delete(`/academic/cohorts/${id}`).then(res => res.data),

    getModules: () => api.get('/academic/modules').then(res => res.data),
    getModule: (id: string) => api.get(`/academic/modules/${id}`).then(res => res.data),
    createModule: (data: any) => api.post('/academic/modules', data).then(res => res.data),
    updateModule: ({ id, ...data }: any) => api.put(`/academic/modules/${id}`, data).then(res => res.data),
    deleteModule: (id: string) => api.delete(`/academic/modules/${id}`).then(res => res.data),

    getTeachers: () => api.get('/academic/teachers').then(res => res.data),
    getTeacherDetails: (id: string) => api.get(`/academic/teachers/${id}/details`).then(res => res.data),
    createTeacher: (data: any) => api.post('/academic/teachers', data).then(res => res.data),
    updateTeacher: ({ id, ...data }: any) => api.put(`/academic/teachers/${id}`, data).then(res => res.data),
    deleteTeacher: (id: string) => api.delete(`/academic/teachers/${id}`).then(res => res.data),
    getStudents: () => api.get('/academic/students').then(res => res.data),
    getStudentDetails: (id: string) => api.get(`/academic/students/${id}/details`).then(res => res.data),
    createStudent: (data: any) => api.post('/academic/students', data).then(res => res.data),
    updateStudent: ({ id, ...data }: any) => api.put(`/academic/students/${id}`, data).then(res => res.data),
    deleteStudent: (id: string) => api.delete(`/academic/students/${id}`).then(res => res.data),
    impersonateStudent: (id: string) => api.post(`/academic/students/${id}/impersonate`).then(res => res.data),
    addStudentPayment: ({ id, ...data }: any) => api.post(`/academic/students/${id}/payments`, data).then(res => res.data),
};

export const uploadService = {
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    }
};

export const teacherService = {
    getLessons: () => api.get('/teacher/lessons').then(res => res.data),
    createLesson: (data: any) => api.post('/teacher/lessons', data).then(res => res.data),
    updateLesson: ({ id, ...data }: any) => api.put(`/teacher/lessons/${id}`, data).then(res => res.data),
    deleteLesson: (id: string) => api.delete(`/teacher/lessons/${id}`).then(res => res.data),
    getAttendance: (lessonId: string) => api.get(`/teacher/attendance/${lessonId}`).then(res => res.data),
    markAttendance: (data: any) => api.post('/teacher/attendance', data).then(res => res.data),
    getAssignments: () => api.get('/teacher/assignments').then(res => res.data),
    createAssignment: (data: any) => api.post('/teacher/assignments', data).then(res => res.data),
    updateAssignment: ({ id, ...data }: any) => api.put(`/teacher/assignments/${id}`, data).then(res => res.data),
    deleteAssignment: (id: string) => api.delete(`/teacher/assignments/${id}`).then(res => res.data),
    getAssignmentSubmissions: (assignmentId: string) => api.get(`/teacher/assignments/${assignmentId}/submissions`).then(res => res.data),
    gradeSubmission: (data: any) => api.post('/teacher/assignments/grade', data).then(res => res.data),

    // Lesson Content
    getLessonContent: (lessonId: string) => api.get(`/teacher/lessons/${lessonId}/content`).then(res => res.data),
    uploadLessonContent: (data: any) => api.post('/teacher/lessons/content', data).then(res => res.data),
    deleteLessonContent: (id: string) => api.delete(`/teacher/lessons/content/${id}`).then(res => res.data),
    reorderLessonContent: (items: any[]) => api.post('/teacher/lessons/content/reorder', { items }).then(res => res.data),

    // Teacher Announcements
    getAnnouncements: () => api.get('/teacher/announcements').then(res => res.data),
    createAnnouncement: (data: any) => api.post('/teacher/announcements', data).then(res => res.data),
    updateAnnouncement: ({ id, ...data }: any) => api.put(`/teacher/announcements/${id}`, data).then(res => res.data),
    deleteAnnouncement: (id: string) => api.delete(`/teacher/announcements/${id}`).then(res => res.data),

    // Formation Progress
    getFormationProgress: () => api.get('/teacher/formation-progress').then(res => res.data),
};

export const studentService = {
    getRecord: () => api.get('/student/record').then(res => res.data),
    getLessons: () => api.get('/student/lessons').then(res => res.data),
    getAssignments: () => api.get('/student/assignments').then(res => res.data),
    getMySubmissions: () => api.get('/student/my-submissions').then(res => res.data),
    submitAssignment: (data: any) => api.post('/student/submit-assignment', data).then(res => res.data),
    getLessonProgress: (lessonId: string) => api.get(`/student/lessons/${lessonId}/progress`).then(res => res.data),
    updateLessonProgress: (data: any) => api.post('/student/lessons/progress', data).then(res => res.data),
    getAttendance: () => api.get('/student/attendance').then(res => res.data),
    selectProgram: (data: { programId: string; specialtyId?: string }) => api.post('/student/select-program', data).then(res => res.data),
};

export const adminService = {
    getSettings: () => api.get('/admin/settings').then(res => res.data),
    updateSetting: (data: any) => api.post('/admin/settings', data).then(res => res.data),
    getHolidays: () => api.get('/admin/holidays').then(res => res.data),
    createHoliday: (data: any) => api.post('/admin/holidays', data).then(res => res.data),
    updateHoliday: ({ id, ...data }: any) => api.put(`/admin/holidays/${id}`, data).then(res => res.data),
    deleteHoliday: (id: string) => api.delete(`/admin/holidays/${id}`).then(res => res.data),
    getNews: (params?: { type?: string; featured?: boolean }) => api.get('/admin/news', { params }).then(res => res.data),
    recordNewsView: (id: string) => api.post(`/admin/news/${id}/view`).then(res => res.data),
    createNews: (data: any) => api.post('/admin/news', data).then(res => res.data),
    updateNews: ({ id, ...data }: any) => api.put(`/admin/news/${id}`, data).then(res => res.data),
    deleteNews: (id: string) => api.delete(`/admin/news/${id}`).then(res => res.data),

    // Users Management
    getAllUsers: () => api.get('/admin/users').then(res => res.data),
    updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data).then(res => res.data),
    updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }).then(res => res.data),
    impersonateUser: (id: string) => api.post(`/admin/users/${id}/impersonate`).then(res => res.data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then(res => res.data),

    // Payment Account Settings
    getPaymentAccountSettings: () => api.get('/admin/payment-settings').then(res => res.data),
    savePaymentAccountSettings: (settings: any) => api.post('/admin/payment-settings', settings).then(res => res.data),

    // Email Settings & Templates
    getEmailSettings: () => api.get('/admin/email/settings').then(res => res.data),
    saveEmailSettings: (data: any) => api.post('/admin/email/settings', data).then(res => res.data),
    testEmailSettings: (data: any) => api.post('/admin/email/test', data).then(res => res.data),
    getEmailTemplates: () => api.get('/admin/email/templates').then(res => res.data),
    createEmailTemplate: (data: any) => api.post('/admin/email/templates', data).then(res => res.data),
    updateEmailTemplate: ({ id, ...data }: any) => api.put(`/admin/email/templates/${id}`, data).then(res => res.data),
    deleteEmailTemplate: (id: string) => api.delete(`/admin/email/templates/${id}`).then(res => res.data),
    resetDefaultEmailTemplates: () => api.post('/admin/email/templates/reset-defaults').then(res => res.data),
    getEmailLogs: () => api.get('/admin/email/logs').then(res => res.data),

    // Zoom Meetings
    getZoomMeetings: () => api.get('/admin/zoom/meetings').then(res => res.data),
    getTeacherMeetings: () => api.get('/admin/zoom/teacher-meetings').then(res => res.data),
    getStudentMeetings: () => api.get('/admin/zoom/student-meetings').then(res => res.data),
    createZoomMeeting: (data: any) => api.post('/admin/zoom/meetings', data).then(res => res.data),
    updateZoomMeeting: ({ id, ...data }: any) => api.put(`/admin/zoom/meetings/${id}`, data).then(res => res.data),
    deleteZoomMeeting: (id: string) => api.delete(`/admin/zoom/meetings/${id}`).then(res => res.data),
    toggleRoomOpen: (id: string, room_open: boolean) => api.post(`/admin/zoom/meetings/${id}/open`, { room_open }).then(res => res.data),
    getMeetingAttendance: (meetingId: string) => api.get(`/admin/zoom/meetings/${meetingId}/attendance`).then(res => res.data),
    updateMeetingAttendance: (data: any) => api.post('/admin/zoom/meetings/attendance', data).then(res => res.data),
};

export const paymentService = {
    getPricing: () => api.get('/payment/pricing').then(res => res.data),
    upsertPricing: (data: any) => api.post('/payment/pricing', data).then(res => res.data),
    getStudentPayments: () => api.get('/payment/student-payments').then(res => res.data),
    getAllPayments: () => api.get('/payment/all-payments').then(res => res.data),
    submitPayment: (data: any) => api.post('/payment/submit', data).then(res => res.data),
    updateStatus: ({ id, ...data }: any) => api.put(`/payment/${id}/status`, data).then(res => res.data),
};

export const testService = {
    getQuestions: () => api.get('/test/questions').then(res => res.data),
    getAllQuestions: () => api.get('/test/all-questions').then(res => res.data),
    getStudentTestResult: () => api.get('/test/result').then(res => res.data),
    createQuestion: (data: any) => api.post('/test/questions', data).then(res => res.data),
    updateQuestion: ({ id, ...data }: any) => api.put(`/test/questions/${id}`, data).then(res => res.data),
    deleteQuestion: (id: string) => api.delete(`/test/questions/${id}`).then(res => res.data),
    submitTest: (data: any) => api.post('/test/submit', data).then(res => res.data),
    getAllResults: () => api.get('/test/all-results').then(res => res.data),
    seedSampleQuestions: () => api.post('/test/seed-samples').then(res => res.data),
};

export const formationService = {
    getFormations: () => api.get('/formation').then(res => res.data),
    getAllFormations: () => api.get('/formation').then(res => res.data),
    getPublishedFormations: () => api.get('/formation/published').then(res => res.data),
    getFormation: (id: string) => api.get(`/formation/${id}`).then(res => res.data),
    createFormation: (data: any) => api.post('/formation', data).then(res => res.data),
    updateFormation: ({ id, ...data }: any) => api.put(`/formation/${id}`, data).then(res => res.data),
    deleteFormation: (id: string) => api.delete(`/formation/${id}`).then(res => res.data),

    getFormationContent: (formationId: string) => api.get(`/formation/${formationId}/content`).then(res => res.data),
    addFormationContent: (data: any) => api.post('/formation/content', data).then(res => res.data),
    updateFormationContent: ({ id, ...data }: any) => api.put(`/formation/content/${id}`, data).then(res => res.data),
    deleteFormationContent: (id: string) => api.delete(`/formation/content/${id}`).then(res => res.data),
    reorderFormationContent: (items: any[]) => api.post('/formation/content/reorder', { items }).then(res => res.data),

    getAllEnrollments: () => api.get('/formation/enrollments/all').then(res => res.data),
    getStudentEnrollments: () => api.get('/formation/enrollments/mine').then(res => res.data),
    updateEnrollmentStatus: ({ id, status }: any) => api.put(`/formation/enrollments/${id}/status`, { status }).then(res => res.data),

    getAllPayments: () => api.get('/formation/payments/all').then(res => res.data),
    updatePaymentStatus: ({ id, ...data }: any) => api.put(`/formation/payments/${id}/status`, data).then(res => res.data),

    getRevenueStats: () => api.get('/formation/stats/revenue').then(res => res.data),
    
    // Student Progress & Payments
    getStudentProgress: (enrollmentId: string) => api.get(`/formation/progress/${enrollmentId}`).then(res => res.data),
    updateStudentProgress: (data: any) => api.post('/formation/progress', data).then(res => res.data),
    submitPayment: (data: any) => api.post('/formation/enroll', data).then(res => res.data),
};

export const chatService = {
    getConversations: () => api.get('/chat/conversations').then(res => res.data),
    getOrCreateDirect: (other_user_id: string) => api.post('/chat/conversations/direct', { other_user_id }).then(res => res.data),
    getOrCreateCohort: (cohort_id: string, name?: string) => api.post('/chat/conversations/cohort', { cohort_id, name }).then(res => res.data),
    getMessages: (conversationId: string) => api.get(`/chat/conversations/${conversationId}/messages`).then(res => res.data),
    sendMessage: (conversationId: string, data: any) => api.post(`/chat/conversations/${conversationId}/messages`, data).then(res => res.data),
    markAsRead: (conversationId: string) => api.post(`/chat/conversations/${conversationId}/read`).then(res => res.data),
    toggleReaction: (messageId: string, emoji: string) => api.post(`/chat/messages/${messageId}/reactions`, { emoji }).then(res => res.data),
    setTyping: (conversationId: string, isTyping: boolean) => api.post(`/chat/conversations/${conversationId}/typing`, { isTyping }).then(res => res.data),
    getTyping: (conversationId: string) => api.get(`/chat/conversations/${conversationId}/typing`).then(res => res.data),
};

export const packageService = {
    getAll: () => api.get('/packages').then(res => res.data),
    getDetails: (id: string) => api.get(`/packages/${id}`).then(res => res.data),
    getMyPackage: () => api.get('/packages/user/my-package').then(res => res.data),
    purchaseOrUpgrade: (data: { packageId: string; paymentMethod?: string; paymentReference?: string }) => 
        api.post('/packages/purchase', data).then(res => res.data),
    assignCourses: (packageId: string, formationIds: string[]) => 
        api.post(`/packages/admin/${packageId}/courses`, { formationIds }).then(res => res.data),
    updatePackage: (id: string, data: any) => 
        api.put(`/packages/admin/${id}`, data).then(res => res.data),
};


export const affiliateService = {
    getWallet: () => api.get('/affiliate/wallet').then(res => res.data),
    requestDeposit: (data: { amount: number; paymentMethod: string; paymentReference?: string; receiptUrl?: string; notes?: string }) => 
        api.post('/affiliate/deposit', data).then(res => res.data),
    getDeposits: () => api.get('/affiliate/deposits').then(res => res.data),
    getPaymentMethods: (mode?: 'deposit' | 'withdrawal') => 
        api.get('/affiliate/payment-methods', { params: { mode } }).then(res => res.data),
    getCommissions: (params?: { generation?: number; limit?: number; offset?: number }) => 
        api.get('/affiliate/commissions', { params }).then(res => res.data),
    requestWithdrawal: (data: { amount: number; paymentMethod: string; paymentDetails: string }) => 
        api.post('/affiliate/withdraw', data).then(res => res.data),
    getWithdrawals: () => api.get('/affiliate/withdrawals').then(res => res.data),
    getPayoutSettings: () => api.get('/affiliate/payout-settings').then(res => res.data),
    updatePayoutSettings: (data: any) => api.post('/affiliate/payout-settings', data).then(res => res.data),
    getTeam: () => api.get('/affiliate/team').then(res => res.data),
    getTeamTree: () => api.get('/affiliate/team-tree').then(res => res.data),
    getRanks: () => api.get('/affiliate/ranks').then(res => res.data),
};

export const adminAffiliateService = {
    getWallets: (params?: { search?: string; filter?: string; sort?: string }) => 
        api.get('/admin/wallets', { params }).then(res => res.data),
    adjustWalletBalance: (data: { userId: string; action: 'credit' | 'debit'; amount: number; note?: string }) => 
        api.post('/admin/wallets/adjust', data).then(res => res.data),
    toggleUserWithdrawal: (data: { userId: string; canWithdraw: boolean }) => 
        api.post('/admin/wallets/toggle-withdrawal', data).then(res => res.data),

    getWithdrawals: (status?: string) => 
        api.get('/admin/withdrawals', { params: { status } }).then(res => res.data),
    approveWithdrawal: (id: string, data?: { transactionProof?: string; notes?: string }) => 
        api.post(`/admin/withdrawals/${id}/approve`, data || {}).then(res => res.data),
    rejectWithdrawal: (id: string, data: { reason: string }) => 
        api.post(`/admin/withdrawals/${id}/reject`, data).then(res => res.data),

    getDeposits: () => api.get('/admin/deposits').then(res => res.data),
    approveDeposit: (id: string) => api.post(`/admin/deposits/${id}/approve`).then(res => res.data),
    rejectDeposit: (id: string, data?: { reason?: string }) => api.post(`/admin/deposits/${id}/reject`, data || {}).then(res => res.data),
    getTransactions: (params?: { search?: string; type?: string; limit?: number; offset?: number }) => 
        api.get('/admin/transactions', { params }).then(res => res.data),
    getTeamTree: () => api.get('/admin/team-tree').then(res => res.data),

    getKyc: (status?: string) => api.get('/admin/kyc', { params: { status } }).then(res => res.data),
    updateKycStatus: (id: string, data: { status: 'verified' | 'rejected'; adminNotes?: string }) => 
        api.post(`/admin/kyc/${id}/status`, data).then(res => res.data),

    getRanks: () => api.get('/admin/ranks').then(res => res.data),
    updateRank: (id: string, data: any) => api.put(`/admin/ranks/${id}`, data).then(res => res.data),
    getRankAchievers: () => api.get('/admin/ranks/achievers').then(res => res.data),

    getGenerationSettings: () => api.get('/admin/generation-settings').then(res => res.data),
    updateGenerationSettings: (data: any) => api.post('/admin/generation-settings', data).then(res => res.data),
};

export const challengeService = {
    getChallenges: () => api.get('/affiliate/challenges').then(res => res.data),
};

export const adminChallengeService = {
    getChallenges: () => api.get('/admin/challenges').then(res => res.data),
    createChallenge: (data: any) => api.post('/admin/challenges', data).then(res => res.data),
    updateChallenge: (id: string, data: any) => api.put(`/admin/challenges/${id}`, data).then(res => res.data),
    deleteChallenge: (id: string) => api.delete(`/admin/challenges/${id}`).then(res => res.data),
    toggleStatus: (id: string) => api.patch(`/admin/challenges/${id}/status`).then(res => res.data),
};

export const adminPaymentService = {
    getPaymentMethods: () => api.get('/admin/payment-methods').then(res => res.data),
    createPaymentMethod: (data: any) => api.post('/admin/payment-methods', data).then(res => res.data),
    updatePaymentMethod: (id: string, data: any) => api.put(`/admin/payment-methods/${id}`, data).then(res => res.data),
    deletePaymentMethod: (id: string) => api.delete(`/admin/payment-methods/${id}`).then(res => res.data),
    toggleStatus: (id: string) => api.patch(`/admin/payment-methods/${id}/status`).then(res => res.data),
    toggleDeposit: (id: string) => api.patch(`/admin/payment-methods/${id}/deposit`).then(res => res.data),
    toggleWithdrawal: (id: string) => api.patch(`/admin/payment-methods/${id}/withdrawal`).then(res => res.data),
};

export const communityService = {
    getPosts: (params?: { channel?: string; sort?: string; page?: number; limit?: number }) => 
        api.get('/community/posts', { params }).then(res => res.data),
    createPost: (data: { channel?: string; title: string; content: string }) => 
        api.post('/community/posts', data).then(res => res.data),
    getComments: (postId: string) => 
        api.get(`/community/posts/${postId}/comments`).then(res => res.data),
    addComment: (postId: string, data: { content: string }) => 
        api.post(`/community/posts/${postId}/comments`, data).then(res => res.data),
    toggleLike: (postId: string) => 
        api.post(`/community/posts/${postId}/like`).then(res => res.data),
    deletePost: (postId: string) => 
        api.delete(`/community/posts/${postId}`).then(res => res.data),
};

export const bonusPoolService = {
    getStudentBonusPools: () => api.get('/bonus-pools/student').then(res => res.data),
};

export const adminBonusPoolService = {
    getPools: () => api.get('/bonus-pools/admin').then(res => res.data),
    createPool: (data: { name: string; name_ar: string; target_rank_id?: string; pool_percentage: number; calculation_basis?: string }) => 
        api.post('/bonus-pools/admin', data).then(res => res.data),
    updatePool: (id: string, data: any) => 
        api.put(`/bonus-pools/admin/${id}`, data).then(res => res.data),
    deletePool: (id: string) => 
        api.delete(`/bonus-pools/admin/${id}`).then(res => res.data),
    previewDistribution: (id: string, params?: { year?: number; month?: number }) => 
        api.get(`/bonus-pools/admin/${id}/preview`, { params }).then(res => res.data),
    executeDistribution: (id: string, data?: { year?: number; month?: number; notes?: string }) => 
        api.post(`/bonus-pools/admin/${id}/execute`, data || {}).then(res => res.data),
    getHistory: (params?: { poolId?: string }) => 
        api.get('/bonus-pools/admin/history', { params }).then(res => res.data),
};

export const founderService = {
    getOverview: () => api.get('/founders/overview').then(res => res.data),
    getMyStatus: () => api.get('/founders/my-status').then(res => res.data),
};

export const adminFounderService = {
    getAdminData: () => api.get('/founders/admin').then(res => res.data),
    updateSettings: (data: any) => api.put('/founders/admin/settings', data).then(res => res.data),
    grantSeat: (data: { userId: string; customSeatNumber?: number; notes?: string }) => 
        api.post('/founders/admin/grant', data).then(res => res.data),
    toggleStatus: (id: string, data: { status?: string; deleteMember?: boolean }) => 
        api.patch(`/founders/admin/members/${id}/status`, data).then(res => res.data),
    previewDistribution: (params?: { year?: number; month?: number }) => 
        api.get('/founders/admin/preview', { params }).then(res => res.data),
    executeDistribution: (data: { periodYear: number; periodMonth: number; notes?: string }) => 
        api.post('/founders/admin/distribute', data).then(res => res.data),
};

export const currencyService = {
    getMyRule: (params?: { country?: string; country_code?: string }) => api.get('/currency/my-rule', { params }).then(res => res.data),
    getAdminRules: () => api.get('/currency/admin/rules').then(res => res.data),
    createAdminRule: (data: any) => api.post('/currency/admin/rules', data).then(res => res.data),
    updateAdminRule: (countryCode: string, data: any) => api.put(`/currency/admin/rules/${countryCode}`, data).then(res => res.data),
    getAdminAuditLogs: (params?: { page?: number; limit?: number }) => api.get('/currency/admin/audit-logs', { params }).then(res => res.data),
};

export const supportService = {
    // Member methods
    getTickets: (params?: { status?: string; category?: string }) => 
        api.get('/support/tickets', { params }).then(res => res.data),
    createTicket: (data: { subject: string; category: string; priority: string; message: string }) => 
        api.post('/support/tickets', data).then(res => res.data),
    getTicketDetails: (id: string) => 
        api.get(`/support/tickets/${id}`).then(res => res.data),
    addMessage: (id: string, data: { message: string; status?: string }) => 
        api.post(`/support/tickets/${id}/messages`, data).then(res => res.data),
    closeTicket: (id: string) => 
        api.put(`/support/tickets/${id}/close`).then(res => res.data),
    aiChat: (data: { message: string; history?: Array<{ role: string; content: string }> }) => 
        api.post('/support/ai-chat', data).then(res => res.data),

    // Admin methods
    adminGetTickets: (params?: { status?: string; priority?: string; category?: string; search?: string; page?: number; limit?: number }) => 
        api.get('/support/admin/tickets', { params }).then(res => res.data),
    adminGetStats: () => 
        api.get('/support/admin/stats').then(res => res.data),
    adminUpdateStatus: (id: string, status: string) => 
        api.put(`/support/admin/tickets/${id}/status`, { status }).then(res => res.data),
    adminUpdatePriority: (id: string, priority: string) => 
        api.put(`/support/admin/tickets/${id}/priority`, { priority }).then(res => res.data),
};

export const promisedPackageService = {
    getPromisedPackages: (params?: { search?: string; type?: string; status?: string }) =>
        api.get('/admin/promised-packages', { params }).then(res => res.data),
    grantPackage: (data: { user_id: string; package_id: string; package_type: string; notes?: string }) =>
        api.post('/admin/promised-packages/grant', data).then(res => res.data),
    revokePackage: (id: string) =>
        api.put(`/admin/promised-packages/${id}/revoke`).then(res => res.data),
    deletePromisedPackage: (id: string) =>
        api.delete(`/admin/promised-packages/${id}`).then(res => res.data),
};






