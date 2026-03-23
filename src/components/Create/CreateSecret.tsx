import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { createSecret, type SecretType } from '../../services/secretService';
import { startRecording, stopRecording, cancelRecording, uploadAudio, type AudioRecording } from '../../services/audioService';
import { getTierByLevel, CLOUT_TIERS } from '../../config/tiers';

export function CreateSecret() {
  const { t } = useTranslation();
  const { hushUser, firebaseUser } = useAuth();
  const { position, error: geoError, loading: geoLoading } = useGeolocation();

  const [tab, setTab] = useState<'text' | 'voice'>('text');
  const [textContent, setTextContent] = useState('');
  const [secretType, setSecretType] = useState<SecretType>('regular');
  const [requiredUsers, setRequiredUsers] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userTier = hushUser ? getTierByLevel(hushUser.tierLevel) : CLOUT_TIERS[0];
  const charCount = textContent.length;
  const isGhostMode = hushUser?.isGhostMode || false;

  const handleStartRecording = useCallback(async () => {
    try {
      setRecording(null);
      setRecordingSeconds(0);
      await startRecording(
        (seconds) => setRecordingSeconds(seconds),
        () => handleStopRecording()
      );
      setIsRecording(true);
    } catch {
      setError('Microphone access denied');
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    const result = await stopRecording();
    setRecording(result);
    setIsRecording(false);
  }, []);

  const handleDeleteRecording = () => {
    if (recording) {
      URL.revokeObjectURL(recording.url);
      setRecording(null);
    }
    setRecordingSeconds(0);
  };

  const handleSubmit = async () => {
    if (!hushUser || !firebaseUser || !position) return;
    if (isGhostMode) return;

    setSubmitting(true);
    setError(null);

    try {
      const tier = getTierByLevel(hushUser.tierLevel);
      let audioUrl: string | undefined;
      let audioDuration: number | undefined;

      if (tab === 'voice' && recording) {
        // We'll upload after creating the doc to get the ID
        audioDuration = recording.duration;
      }

      const secretId = await createSecret({
        creatorId: hushUser.uid,
        creatorName: hushUser.displayName || 'Anonymous',
        creatorTierLevel: hushUser.tierLevel,
        creatorTierColor: tier.color,
        type: secretType,
        contentType: tab,
        textContent: tab === 'text' ? textContent : undefined,
        audioUrl: undefined, // Will update after upload
        audioDuration,
        lat: position.lat,
        lng: position.lng,
        requiredUsers: secretType === 'group' ? requiredUsers : undefined,
        timeWindowMinutes: secretType === 'group' ? tier.timeWindowMinutes : undefined,
      });

      if (tab === 'voice' && recording) {
        audioUrl = await uploadAudio(recording.blob, secretId);
        // Update the secret with audio URL
        const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
        const firebaseConfig = await import('../../config/firebase');
        const fireDb = firebaseConfig.db;
        if (fireDb) {
          await updateDoc(firestoreDoc(fireDb, 'secrets', secretId), { audioUrl });
        }
      }

      setSuccess(true);
      setTextContent('');
      setRecording(null);
      setSecretType('regular');
      setRequiredUsers(3);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(t('create.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !submitting &&
    !isGhostMode &&
    position &&
    ((tab === 'text' && textContent.trim().length > 0 && textContent.length <= 140) ||
      (tab === 'voice' && recording !== null));

  if (geoLoading) {
    return (
      <div className="loading-spinner" style={{ margin: 'auto', paddingTop: 'var(--space-xl)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (geoError === 'PERMISSION_DENIED' || !position) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📍</span>
        <p>{t('create.locationRequired')}</p>
        <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={() => {
          navigator.geolocation.getCurrentPosition(
            () => window.location.reload(),
            () => window.location.reload()
          );
        }}>
          {t('common.enableLocation')}
        </button>
      </div>
    );
  }

  return (
    <div className="create-form" id="create-secret-form">
      {isGhostMode && (
        <div className="ghost-banner">
          <p className="ghost-banner-title">{t('profile.ghostMode')}</p>
          <p>{t('ghost.blocked')}</p>
        </div>
      )}

      {success && (
        <div className="toast success">✓ {t('create.success')}</div>
      )}

      {error && (
        <div className="toast error">✗ {error}</div>
      )}

      {/* Tabs */}
      <div className="create-tabs">
        <button
          className={`create-tab ${tab === 'text' ? 'active' : ''}`}
          onClick={() => setTab('text')}
        >
          ✍️ {t('create.textTab')}
        </button>
        <button
          className={`create-tab ${tab === 'voice' ? 'active' : ''}`}
          onClick={() => setTab('voice')}
        >
          🎙️ {t('create.voiceTab')}
        </button>
      </div>

      {/* Text Input */}
      {tab === 'text' && (
        <div>
          <textarea
            className="create-textarea"
            placeholder={t('create.textPlaceholder')}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value.slice(0, 140))}
            maxLength={140}
            rows={4}
            dir="auto"
          />
          <div
            className={`char-counter ${
              charCount >= 130 ? 'limit' : charCount >= 100 ? 'warning' : ''
            }`}
          >
            {t('create.charCount', { count: charCount })}
          </div>
        </div>
      )}

      {/* Voice Recorder */}
      {tab === 'voice' && (
        <div className="audio-recorder">
          {!recording ? (
            <>
              <button
                className={`record-btn ${isRecording ? 'recording' : ''}`}
                onMouseDown={!isRecording ? handleStartRecording : undefined}
                onMouseUp={isRecording ? handleStopRecording : undefined}
                onTouchStart={!isRecording ? handleStartRecording : undefined}
                onTouchEnd={isRecording ? handleStopRecording : undefined}
              >
                {isRecording ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--tier-red)">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--tier-red)" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
              <p className="record-timer">
                {isRecording
                  ? t('create.recordingTime', { seconds: recordingSeconds })
                  : t('create.record')}
              </p>
            </>
          ) : (
            <>
              <div className="audio-player">
                <button className="audio-play-btn" onClick={() => {
                  const audio = new Audio(recording.url);
                  audio.play();
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </button>
                <div className="audio-waveform">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="audio-bar"
                      style={{ height: `${8 + Math.random() * 24}px` }}
                    />
                  ))}
                </div>
                <span className="audio-time">{recording.duration}s</span>
              </div>
              <button className="btn btn-danger" onClick={handleDeleteRecording}>
                🗑️ {t('create.delete')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Secret Type Selector */}
      <div className="type-selector">
        <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {t('create.secretType')}
        </h3>

        <button
          className={`type-option ${secretType === 'regular' ? 'selected' : ''}`}
          onClick={() => setSecretType('regular')}
        >
          <div className="type-radio" />
          <div>
            <div className="type-label">🤫 {t('create.regular')}</div>
            <div className="type-desc">{t('create.regularDesc')}</div>
          </div>
        </button>

        <button
          className={`type-option ${secretType === 'group' ? 'selected' : ''}`}
          onClick={() => setSecretType('group')}
        >
          <div className="type-radio" />
          <div>
            <div className="type-label">🔐 {t('create.group')}</div>
            <div className="type-desc">{t('create.groupDesc')}</div>
          </div>
        </button>
      </div>

      {/* Group Config */}
      {secretType === 'group' && (
        <div className="group-config glass-card">
          <div className="slider-label">
            <span>{t('create.peopleRequired')}</span>
            <span className="slider-value">{requiredUsers}</span>
          </div>
          <input
            type="range"
            min={userTier.minUsers}
            max={userTier.maxUsers}
            value={requiredUsers}
            onChange={(e) => setRequiredUsers(Number(e.target.value))}
          />
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('create.timeWindow', { minutes: userTier.timeWindowMinutes })}
          </div>
          <div
            style={{
              fontSize: 'var(--font-xs)',
              color: userTier.color,
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            {t('profile.tier', { level: userTier.level })} — {userTier.nameEn}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        className="btn btn-primary btn-lg"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{ width: '100%', marginTop: 'var(--space-md)' }}
      >
        {submitting ? t('create.hiding') : `🤫 ${t('create.hideSecret')}`}
      </button>
    </div>
  );
}
