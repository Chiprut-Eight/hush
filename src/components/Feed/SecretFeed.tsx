import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SecretCard } from './SecretCard';
import type { Secret } from '../../services/secretService';
import type { GeoPosition } from '../../hooks/useGeolocation';
import { useAuth } from '../../hooks/useAuth';

const VIEWED_KEY = 'hush_viewed_secrets';

function getViewedSecrets(): Set<string> {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSecretViewed(secretId: string) {
  const viewed = getViewedSecrets();
  viewed.add(secretId);
  // Keep only the most recent 500 viewed IDs to avoid unbounded growth
  const arr = [...viewed].slice(-500);
  localStorage.setItem(VIEWED_KEY, JSON.stringify(arr));
}

interface SecretFeedProps {
  secrets: Secret[];
  position: GeoPosition | null;
  loading: boolean;
}

export function SecretFeed({ secrets, position, loading }: SecretFeedProps) {
  const { t } = useTranslation();
  const { hushUser } = useAuth();
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => getViewedSecrets());

  const handleViewed = useCallback((secretId: string) => {
    markSecretViewed(secretId);
    // Delay hiding from the feed so the user can still interact
    setTimeout(() => {
      setViewedIds(getViewedSecrets());
    }, 10000); // hide after 10 seconds
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  // Filter out viewed secrets, but keep the user's own secrets and saved secrets
  const savedIds = new Set(hushUser?.savedSecretIds || []);
  const visibleSecrets = secrets.filter((s) => {
    if (s.creatorId === hushUser?.uid) return true; // own secret
    if (savedIds.has(s.id)) return true; // saved secret
    return !viewedIds.has(s.id); // not yet viewed
  });

  if (visibleSecrets.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🤫</span>
        <p>{t('feed.empty')}</p>
      </div>
    );
  }

  return (
    <div className="secret-feed" id="secret-feed">
      {visibleSecrets.map((secret) => (
        <SecretCard
          key={secret.id}
          secret={secret}
          position={position}
          onViewed={handleViewed}
        />
      ))}
    </div>
  );
}
