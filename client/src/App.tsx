import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import PersonalizedPathPage from './pages/PersonalizedPath';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import ModuleDetail from './pages/ModuleDetail';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="course-detail" element={<CourseDetail />} />
            <Route path="path/:pathId" element={<PersonalizedPathPage />} />
            <Route path="path/:userId/:pathId" element={<PersonalizedPathPage />} />
            <Route path="path/:pathId/module/:moduleId" element={<ModuleDetail />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
