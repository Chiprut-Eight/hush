import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggle = () => {
    const newLang = currentLang === 'he' ? 'en' : 'he';
    setLanguage(newLang);
  };

  return (
    <button className="lang-toggle" onClick={toggle} id="language-toggle">
      <span>{currentLang === 'he' ? '🇬🇧 EN' : '🇮🇱 עב'}</span>
    </button>
  );
}
