import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ResultPage } from '../pages/ResultPage';
import { TestCatalogPage } from '../pages/TestCatalogPage';
import { TestRunnerPage } from '../pages/TestRunnerPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="tests" element={<TestCatalogPage />} />
        <Route path="tests/:testId" element={<TestRunnerPage />} />
        <Route path="results/:resultId" element={<ResultPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
