import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { useThemeEffect } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { TemplateEditPage } from '@/pages/TemplateEditPage';
import { SessionPage } from '@/pages/SessionPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SessionDetailPage } from '@/pages/SessionDetailPage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  useThemeEffect();

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/modeles" element={<TemplatesPage />} />
        <Route path="/modeles/:id" element={<TemplateEditPage />} />
        <Route path="/seance" element={<SessionPage />} />
        <Route path="/historique" element={<HistoryPage />} />
        <Route path="/historique/:id" element={<SessionDetailPage />} />
        <Route path="/exercices" element={<CatalogPage />} />
        <Route path="/exercices/:id" element={<ExerciseDetailPage />} />
        <Route path="/progression" element={<ProgressPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
