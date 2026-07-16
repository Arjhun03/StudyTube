import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Youtube, BookOpen, Brain, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      navigate('/dashboard', { state: { url: videoUrl } });
    } else {
      navigate('/auth', { state: { redirectTo: '/dashboard', url: videoUrl } });
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Navbar */}
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
          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#features" style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>Features</a>
            <a href="#how-it-works" style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>How it Works</a>
            {currentUser ? (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '8px 18px' }}>
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/auth')} className="btn btn-primary" style={{ padding: '8px 18px' }}>
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flexGrow: 1, padding: '80px 0 60px' }}>
        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          {/* Subtle Background Glow Circles */}
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '400px',
            height: '400px',
            background: 'var(--primary-glow)',
            filter: 'blur(100px)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: -1
          }}></div>

          <div className="badge badge-primary" style={{ marginBottom: '24px' }}>
            <Sparkles size={14} style={{ marginRight: '6px' }} /> Powered by Advanced Gemini AI
          </div>

          <h1 style={{
            fontSize: '56px',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            maxWidth: '850px',
            margin: '0 auto 20px',
            fontFamily: 'var(--font-heading)'
          }}>
            Transform <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>YouTube Videos</span> Into Complete Study Materials
          </h1>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.5
          }}>
            Paste any educational YouTube link and instantly generate detailed study notes, interactive quizzes, flashcards, and query the video content with an AI tutor.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleStart} className="glass-card" style={{
            maxWidth: '650px',
            margin: '0 auto 60px',
            padding: '8px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: '8px',
            flexDirection: 'row',
            alignItems: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
              <Youtube size={20} style={{ color: 'var(--text-muted)', marginRight: '12px', flexShrink: 0 }} />
              <input
                type="url"
                required
                placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: 'var(--text-main)'
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Start Studying <ArrowRight size={16} />
            </button>
          </form>

          {/* Features Grid */}
          <section id="features" style={{ padding: '60px 0' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '12px' }}>Why Choose StudyTube AI?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '48px' }}>Maximize your retention and save hours of passive video watching.</p>
            
            <div className="grid-cols-3">
              {/* Feature 1 */}
              <div className="glass-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  borderRadius: '12px',
                  padding: '12px',
                  width: 'fit-content'
                }}>
                  <BookOpen size={24} />
                </div>
                <h3>AI summaries & Notes</h3>
                <p style={{ color: 'var(--text-muted)' }}>Get high-fidelity structured notes, conceptual break-downs, and auto-generated index markers directly from the video.</p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  borderRadius: '12px',
                  padding: '12px',
                  width: 'fit-content'
                }}>
                  <Brain size={24} />
                </div>
                <h3>Smart Practice Quizzes</h3>
                <p style={{ color: 'var(--text-muted)' }}>Test your knowledge instantly. Solve auto-generated multiple-choice questions with detailed hints and logic explanations.</p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  borderRadius: '12px',
                  padding: '12px',
                  width: 'fit-content'
                }}>
                  <MessageSquare size={24} />
                </div>
                <h3>Chat with AI Tutor</h3>
                <p style={{ color: 'var(--text-muted)' }}>Have a follow-up question? Get instant answers from the AI tutor that understands the entire transcripts of the video.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '30px 0',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="glow-logo" style={{ fontSize: '18px' }}>StudyTube AI</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>&copy; {new Date().getFullYear()} StudyTube AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
