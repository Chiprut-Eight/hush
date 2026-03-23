import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useProximity } from '../../hooks/useProximity';
import type { GeoPosition } from '../../hooks/useGeolocation';
import type { Secret } from '../../services/secretService';
import {
  likeSecret,
  dislikeSecret,
  removeLike,
  removeDislike,
  saveSecret,
  unsaveSecret,
  recordListen,
  reportSecret,
} from '../../services/secretService';
import { haversineDistance, REVEAL_RADIUS_METERS } from '../../services/geoService';
import { getTierByLevel } from '../../config/tiers';

interface SecretCardProps {
  secret: Secret;
  position: GeoPosition | null;
  onReveal?: () => void;
  onViewed?: (secretId: string) => void;
}

export function SecretCard({ secret, position, onReveal, onViewed }: SecretCardProps) {
  const { t } = useTranslation();
  const { hushUser, refreshProfile } = useAuth();
  const { isInRange, distance } = useProximity(position, secret.lat, secret.lng, REVEAL_RADIUS_METERS);
  const [revealed, setRevealed] = useState(false);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  const [localLikes, setLocalLikes] = useState(secret.likes);
  const [localDislikes, setLocalDislikes] = useState(secret.dislikes);
  const [localListens, setLocalListens] = useState(secret.listens);
  const [userLiked, setUserLiked] = useState(hushUser ? secret.likedBy?.includes(hushUser.uid) : false);
  const [userDisliked, setUserDisliked] = useState(hushUser ? secret.dislikedBy?.includes(hushUser.uid) : false);
  const [userSaved, setUserSaved] = useState(hushUser ? hushUser.savedSecretIds?.includes(secret.id) : false);
  const [showWarning, setShowWarning] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElement] = useState<HTMLAudioElement | null>(secret.audioUrl ? new Audio(secret.audioUrl) : null);

  const tier = getTierByLevel(secret.creatorTierLevel);
  const feedDistance = position
    ? Math.round(haversineDistance(position.lat, position.lng, secret.lat, secret.lng))
    : null;
  const isGroup = secret.type === 'group';
  const hasWarning = secret.hasContentWarning || (secret.dislikes > 3 && secret.dislikes > secret.likes);

  const handleReveal = async () => {
    if (!isInRange || !hushUser) return;

    if (hasWarning && !showWarning && !revealed) {
      setShowWarning(true);
      return;
    }

    setRevealed(true);
    setShowWarning(false);
    setLocalListens((prev) => prev + 1);
    await recordListen(secret.id);
    onReveal?.();
    onViewed?.(secret.id);
  };

  const handleLike = async () => {
    if (!hushUser) return;
    if (userLiked) {
      setLocalLikes((prev) => prev - 1);
      setUserLiked(false);
      await removeLike(secret.id, hushUser.uid);
    } else {
      if (userDisliked) {
        setLocalDislikes((prev) => prev - 1);
        setUserDisliked(false);
      }
      setLocalLikes((prev) => prev + 1);
      setUserLiked(true);
      await likeSecret(secret.id, hushUser.uid);
    }
  };

  const handleDislike = async () => {
    if (!hushUser) return;
    if (userDisliked) {
      setLocalDislikes((prev) => prev - 1);
      setUserDisliked(false);
      await removeDislike(secret.id, hushUser.uid);
    } else {
      if (userLiked) {
        setLocalLikes((prev) => prev - 1);
        setUserLiked(false);
      }
      setLocalDislikes((prev) => prev + 1);
      setUserDisliked(true);
      await dislikeSecret(secret.id, hushUser.uid);
    }
  };

  const handleSave = async () => {
    if (!hushUser) return;
    if (userSaved) {
      setUserSaved(false);
      await unsaveSecret(secret.id, hushUser.uid);
    } else {
      if ((hushUser.savedSecretIds?.length || 0) >= 50) {
        setShowSaveTooltip(true);
        setTimeout(() => setShowSaveTooltip(false), 3000);
        return;
      }
      setUserSaved(true);
      await saveSecret(secret.id, hushUser.uid);
    }
    await refreshProfile();
  };

  const handleReport = async () => {
    if (!hushUser) return;
    await reportSecret(secret.id, hushUser.uid);
  };

  const handlePlayAudio = () => {
    if (!audioElement) return;
    if (audioPlaying) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioPlaying(false);
    } else {
      audioElement.play();
      setAudioPlaying(true);
      audioElement.onended = () => setAudioPlaying(false);
    }
  };

  return (
    <div
      className={`secret-card glass-card tier-halo ${tier.cssClass} ${isInRange ? 'in-range' : ''}`}
      id={`secret-${secret.id}`}
      onClick={isInRange && !revealed ? handleReveal : undefined}
    >
      {showWarning && (
        <div className="content-warning">
          <span className="content-warning-icon">⚠️</span>
          <p>{t('feed.contentWarning')}</p>
          <div className="content-warning-buttons">
            <button className="btn btn-secondary" onClick={() => setShowWarning(false)}>
              {t('feed.cancel')}
            </button>
            <button className="btn btn-danger" onClick={handleReveal}>
              {t('feed.viewAnyway')}
            </button>
          </div>
        </div>
      )}

      {!showWarning && (
        <div className="secret-card-inner">
          <div className="secret-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span
                className="secret-type-badge"
                style={{ borderColor: isGroup ? tier.color : 'var(--border-subtle)' }}
              >
                {isGroup ? `🔐 ${t('feed.groupSecret')}` : `🤫 ${t('feed.regularSecret')}`}
              </span>
              {isGroup && secret.requiredUsers && (
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  {t('feed.needPeople', { count: secret.requiredUsers })}
                </span>
              )}
            </div>
            <span className="secret-distance">
              {feedDistance !== null ? t('feed.distance', { distance: feedDistance }) : ''}
            </span>
          </div>

          <div className="secret-content">
            {revealed ? (
              <div className="secret-revealed-container">
                {secret.contentType === 'text' && (
                  <p className="secret-text secret-revealed">{secret.textContent}</p>
                )}
                {secret.contentType === 'voice' && secret.audioUrl && (
                  <div className="audio-player">
                    <button className="audio-play-btn" onClick={handlePlayAudio}>
                      {audioPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </button>
                    <div className="audio-waveform">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div
                          key={i}
                          className={`audio-bar ${audioPlaying ? 'active' : ''}`}
                          style={{
                            height: `${8 + Math.random() * 24}px`,
                            animationDelay: `${i * 50}ms`,
                          }}
                        />
                      ))}
                    </div>
                    {secret.audioDuration && (
                      <span className="audio-time">{secret.audioDuration}s</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div
                  className="secret-blurred"
                  style={{ width: '100%', padding: 'var(--space-md)' }}
                >
                  {secret.contentType === 'text' ? (
                    <p style={{ fontSize: 'var(--font-lg)' }}>
                      {'██ ████ ███ ██████ ██ ███ ████ ██'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span>🎙️</span>
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {Array.from({ length: 16 }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              width: '3px',
                              height: `${6 + Math.random() * 18}px`,
                              background: 'var(--text-muted)',
                              borderRadius: '2px',
                              opacity: 0.5,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="secret-blur-overlay">
                  {isInRange
                    ? t('feed.withinRange')
                    : t('feed.blurred')
                  }
                </div>
              </>
            )}
          </div>

          <div className="secret-actions">
            <button
              className={`secret-action ${userLiked ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
            >
              <span>{userLiked ? '❤️' : '🤍'}</span>
              <span>{localLikes}</span>
            </button>

            <button
              className={`secret-action ${userDisliked ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleDislike(); }}
            >
              <span>👎</span>
              <span>{localDislikes}</span>
            </button>

            <span className="secret-action">
              <span>{secret.contentType === 'voice' ? '👂' : '👁️'}</span>
              <span>{localListens}</span>
            </span>

            <span className="secret-action-spacer" />

            <button
              className="secret-action"
              onClick={(e) => { e.stopPropagation(); handleReport(); }}
              title={t('feed.report')}
            >
              <span>🚩</span>
            </button>

            <button
              className={`secret-action ${userSaved ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              style={{ position: 'relative' }}
            >
              <span>{userSaved ? '🔖' : '📌'}</span>
              <span>{userSaved ? t('feed.saved') : t('feed.save')}</span>
              {showSaveTooltip && (
                <div className="save-tooltip">{t('feed.saveLimit')}</div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
