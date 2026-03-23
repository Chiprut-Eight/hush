import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/Layout/LanguageToggle';
import { EchoMap } from '../components/Map/EchoMap';

export function MapPage() {
  const { t } = useTranslation();

  return (
    <div className="page" id="map-page">
      <div className="page-header">
        <h1 className="page-title">{t('map.title')}</h1>
        <LanguageToggle />
      </div>
      <div className="map-wrapper">
        <EchoMap />
      </div>
    </div>
  );
}
