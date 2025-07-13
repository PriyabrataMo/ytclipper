import { Route, Routes } from 'react-router';

import Loading from './components/loading';
import { NotificationSystem } from './components/NotificationSystem';
import { ProtectedRoute } from './components/protected-route';
import { useAuth } from './hooks/useAuth';
import {
  DashboardPage,
  HomePage,
  LoginPage,
  ProfilePage,
  VideoDetailPage,
  VideosPage,
} from './pages';

const App = () => {
  const { isInitialized } = useAuth();

  if (!isInitialized) {
    return <Loading />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/auth' element={<LoginPage />} />

        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/videos'
          element={
            <ProtectedRoute>
              <VideosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/videos/:id'
          element={
            <ProtectedRoute>
              <VideoDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <NotificationSystem />
    </div>
  );
};

export default App;
