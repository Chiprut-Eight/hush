import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/Layout/LanguageToggle';
import { CreateSecret } from '../components/Create/CreateSecret';

export function CreatePage() {
  const { t } = useTranslation();

  return (
    <div className="page" id="create-page">
      <div className="page-header">
        <h1 className="page-title">{t('create.title')}</h1>
        <LanguageToggle />
      </div>
      <div className="page-content">
        <CreateSecret />
      </div>
    </div>
  );
}
