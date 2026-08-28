import { Route, Routes } from 'react-router-dom';
import { RequireAuth, RequirePermission, RequireProjectPermission, RequirePsychologistProfile, VerifyEmailPage } from '../components/auth/RouteGuards';
import { AppLayout } from '../components/layout/AppLayout';
import { ProfessionalLayout } from '../components/layout/ProfessionalLayout';
import { AdminPage } from '../pages/AdminPage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { DirectoryPage } from '../pages/DirectoryPage';
import { HistoryPage } from '../pages/HistoryPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlansPage } from '../pages/PlansPage';
import { ProfessionalReviewPage } from '../pages/ProfessionalReviewPage';
import { InstrumentBuilderPage, InstrumentProjectPage, NewInstrumentPage, ProfessionalDashboardPage, ProfessionalInstrumentsPage, ProfessionalReviewCatalogPage, ProfessionalStubPage } from '../pages/ProfessionalPages';
import { ProfilePage } from '../pages/ProfilePage';
import { ResultPage } from '../pages/ResultPage';
import { TestCatalogPage } from '../pages/TestCatalogPage';
import { TestRunnerPage } from '../pages/TestRunnerPage';

export function App() {
  return <Routes><Route element={<AppLayout />}>
    <Route index element={<HomePage />} /><Route path="login" element={<LoginPage />} /><Route path="verify-email" element={<VerifyEmailPage />} />
    <Route path="tests" element={<TestCatalogPage />} /><Route path="tests/:testId" element={<TestRunnerPage />} /><Route path="results/:resultId" element={<ResultPage />} />
    <Route path="psychologists" element={<DirectoryPage />} /><Route path="plans" element={<PlansPage />} />
    <Route element={<RequireAuth />}><Route path="history" element={<HistoryPage />} /><Route path="profile" element={<ProfilePage />} /><Route path="appointments" element={<AppointmentsPage />} /></Route>
    <Route path="professional" element={<ProfessionalLayout />}>
      <Route element={<RequirePsychologistProfile />}>
        <Route index element={<ProfessionalDashboardPage />} /><Route path="instruments" element={<ProfessionalInstrumentsPage />} /><Route path="instruments/new" element={<NewInstrumentPage />} />
        <Route element={<RequireProjectPermission permission="read" />}><Route path="instruments/:instrumentId" element={<InstrumentProjectPage />} /><Route path="instruments/:instrumentId/builder" element={<InstrumentBuilderPage />} /><Route path="instruments/:instrumentId/preview" element={<InstrumentProjectPage mode="preview" />} /><Route path="instruments/:instrumentId/scoring" element={<InstrumentProjectPage mode="scoring" />} /><Route path="instruments/:instrumentId/translations" element={<InstrumentProjectPage mode="translations" />} /><Route path="instruments/:instrumentId/validation" element={<InstrumentProjectPage mode="validation" />} /><Route path="instruments/:instrumentId/versions" element={<InstrumentProjectPage mode="versions" />} /><Route path="instruments/:instrumentId/changes" element={<InstrumentProjectPage mode="changes" />} /></Route>
        <Route path="reviews" element={<ProfessionalStubPage title="Mis revisiones" text="Los comentarios y decisiones se conservan por proyecto y objetivo técnico." />} /><Route path="collaborations" element={<ProfessionalStubPage title="Colaboraciones" text="Los permisos se asignan por proyecto, nunca como claims globales." />} /><Route path="changes" element={<ProfessionalStubPage title="Versiones y cambios" text="Cada cambio sobre una versión publicada comienza como propuesta." />} /><Route path="validation" element={<ProfessionalStubPage title="Casos de validación" text="Abre un proyecto para ejecutar y revisar su suite." />} /><Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route element={<RequireProjectPermission permission="read" />}><Route path="instruments/:instrumentId/reviews" element={<InstrumentProjectPage mode="reviews" />} /></Route>
      <Route element={<RequirePermission anyOf={['owner', 'admin', 'professional_reviewer']} requiresAppCheck />}><Route path="review" element={<ProfessionalReviewCatalogPage />} /></Route>
    </Route>
    <Route element={<RequirePermission anyOf={['owner', 'admin', 'professional_reviewer']} requiresAppCheck />}><Route path="professional-review" element={<ProfessionalReviewPage />} /></Route>
    <Route element={<RequirePermission anyOf={['owner', 'admin']} requiresAppCheck />}><Route path="admin" element={<AdminPage />} /></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}
