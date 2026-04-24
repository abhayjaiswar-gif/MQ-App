const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main',
  component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
  children: [
    {
      name: 'UserFeedback',
      path: '/helpdesk/feedback',
      component: () => import('../views/helpdesk/UserFeedback.vue')
    },
    {
      name: 'LandingPage',
      path: '/',
      component: () => import('@/views/dashboard/DefaultDashboard.vue')
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      component: () => import('@/views/dashboard/DefaultDashboard.vue')
    },
    /*
    {
      name: 'Typography',
      path: '/typography',
      component: () => import('@/views/typography/TypographyPage.vue')
    },
    {
      name: 'SchoolAssignments',
      path: '/school/assignments',
      component: () => import('@/views/school/SchoolAssignmentPage.vue')
    },
    {
      title: 'Gallery',
      path: '/colors',
      component: () => import('@/views/colors/ColorPage.vue')
    },
    {
      name: 'Shadow',
      path: '/shadow',
      component: () => import('@/views/shadows/ShadowPage.vue')
    },
    {
      name: 'Color',
      path: '/icon/ant',
      component: () => import('@/views/icons/AntDesignIcons.vue')
    },
    {
      name: 'other',
      path: '/sample-page',
      component: () => import('@/views/StarterPage.vue')
    },
    */
    {
      name: 'Stock',
      path: '/stock',
      component: () => import('@/views/stock/StockPage.vue')
    },
    {
      name: 'ApproveStock',
      path: '/stock/approve',
      component: () => import('@/views/stock/ApproveStockDetail.vue')
    },
    {
      name: 'StudentsList',
      path: '/student',
      component: () => import('@/views/student/StudentsListPage.vue')
    },
    {
      name: 'AddStudent',
      path: '/student/add',
      component: () => import('@/views/student/AddStudentPage.vue')
    },
    {
      name: 'UploadStudents',
      path: '/student/upload',
      component: () => import('@/views/student/UploadStudentsPage.vue')
    },
    {
      name: 'SchoolList',
      path: '/school',
      component: () => import('@/views/school/SchoolListPage.vue')
    },
    {
      name: 'AddSchool',
      path: '/school/add',
      component: () => import('@/views/school/AddSchoolPage.vue')
    },
    {
      name: 'AddSchool',
      path: '/school/add',
      component: () => import('@/views/school/AddSchoolPage.vue')
    },
    {
      name: 'SchoolEdit',
      path: '/school/edit/:id',
      component: () => import('@/views/school/EditSchoolPage.vue')
    },
    {
      name: 'SchoolAssignments',
      path: '/school/assignments',
      component: () => import('@/views/school/SchoolAssignmentPage.vue')
    },
    {
      name: 'UserManagement',
      path: '/management/users',
      component: () => import('@/views/user/UserManagementPage.vue')
    },
    {
      name: 'StaffHierarchy',
      path: '/staff/hierarchy',
      component: () => import('@/views/staff/StaffHierarchyPage.vue')
    },
    {
      name: 'CreateUser',
      path: '/management/users/create',
      component: () => import('@/views/user/CreateUserPage.vue')
    },
    {
      name: 'EditUser',
      path: '/management/users/edit/:id',
      component: () => import('@/views/user/EditUserPage.vue')
    },
    {
      name: 'SchoolGallery',
      path: '/school/gallery',
      component: () => import('@/views/school/SchoolGalleryPage.vue')
    },
    {
      name: 'SchoolGalleryDetail',
      path: '/school/gallery/:id',
      component: () => import('@/views/school/SchoolGalleryDetailPage.vue')
    },
    {
      name: 'MatchReport',
      path: '/reports/match',
      component: () => import('@/views/reports/MatchReportPage.vue')
    },
    {
      name: 'MIRReport',
      path: '/reports/mir',
      component: () => import('@/views/reports/MIRReportPage.vue')
    },
    {
      name: 'ParentsReport',
      path: '/reports/parents',
      component: () => import('@/views/reports/ParentsReportPage.vue')
    },
    {
      name: 'Exams',
      path: '/exams',
      component: () => import('@/views/exams/ExamsPage.vue')
    },
    {
      name: 'ExamManagement',
      path: '/exams/all',
      component: () => import('@/views/exams/ExamManagementPage.vue')
    },
    {
      name: 'CreateExam',
      path: '/exams/create',
      component: () => import('@/views/exams/CreateTestPage.vue')
    },
    {
      name: 'EditExam',
      path: '/exams/edit/:id',
      component: () => import('@/views/exams/CreateTestPage.vue')
    },
    {
      name: 'FillMarks',
      path: '/exams/fill-marks',
      component: () => import('@/views/exams/FillMarksPage.vue')
    },
    {
      name: 'ReportCard',
      path: '/reports/report-card',
      component: () => import('@/views/reports/ReportCardPage.vue')
    },
    {
      name: 'AssignCurriculum',
      path: '/curriculum/assign',
      component: () => import('@/views/curriculum/AssignCurriculumPage.vue')
    },
    {
      name: 'AddCurriculum',
      path: '/curriculum/add',
      component: () => import('@/views/curriculum/AddCurriculumPage.vue')
    },
    {
      name: 'MyCurriculum',
      path: '/curriculum/my',
      component: () => import('@/views/curriculum/MyCurriculumPage.vue')
    },
    {
      name: 'LPMasterData',
      path: '/curriculum/master',
      component: () => import('@/views/curriculum/LPMasterDataPage.vue')
    },
    {
      name: 'AssignedLP',
      path: '/curriculum/assigned',
      component: () => import('@/views/curriculum/AssignedLPPage.vue')
    },
    {
      name: 'SocialMediaManager',
      path: '/dashboard/manage-social',
      component: () => import('@/views/dashboard/SocialMediaManager.vue')
    },
    {
      name: 'WeeklyTracker',
      path: '/curriculum/tracker',
      component: () => import('../views/curriculum/WeeklyTrackerPage.vue')
    },
    {
      name: 'CurriculumBuilder',
      path: '/curriculum/builder',
      component: () => import('@/views/curriculum/SelectCurriculumPage.vue')
    },
    {
      name: 'ScheduleLesson',
      path: '/curriculum/schedule',
      component: () => import('@/views/curriculum/ScheduleLessonPage.vue')
    },
    {
      name: 'WeeklyReport',
      path: '/curriculum/weekly-report',
      component: () => import('../views/curriculum/WeeklyReportPage.vue')
    },
    {
      name: 'PrincipalReport',
      path: '/curriculum/principal-report',
      component: () => import('@/views/curriculum/PrincipalWeeklyReportPage.vue')
    },
    {
      name: 'AccessManagement',
      path: '/management/access',
      component: () => import('@/views/management/AccessManagementPage.vue')
    },
    {
      name: 'ManageHighlights',
      path: '/manage-highlights',
      component: () => import('@/views/dashboard/ManageHighlightsPage.vue')
    },
    {
      name: 'HelpdeskDashboard',
      path: '/helpdesk/tickets',
      component: () => import('@/views/helpdesk/HelpdeskDashboard.vue')
    },
    {
      name: 'EscalationRules',
      path: '/helpdesk/rules',
      component: () => import('@/views/helpdesk/EscalationRules.vue')
    },
    {
      name: 'TeamManagement',
      path: '/management/teams',
      component: () => import('@/views/management/TeamManagementPage.vue')
    },
    {
      name: 'UserHierarchy',
      path: '/management/hierarchy',
      component: () => import('@/views/management/UserHierarchyPage.vue')
    },
    {
      name: 'SubordinateActivity',
      path: '/management/subordinate-activity',
      component: () => import('@/views/management/SubordinateActivityPage.vue')
    },
    {
      name: 'PTMLockManagement',
      path: '/management/ptm-locks',
      component: () => import('@/views/management/PTMLockManagementPage.vue')
    },
    {
      name: 'AddTeam',
      path: '/management/teams/add',
      component: () => import('@/views/management/AddTeamPage.vue')
    },
    {
      name: 'MarkLecture',
      path: '/management/lectures/mark',
      component: () => import('@/views/management/MarkLecturePage.vue')
    },
    {
      name: 'AOPDashboard',
      path: '/management/aop-tracking',
      component: () => import('../views/management/AOPDashboard.vue')
    }
  ]
};

export default MainRoutes;
