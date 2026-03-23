import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <span className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </span>
        <span>{t('nav.feed')}</span>
      </NavLink>

      <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" opacity="0.5" />
            <circle cx="12" cy="12" r="11" opacity="0.2" />
          </svg>
        </span>
        <span>{t('nav.map')}</span>
      </NavLink>

      <NavLink to="/create" className={({ isActive }) => `nav-item nav-item-create ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </span>
        <span>{t('nav.profile')}</span>
      </NavLink>
    </nav>
  );
}
