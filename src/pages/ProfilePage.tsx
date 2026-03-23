import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/Layout/LanguageToggle';
import { UserProfile } from '../components/Profile/UserProfile';

export function ProfilePage() {
  const { t } = useTranslation();

  return (
    <div className="page" id="profile-page-wrapper">
      <div className="page-header">
        <h1 className="page-title">{t('profile.title')}</h1>
        <LanguageToggle />
      </div>
      <div className="page-content">
        <UserProfile />
      </div>
    </div>
  );
}
