// icons
import {
  QuestionOutlined,
  DashboardOutlined,
  ChromeOutlined,
  LoginOutlined,
  ProfileOutlined,
  FontSizeOutlined,
  BgColorsOutlined,
  BarcodeOutlined,
  CrownOutlined,
  LineChartOutlined,
  CheckSquareOutlined,
  BankOutlined,
  PictureOutlined,
  FilePdfOutlined,
  TeamOutlined,
  UserOutlined
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
  { header: 'Navigation' },
  {
    title: 'Dashboard',
    icon: DashboardOutlined,
    to: '/dashboard'
  },
  {
    title: 'School',
    icon: BankOutlined,
    to: '/school'
  },
  {
    title: 'School Assign',
    icon: TeamOutlined,
    to: '/school/assignments'
  },
  {
    title: 'User Management',
    icon: UserOutlined,
    to: '/management/users'
  },
  {
    title: 'Gallery',
    icon: PictureOutlined,
    to: '/school/gallery'
  },
  {
    title: 'Match Report',
    icon: FilePdfOutlined,
    to: '/reports/match'
  },
  {
    title: 'Parents Report Card',
    icon: TeamOutlined,
    to: '/reports/parents'
  }
];

export default sidebarItem;
