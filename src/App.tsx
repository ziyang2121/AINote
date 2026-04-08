import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import type { ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const TodoPage = lazy(() => import('@/pages/Todo'));
const LearningPage = lazy(() => import('@/pages/Learning'));
const NotesPage = lazy(() => import('@/pages/Notes'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
    <Spin size="large" />
  </div>
);

const modernTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#0d9488',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#0ea5e9',
    borderRadius: 10,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    controlHeight: 38,
    fontSize: 14,
  },
  components: {
    Card: {
      borderRadiusLG: 14,
      paddingLG: 20,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Modal: {
      borderRadiusLG: 14,
    },
    Segmented: {
      borderRadius: 8,
      itemSelectedBg: '#0d9488',
      itemSelectedColor: '#ffffff',
    },
    Progress: {
      defaultColor: '#0d9488',
    },
  },
};

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={modernTheme}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
            <Route path="/todo" element={<Suspense fallback={<PageLoader />}><TodoPage /></Suspense>} />
            <Route path="/learning" element={<Suspense fallback={<PageLoader />}><LearningPage /></Suspense>} />
            <Route path="/notes" element={<Suspense fallback={<PageLoader />}><NotesPage /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
