import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db as _db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

const db = _db!; // Admin panel only accessible when authenticated (Firebase must be configured)

// Admin UID — will be set to the app owner's Firebase UID
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

interface Appeal {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

interface Report {
  id: string;
  secretId: string;
  reporterId: string;
  status: 'pending' | 'reviewed';
  createdAt: Date;
}

export function AdminPanel() {
  const { t } = useTranslation();
  const { firebaseUser } = useAuth();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appeals' | 'reports'>('appeals');

  const isAdmin = firebaseUser?.uid === ADMIN_UID;

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch appeals
        const appealsQuery = query(
          collection(db, 'appeals'),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
        const appealsSnap = await getDocs(appealsQuery);
        setAppeals(
          appealsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          })) as Appeal[]
        );

        // Fetch reports
        const reportsQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
        const reportsSnap = await getDocs(reportsQuery);
        setReports(
          reportsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          })) as Report[]
        );
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleAppealDecision = async (appealId: string, decision: 'approved' | 'rejected') => {
    const appealRef = doc(db, 'appeals', appealId);
    await updateDoc(appealRef, { status: decision });
    setAppeals((prev) => prev.filter((a) => a.id !== appealId));
  };

  const handleReportReview = async (reportId: string) => {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status: 'reviewed' });
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  if (!isAdmin) {
    return (
      <div className="empty-state" style={{ minHeight: '80vh' }}>
        <span className="empty-state-icon">🔒</span>
        <p>{t('admin.accessDenied')}</p>
      </div>
    );
  }

  return (
    <div id="admin-panel">
      <div className="create-tabs" style={{ margin: 'var(--space-md)' }}>
        <button
          className={`create-tab ${activeTab === 'appeals' ? 'active' : ''}`}
          onClick={() => setActiveTab('appeals')}
        >
          ⚖️ {t('admin.appeals', { count: appeals.length })}
        </button>
        <button
          className={`create-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          🚩 {t('admin.reports', { count: reports.length })}
        </button>
      </div>

      <div style={{ padding: 'var(--space-md)' }}>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {activeTab === 'appeals' && (
              <>
                {appeals.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">✅</span>
                    <p>{t('admin.noAppeals')}</p>
                  </div>
                ) : (
                  appeals.map((appeal) => (
                    <div key={appeal.id} className="glass-card" style={{ marginBottom: 'var(--space-md)' }}>
                      <div style={{ marginBottom: 'var(--space-sm)' }}>
                        <strong>{appeal.userEmail}</strong>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>
                          {appeal.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--space-md)' }}>
                        {appeal.reason}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAppealDecision(appeal.id, 'approved')}
                        >
                          {t('admin.approve')}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleAppealDecision(appeal.id, 'rejected')}
                        >
                          {t('admin.reject')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'reports' && (
              <>
                {reports.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">✅</span>
                    <p>{t('admin.noReports')}</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="glass-card" style={{ marginBottom: 'var(--space-md)' }}>
                      <div style={{ marginBottom: 'var(--space-sm)', fontSize: 'var(--font-sm)' }}>
                        <strong>{t('admin.secretId')}:</strong> {report.secretId}
                      </div>
                      <div style={{ marginBottom: 'var(--space-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        {t('admin.reportedBy')}: {report.reporterId} · {report.createdAt.toLocaleDateString()}
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleReportReview(report.id)}
                      >
                        {t('admin.markReviewed')}
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
