import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/Layout/LanguageToggle';
import { SecretFeed } from '../components/Feed/SecretFeed';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSecrets } from '../hooks/useSecrets';

export function FeedPage() {
  const { t } = useTranslation();
  const { position, error: geoError, loading: geoLoading, retry } = useGeolocation();
  const { secrets, loading: secretsLoading } = useSecrets(position);

  if (geoError === 'PERMISSION_DENIED') {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{t('feed.title')}</h1>
          <LanguageToggle />
        </div>
        <div className="empty-state" style={{ flex: 1 }}>
          <span className="empty-state-icon">📍</span>
          <p>{t('common.locationDenied')}</p>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', maxWidth: '300px', textAlign: 'center', lineHeight: 1.6 }}>
            {t('common.locationInstructions')}
          </p>
          <button className="btn btn-primary" onClick={() => {
            // Try requesting permission again
            navigator.geolocation.getCurrentPosition(
              () => window.location.reload(),
              () => window.location.reload()
            );
          }}>
            {t('common.enableLocation')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" id="feed-page">
      <div className="page-header">
        <h1 className="page-title">{t('feed.title')}</h1>
        <LanguageToggle />
      </div>
      <div className="page-content">
        <SecretFeed
          secrets={secrets}
          position={position}
          loading={geoLoading || secretsLoading}
        />
      </div>
    </div>
  );
}
