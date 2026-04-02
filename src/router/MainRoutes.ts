const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main',
  component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
  children: [
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
    }
  ]
};

export default MainRoutes;
