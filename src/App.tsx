import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AppShell } from './components/Layout/AppShell';
import { AuthGuard } from './components/Auth/AuthGuard';
import { LoginPage } from './components/Auth/LoginPage';
import { FeedPage } from './pages/FeedPage';
import { MapPage } from './pages/MapPage';
import { CreatePage } from './pages/CreatePage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route path="/" element={<FeedPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
