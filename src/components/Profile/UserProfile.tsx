import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getUserSecrets, getSavedSecrets, type Secret } from '../../services/secretService';
import { signOut } from '../../services/authService';
import { getTierByLevel } from '../../config/tiers';
import { requestNotificationPermission } from '../../services/notificationService';

export function UserProfile() {
  const { t } = useTranslation();
  const { hushUser, firebaseUser } = useAuth();
  const [mySecrets, setMySecrets] = useState<Secret[]>([]);
  const [savedSecrets, setSavedSecrets] = useState<Secret[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hushUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [userSecrets, saved] = await Promise.all([
          getUserSecrets(hushUser.uid),
          getSavedSecrets(hushUser.savedSecretIds || []),
        ]);
        setMySecrets(userSecrets);
        setSavedSecrets(saved);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hushUser]);

  if (!hushUser || !firebaseUser) return null;

  const tier = getTierByLevel(hushUser.tierLevel);
  const mySavedSecrets = savedSecrets.filter((s) => s.creatorId === hushUser.uid);
  const otherSavedSecrets = savedSecrets.filter((s) => s.creatorId !== hushUser.uid);

  return (
    <div className="profile-page" id="profile-page">
      {/* Ghost Mode Banner */}
      {hushUser.isGhostMode && hushUser.ghostModeUntil && (
        <div className="ghost-banner">
          <p className="ghost-banner-title">👻 {t('profile.ghostMode')}</p>
          <p>{t('profile.ghostModeDesc', { date: hushUser.ghostModeUntil.toLocaleDateString() })}</p>
          <button className="btn btn-secondary" style={{ marginTop: 'var(--space-sm)' }}>
            {t('profile.appeal')}
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        {firebaseUser.photoURL && (
          <img
            src={firebaseUser.photoURL}
            alt={firebaseUser.displayName || ''}
            className="profile-avatar"
            referrerPolicy="no-referrer"
          />
        )}
        <h2 className="profile-name">{firebaseUser.displayName}</h2>
        <div
          className="profile-tier"
          style={{ borderColor: tier.color, color: tier.color }}
        >
          <span style={{ fontSize: 'var(--font-lg)' }}>
            {tier.level === 10 ? '👑' : '⭐'}
          </span>
          {t('profile.tier', { level: tier.level })} — {tier.nameEn}
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-value">{hushUser.totalPublished}</span>
          <span className="stat-label">{t('profile.secrets')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{hushUser.distinguishedCount}</span>
          <span className="stat-label">{t('profile.distinguished')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{hushUser.savedSecretIds?.length || 0}</span>
          <span className="stat-label">{t('profile.savedSecrets')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="create-tabs" style={{ margin: 'var(--space-md)' }}>
        <button
          className={`create-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          {t('profile.mySecrets')}
        </button>
        <button
          className={`create-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          {t('profile.otherSecrets')}
        </button>
      </div>

      {/* Secrets List */}
      <div className="profile-section">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {activeTab === 'my' && (
              <>
                {[...mySavedSecrets, ...mySecrets.filter(s => !mySavedSecrets.find(ms => ms.id === s.id))].length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">📝</span>
                    <p>{t('profile.noSecrets')}</p>
                  </div>
                ) : (
                  <div>
                    {[...mySavedSecrets, ...mySecrets.filter(s => !mySavedSecrets.find(ms => ms.id === s.id))].map((secret) => (
                      <div key={secret.id} className="glass-card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                          <span className="secret-type-badge">
                            {secret.type === 'group' ? '🔐' : '🤫'}
                            {secret.contentType === 'text' ? ' ✍️' : ' 🎙️'}
                          </span>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            {secret.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        {secret.contentType === 'text' && (
                          <p style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--space-sm)' }}>
                            {secret.textContent}
                          </p>
                        )}
                        {secret.contentType === 'voice' && (
                          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                            🎵 {secret.audioDuration}s
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                          <span>❤️ {secret.likes}</span>
                          <span>👂 {secret.listens}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {activeTab === 'saved' && (
              <>
                {otherSavedSecrets.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">🔖</span>
                    <p>{t('profile.noSecrets')}</p>
                  </div>
                ) : (
                  <div>
                    {otherSavedSecrets.map((secret) => (
                      <div key={secret.id} className="glass-card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                            {secret.creatorName}
                          </span>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            {secret.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        {secret.contentType === 'text' && (
                          <p style={{ fontSize: 'var(--font-sm)' }}>{secret.textContent}</p>
                        )}
                        {secret.contentType === 'voice' && (
                          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>🎵 {secret.audioDuration}s</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: 'var(--space-md)', paddingBottom: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        
        <button
          className="btn btn-secondary"
          onClick={async () => {
             const success = await requestNotificationPermission(hushUser.uid);
             if (success) {
               alert(t('profile.notificationsEnabled'));
             } else {
               alert(t('profile.notificationsFailed'));
             }
          }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}
        >
          🔔 {t('profile.enableNotifications')}
        </button>

        {hushUser.uid === import.meta.env.VITE_ADMIN_UID && (
          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/admin'}
            style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white' }}
          >
            🛡️ {t('profile.adminPanel')}
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => signOut()} style={{ width: '100%' }}>
          {t('auth.signOut')}
        </button>
      </div>
    </div>
  );
}
