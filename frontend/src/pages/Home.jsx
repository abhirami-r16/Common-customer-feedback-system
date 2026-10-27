import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Layers, 
  Share2, 
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Users,
  Target
} from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

export default function Home() {
  const steps = [
    {
      step: '01',
      title: 'Create Your Feedback Form',
      description: 'Pick from multiple question types, configure required fields, organize into sections, and save drafts or publish with one click.',
      icon: <Layers size={22} color="#ffffff" />,
    },
    {
      step: '02',
      title: 'Share It With Your Customers',
      description: 'Share a unique link, display a printed QR code at checkout, or send one-time invitations directly to customers without requiring them to register.',
      icon: <Share2 size={22} color="#ffffff" />,
    },
    {
      step: '03',
      title: 'Analyze Responses & Improve',
      description: 'View real-time submissions, filter by ratings, assign review statuses, annotate with private notes, and export CSV reports to optimize your service.',
      icon: <TrendingUp size={22} color="#ffffff" />,
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="container hero-content">
          <h1 className="hero-headline">
            Turn Customer Feedback Into Better Experiences
          </h1>

          <p className="hero-desc">
            <span className="brand-text">
              <span className="brand-text-feedback">Feedback</span>
              <span className="brand-text-hub">Hub</span>
            </span> empowers modern businesses to collect honest customer opinions, manage team reviews, and uncover real-time insights with flexible forms and instant analytics.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg home-hero-btn">
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg home-hero-secondary">
              <span>Explore How It Works</span>
            </a>
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section id="how-it-works" className="section">
        <div className="container">
          <div className="section-header">
            <div className="badge badge-primary" style={{ marginBottom: '12px' }}>
              <span>Simple Workflow</span>
            </div>
            <h2 className="section-title">How It Works in 3 Easy Steps</h2>
            <p className="section-subtitle">
              From creating your first questionnaire to acting on customer insights in minutes.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((st, index) => (
              <div key={index} className="step-card card card-hover">
                <div className="step-number">{st.step}</div>
                <h3>{st.title}</h3>
                <p>{st.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <div className="badge badge-primary" style={{ marginBottom: '14px' }}>
                <span>About FeedbackHub</span>
              </div>
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '18px' }}>
                Bridging the Gap Between Customer Voices & Meaningful Action
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '28px' }}>
                FeedbackHub is an all-in-one customer intelligence system engineered for businesses that care deeply about experience quality. We replace cumbersome surveys with elegant, friction-free feedback forms that customers actually enjoy filling out.
              </p>

              <div className="about-points">
                <div className="about-point-item">
                  <div className="about-point-icon">
                    <ShieldCheck size={22} color="#1B906F" />
                  </div>
                  <div>
                    <h4 style={{ color: '#081B43', marginBottom: '4px', fontSize: '1.05rem', fontWeight: 700 }}>Privacy & Security First</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0, lineHeight: 1.55 }}>
                      Bank-grade encrypted submissions, spam protection, and granular role-based permissions ensure customer responses remain safe and authentic.
                    </p>
                  </div>
                </div>

                <div className="about-point-item">
                  <div className="about-point-icon">
                    <BarChart3 size={22} color="#0284c7" />
                  </div>
                  <div>
                    <h4 style={{ color: '#081B43', marginBottom: '4px', fontSize: '1.05rem', fontWeight: 700 }}>Real-Time Sentiment Analytics</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0, lineHeight: 1.55 }}>
                      Automatic CSAT score calculation, rating distributions, and instant submission feeds help teams spot trends before issues escalate.
                    </p>
                  </div>
                </div>

                <div className="about-point-item">
                  <div className="about-point-icon">
                    <Users size={22} color="#081B43" />
                  </div>
                  <div>
                    <h4 style={{ color: '#081B43', marginBottom: '4px', fontSize: '1.05rem', fontWeight: 700 }}>Frictionless Engagement</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0, lineHeight: 1.55 }}>
                      Share forms anywhere via direct links, printable QR codes at points of sale, or targeted email invitations with zero customer login required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card-showcase">
              <div className="about-highlight-card">
                <div className="about-card-badge">
                  <Target size={16} color="#34d399" />
                  <span>Platform Philosophy</span>
                </div>
                <h3>"Feedback isn't just data — it's the fastest path to customer loyalty."</h3>
                <p>
                  Whether you run a local retail store, a growing SaaS product, or a multi-location enterprise, FeedbackHub gives you the tools to listen attentively, resolve complaints swiftly, and celebrate glowing customer testimonials.
                </p>

                <div className="about-stat-chips">
                  <div className="about-stat-chip">
                    <strong>100%</strong>
                    <span>Responsive Forms</span>
                  </div>
                  <div className="about-stat-chip">
                    <strong>Real-Time</strong>
                    <span>Instant Live Analytics</span>
                  </div>
                  <div className="about-stat-chip">
                    <strong>Zero</strong>
                    <span>Customer Sign-in Friction</span>
                  </div>
                  <div className="about-stat-chip">
                    <strong>Unlimited</strong>
                    <span>Response Capacity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA Banner */}
      <section className="section" style={{ padding: '40px 0 80px' }}>
        <div className="container">
          <div className="card cta-banner-card" style={{
            background: 'linear-gradient(135deg, #081B43 0%, #0c2d6b 35%, #0b515a 75%, #1B906F 100%)',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(27, 144, 111, 0.3)',
            boxShadow: '0 20px 50px -10px rgba(8, 27, 67, 0.35)'
          }}>
            {/* Ambient background glows */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(27, 144, 111, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-40px',
              left: '-40px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(2, 132, 199, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '68px',
              height: '68px',
              borderRadius: '22px',
              background: '#ffffff',
              margin: '0 auto 20px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
            }}>
              <img src={logoIcon} alt="Feedback Hub" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
            </div>
            <h2 className="cta-banner-title" style={{ color: '#ffffff', marginBottom: '16px' }}>
              Ready to Collect Valuable Feedback?
            </h2>
            <p className="cta-banner-desc" style={{ color: '#e0f2fe', maxWidth: '600px', margin: '0 auto 32px' }}>
              Set up your account in seconds and create your first customer survey today. No credit card required.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <Link to="/register" className="btn btn-lg cta-banner-btn-primary">
                <span>Get Started Free</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                <span>Sign In to Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
