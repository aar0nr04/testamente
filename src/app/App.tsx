import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RequireAuth, RequirePermission, VerifyEmailPage } from '../components/auth/RouteGuards';
import { AdminPage } from '../pages/AdminPage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { DirectoryPage } from '../pages/DirectoryPage';
import { HistoryPage } from '../pages/HistoryPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlansPage } from '../pages/PlansPage';
import { ProfessionalReviewPage } from '../pages/ProfessionalReviewPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ResultPage } from '../pages/ResultPage';
import { TestCatalogPage } from '../pages/TestCatalogPage';
import { TestRunnerPage } from '../pages/TestRunnerPage';

export function App() {
  return <Routes><Route element={<AppLayout />}>
    <Route index element={<HomePage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="verify-email" element={<VerifyEmailPage />} />
    <Route path="tests" element={<TestCatalogPage />} />
    <Route path="tests/:testId" element={<TestRunnerPage />} />
    <Route path="results/:resultId" element={<ResultPage />} />
    <Route path="psychologists" element={<DirectoryPage />} />
    <Route path="plans" element={<PlansPage />} />
    <Route element={<RequireAuth />}>
      <Route path="history" element={<HistoryPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="appointments" element={<AppointmentsPage />} />
    </Route>
    <Route element={<RequirePermission anyOf={['owner', 'admin', 'professional_reviewer']} requiresAppCheck />}>
      <Route path="professional-review" element={<ProfessionalReviewPage />} />
    </Route>
    <Route element={<RequirePermission anyOf={['owner', 'admin']} requiresAppCheck />}>
      <Route path="admin" element={<AdminPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}
