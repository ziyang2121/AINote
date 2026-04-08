import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-layout';
import {
  CheckSquareOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
  SettingOutlined,
} from '@ant-design/icons';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ProLayout
      title="智能待办"
      logo={null}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      location={{ pathname: location.pathname }}
      layout="mix"
      fixSiderbar
      fixedHeader
      navTheme="light"
      token={{
        header: {
          colorBgHeader: '#ffffff',
          colorHeaderTitle: '#1e293b',
          colorTextMenu: '#64748b',
          colorTextMenuSelected: '#0d9488',
          colorTextMenuSecondary: '#94a3b8',
        },
        sider: {
          colorMenuBackground: '#ffffff',
          colorTextMenu: '#475569',
          colorTextMenuSelected: '#0d9488',
          colorBgMenuItemActive: '#f0fdfa',
          colorMenuItemDivider: '#f1f5f9',
        },
        pageContainer: {
          paddingBlockPageContainerContent: 24,
          paddingInlinePageContainerContent: 32,
        },
      }}
      menuItemRender={(item, dom) => (
        <span
          onClick={() => navigate(item.path || '/')}
          style={{ borderRadius: 8, transition: 'all 0.2s' }}
        >
          {dom}
        </span>
      )}
      menu={{
        request: async () => [
          {
            path: '/',
            name: '首页',
            icon: <HomeOutlined />,
          },
          {
            path: '/todo',
            name: '待办事项',
            icon: <CheckSquareOutlined />,
          },
          {
            path: '/learning',
            name: '学习计划',
            icon: <BookOutlined />,
          },
          {
            path: '/notes',
            name: '笔记',
            icon: <FileTextOutlined />,
          },
          {
            path: '/settings',
            name: '设置',
            icon: <SettingOutlined />,
          },
        ],
      }}
    >
      <Outlet />
    </ProLayout>
  );
}
