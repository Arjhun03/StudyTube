import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Youtube, LogOut, BookOpen, Brain, Play, Plus, Clock, Search, Sparkles, AlertCircle, Pencil, Save, X, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useStudySessions } from '../firebase/hooks/useStudySessions';
import { firestoreService } from '../firebase/services/firestoreService';
import { getFirebaseErrorMessage } from '../firebase/errors/firebaseError';
import { generateVideoNotesFromMetadata } from '../services/ai';
import type { FirebaseDate, StudySession } from '../types';

const formatFirebaseDate = (value?: FirebaseDate): string => {
  if (!value) {
    return 'Just now';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Just now' : parsed.toLocaleDateString();
  }

  if (typeof value.seconds !== 'number') {
    return 'Just now';
  }

  return new Date(value.seconds * 1000).toLocaleDateString();
};

const extractYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || null;
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
};

const buildSessionTitle = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `Study Notes - ${videoId}` : 'Study Notes';
};

const resolveSessionTitle = async (url: string): Promise<string> => {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) {
      return buildSessionTitle(url);
    }

    const data = await response.json() as { title?: string };
    return data.title?.trim() || buildSessionTitle(url);
  } catch {
    return buildSessionTitle(url);
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, profile, logout, resendVerificationEmail, refreshEmailVerification, isEmailVerified } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const { data: sessions, loading, error } = useStudySessions(currentUser?.uid);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;

  // Get passed URL from Home page if any
  useEffect(() => {
    const state = location.state as { url?: string } | null;
    if (state?.url) {
      setVideoUrl(state.url);
    }
  }, [location]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
    }
  }, [currentUser, navigate]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err));
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !videoUrl.trim()) return;

    setCreatingSession(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const trimmedUrl = videoUrl.trim();
      const title = await resolveSessionTitle(trimmedUrl);
      const summary = await generateVideoNotesFromMetadata(title, trimmedUrl);
      const sessionId = await firestoreService.createStudySession(currentUser.uid, trimmedUrl, title, summary);
      setVideoUrl('');
      setSelectedSessionId(sessionId);
      setActionMessage('Study guide created and opened.');
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err));
    } finally {
      setCreatingSession(false);
    }
  };

  const startEditingTitle = (session: StudySession) => {
    setEditingSessionId(session.id);
    setTitleDraft(session.title);
  };

  const cancelEditingTitle = () => {
    setEditingSessionId(null);
    setTitleDraft('');
  };

  const saveSessionTitle = async (sessionId: string) => {
    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      setActionError('Please enter a name for this study guide.');
      return;
    }

    setSavingTitle(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await firestoreService.updateStudySession(sessionId, { title: nextTitle });
      setEditingSessionId(null);
      setTitleDraft('');
      setActionMessage('Study guide name updated.');
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err));
    } finally {
      setSavingTitle(false);
    }
  };

  const deleteSession = async (session: StudySession) => {
    const confirmed = window.confirm(`Delete "${session.title}"? This note will be removed from your library.`);
    if (!confirmed) return;

    setDeletingSessionId(session.id);
    setActionError(null);
    setActionMessage(null);

    try {
      await firestoreService.deleteStudySession(session.id);
      if (selectedSessionId === session.id) {
        setSelectedSessionId(null);
      }
      if (editingSessionId === session.id) {
        cancelEditingTitle();
      }
      setActionMessage('Study guide deleted.');
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err));
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleResendVerification = async () => {
    setActionError(null);
    setActionMessage(null);

    try {
      await resendVerificationEmail();
      setActionMessage('Verification email sent.');
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err));
    }
  };

  const handleRefreshVerification = async () => {
    setActionError(null);
    setActionMessage(null);

    try {
      const verified = await refreshEmailVerification();
      setActionMessage(verified ? 'Email verified.' : 'Email is not verified yet.');
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="app-container flex-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Dashboard Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 0',
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'white',
              borderRadius: '10px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Youtube size={24} />
            </div>
            <span className="glow-logo" style={{ fontSize: '22px' }}>StudyTube AI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="desktop-only" style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{profile?.displayName || currentUser?.displayName || 'Student'}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{currentUser?.email}</p>
            </div>
            <button onClick={handleSignOut} className="btn btn-secondary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Dashboard Header Banner */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, var(--primary-light), transparent)',
            borderLeft: '4px solid var(--primary)',
            padding: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Welcome back, {currentUser?.displayName || 'Student'}!</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Ready to transform another video? Paste the link below to get started.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="glass-card" style={{ padding: '12px 20px', textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>{sessions.length}</span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sessions</p>
              </div>
            </div>
          </div>

          {!isEmailVerified && (
            <div className="glass-card" style={{ padding: '18px 20px', border: '1px solid var(--warning, hsl(38, 92%, 50%))', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-main)' }}>
                <AlertCircle size={18} style={{ color: 'var(--warning, hsl(38, 92%, 50%))' }} />
                <span style={{ fontSize: '14px' }}>Verify your email to keep your account secure.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={handleResendVerification} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                  Resend
                </button>
                <button type="button" onClick={handleRefreshVerification} className="btn btn-ghost" style={{ padding: '8px 12px' }}>
                  Refresh
                </button>
              </div>
            </div>
          )}

          {(actionError || error || actionMessage) && (
            <div className="glass-card" style={{ padding: '14px 16px', color: actionError || error ? 'var(--danger)' : 'var(--success, hsl(142, 76%, 36%))' }}>
              {actionError || error || actionMessage}
            </div>
          )}

          {/* Create New Session Bar */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} style={{ color: 'var(--primary)' }} /> Create New Study Guide
            </h3>
            <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flexGrow: 1, position: 'relative', minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="url"
                  required
                  placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px', width: '100%' }}
                />
              </div>
              <button type="submit" disabled={creatingSession} className="btn btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} /> {creatingSession ? 'Creating...' : 'Analyze Video'}
              </button>
            </form>
          </div>

          {selectedSession && (
            <section className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  {editingSessionId === selectedSession.id ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={titleDraft}
                        onChange={(event) => setTitleDraft(event.target.value)}
                        className="form-input"
                        style={{ flex: 1, minWidth: '220px' }}
                        aria-label="Study guide name"
                      />
                      <button
                        type="button"
                        onClick={() => saveSessionTitle(selectedSession.id)}
                        disabled={savingTitle}
                        className="btn btn-primary"
                        style={{ padding: '10px 14px' }}
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingTitle}
                        className="btn btn-ghost"
                        style={{ padding: '10px 12px' }}
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>{selectedSession.title}</h3>
                      <p style={{ color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <LinkIcon size={15} />
                        {selectedSession.videoUrl}
                      </p>
                    </>
                  )}
                </div>
                {editingSessionId !== selectedSession.id && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => startEditingTitle(selectedSession)}
                      className="btn btn-secondary"
                      style={{ padding: '10px 14px' }}
                    >
                      <Pencil size={16} /> Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSession(selectedSession)}
                      disabled={deletingSessionId === selectedSession.id}
                      className="btn btn-secondary"
                      style={{ padding: '10px 14px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={16} /> {deletingSessionId === selectedSession.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '20px',
                display: 'grid',
                gap: '18px'
              }}>
                <h4 style={{ fontSize: '18px' }}>Analyzed Notes</h4>
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.75
                }}>
                  {selectedSession.summary || 'No notes have been generated for this study guide yet.'}
                </div>
              </div>
            </section>
          )}

          {/* Recent Study Sessions */}
          <div>
            <h3 style={{ fontSize: '22px', marginBottom: '16px' }}>Your Study Library</h3>
            {sessions.length === 0 ? (
              <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Youtube size={48} style={{ margin: '0 auto 16px', color: 'var(--border-color)' }} />
                <p>No study sessions yet. Paste a YouTube URL above to generate your first study guide!</p>
              </div>
            ) : (
              <div className="grid-cols-3">
                {sessions.map((session) => (
                  <div key={session.id} className="glass-card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '200px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          borderRadius: '8px',
                          padding: '6px',
                          display: 'inline-flex'
                        }}>
                          <BookOpen size={16} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {formatFirebaseDate(session.createdAt)}
                        </span>
                      </div>
                      {editingSessionId === session.id ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <input
                            value={titleDraft}
                            onChange={(event) => setTitleDraft(event.target.value)}
                            className="form-input"
                            style={{ width: '100%', padding: '8px 10px' }}
                            aria-label="Study guide name"
                          />
                        </div>
                      ) : (
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          lineHeight: 1.4,
                          marginBottom: '8px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {session.title}
                        </h4>
                      )}
                      {session.summary && (
                        <p style={{
                          color: 'var(--text-muted)',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {session.summary}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Brain size={12} /> AI Guide Ready
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {editingSessionId === session.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveSessionTitle(session.id)}
                              disabled={savingTitle}
                              className="btn btn-ghost"
                              style={{ padding: '6px 8px', fontSize: '13px' }}
                            >
                              <Save size={12} /> Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingTitle}
                              className="btn btn-ghost"
                              style={{ padding: '6px 8px', fontSize: '13px' }}
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditingTitle(session)}
                              className="btn btn-ghost"
                              style={{ padding: '6px 8px', fontSize: '13px' }}
                              aria-label={`Rename ${session.title}`}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSession(session)}
                              disabled={deletingSessionId === session.id}
                              className="btn btn-ghost"
                              style={{ padding: '6px 8px', fontSize: '13px', color: 'var(--danger)' }}
                              aria-label={`Delete ${session.title}`}
                            >
                              <Trash2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSessionId(session.id)}
                              className="btn btn-ghost"
                              style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Play size={12} /> Open <ArrowRightStyle />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
};

// Inline helper for Chevron/Arrow character
const ArrowRightStyle: React.FC = () => <span>&rarr;</span>;
