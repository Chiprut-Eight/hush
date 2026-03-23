import { LanguageToggle } from '../components/Layout/LanguageToggle';
import { AdminPanel } from '../components/Admin/AdminPanel';
import { useTranslation } from 'react-i18next';

export function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="page" id="admin-page">
      <div className="page-header">
        <h1 className="page-title">{t('admin.title')}</h1>
        <LanguageToggle />
      </div>
      <div className="page-content">
        <AdminPanel />
      </div>
    </div>
  );
}
