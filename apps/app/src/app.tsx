import { Route, Routes } from 'react-router';

import { AuthRouteGuard, ProtectedRouteGuard } from '@/components/guards';
import { AppLayout } from '@/components/layout';
import {
  DashboardPage,
  ErrorPage,
  ForgotPasswordPage,
  HomePage,
  NotFoundPage,
  PricingPage,
  ProfilePage,
  TimestampsPage,
  VideosPage,
} from '@/pages';
import { Helmet } from '@dr.pogodin/react-helmet';
import { EmailVerificationPage } from './pages/email-verification';
import { GoogleCallback } from './pages/google-callback';
import { AuthRoutes } from './routes';

const App = () => {
  // useEffect(() => {
  //   if (isInitialized) {
  //     syncAuthState(isAuthenticated, user)
  //       .then((result) => {
  //         if (result.success) {
  //           console.log('✅ App-level extension sync successful');
  //         } else {
  //           console.warn('❌ App-level extension sync failed:', result.error);
  //         }
  //       })
  //       .catch((error) => {
  //         console.warn('❌ App-level extension sync error:', error);
  //       });
  //   }
  // }, [isInitialized, isAuthenticated, user, token, tokenExpiry]);
  //
  // useEffect(() => {
  //   if (isInitialized && isAuthenticated && !token) {
  //     const cleanup = setupTokenRefresh();
  //     return cleanup;
  //   }
  //   return undefined;
  // }, [isInitialized, isAuthenticated, token]);
  //
  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     if (event.source !== window) {
  //       return;
  //     }
  //     if (event.data.type === 'CHECK_AUTH_STATUS') {
  //       syncAuthState(isAuthenticated, user).catch(console.warn);
  //     }
  //   };
  //
  //   window.addEventListener('message', handleMessage);
  //   return () => window.removeEventListener('message', handleMessage);
  // }, [user, isAuthenticated, tokenExpiry, token]);
  //
  // if (!isInitialized) {
  //   return <Loading />;
  // }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>YTClipper</title>
        <meta
          name='description'
          content='Your YouTube video timestamping tool'
        />
        <link rel='icon' href='/favicon.ico' />
      </Helmet>
      <Routes>
        <Route
          path='/'
          element={
            <AuthRouteGuard>
              <HomePage />
            </AuthRouteGuard>
          }
        />
        <Route
          path='/*'
          element={
            <AuthRouteGuard>
              <AuthRoutes />
            </AuthRouteGuard>
          }
        />
        <Route path='/auth/callback' element={<GoogleCallback />} />
        <Route path='/auth/forgot-password' element={<ForgotPasswordPage />} />
        <Route
          path='/auth/email-verification'
          element={<EmailVerificationPage />}
        />

        <Route
          element={
            <ProtectedRouteGuard>
              <AppLayout />
            </ProtectedRouteGuard>
          }
        >
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/profile' element={<ProfilePage />} />
          <Route
            path='/email-verification'
            element={<EmailVerificationPage />}
          />
          <Route path='/videos' element={<VideosPage />} />
          <Route path='/pricing' element={<PricingPage />} />
          <Route path='/timestamps/:videoId' element={<TimestampsPage />} />
        </Route>
        <Route path='/error' element={<ErrorPage />} />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default App;
