// icons
import {
  DashboardOutlined,
  BankOutlined,
  PictureOutlined,
  FilePdfOutlined,
  TeamOutlined,
  UserOutlined,
  IdcardOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  BookOutlined
} from '@ant-design/icons-vue';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  { header: 'Overview' },
  {
    title: 'Dashboard',
    icon: DashboardOutlined,
    to: '/dashboard'
  },
  
  { header: 'Administration' },
  {
    title: 'School Management',
    icon: BankOutlined,
    children: [
      {
        title: 'School List',
        to: '/school'
      },
      {
        title: 'School Assignments',
        to: '/school/assignments'
      },
      {
        title: 'Gallery',
        to: '/school/gallery'
      }
    ]
  },
  {
    title: 'User Management',
    icon: UserOutlined,
    children: [
      {
        title: 'User Directory',
        to: '/management/users'
      }
    ]
  },
  
  { header: 'Admissions' },
  {
    title: 'Student Hub',
    icon: IdcardOutlined,
    children: [
      {
        title: 'Student Directory',
        to: '/student'
      }
    ]
  },
  
  { header: 'Academics' },
  {
    title: 'Exams',
    icon: FilePdfOutlined,
    children: [
      {
        title: 'Parameters Dashboard',
        to: '/exams'
      },
      {
        title: 'Fill Marks',
        to: '/exams/fill-marks'
      }
    ]
  },
  {
    title: 'Curricula',
    icon: BookOutlined,
    children: [
      {
        title: 'Assign Curriculum',
        to: '/curriculum/assign'
      },
      {
        title: 'Add Curriculum',
        to: '/curriculum/add'
      },
      {
        title: 'My Curriculums',
        to: '/curriculum/my'
      }
    ]
  },
  
  { header: 'Operations' },
  {
    title: 'Inventory',
    icon: ShopOutlined,
    children: [
      {
        title: 'Stock Management',
        to: '/stock'
      },
      {
        title: 'Approve Orders',
        to: '/stock/approve'
      }
    ]
  },
  {
    title: 'Reports',
    icon: FilePdfOutlined,
    children: [
      {
        title: 'Match Report',
        to: '/reports/match'
      },
      {
        title: 'Parents Report Card',
        to: '/reports/parents'
      },
      {
        title: 'Report Card Generation',
        to: '/reports/report-card'
      }
    ]
  }
];

export default sidebarItem;
