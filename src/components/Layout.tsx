import { useEffect, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './icons';
import { useActiveSession, useSettings } from '@/store/selectors';
import { doneSetsCount, sessionDurationSec, totalSetsCount } from '@/lib/sessionOps';
import { formatClock } from '@/lib/format';
import { useNow } from '@/lib/useNow';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Accueil', icon: 'home' },
  { to: '/modeles', label: 'Modèles', icon: 'templates' },
  { to: '/exercices', label: 'Exercices', icon: 'catalog' },
  { to: '/progression', label: 'Progrès', icon: 'progress' },
  { to: '/reglages', label: 'Réglages', icon: 'settings' },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <div className="tabbar-inner">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          >
            <Icon name={tab.icon} />
            <span className="tab-label">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Rappel permanent de la séance en cours, hors de l'écran de séance. */
export function ActiveSessionBar() {
  const session = useActiveSession();
  const location = useLocation();
  const navigate = useNavigate();
  useNow(session ? 1000 : null);

  if (!session || location.pathname.startsWith('/seance')) return null;

  const done = doneSetsCount(session);
  const total = totalSetsCount(session);

  return (
    <button
      className="session-bar"
      onClick={() => navigate('/seance')}
      style={{ position: 'sticky', bottom: 12, width: '100%', border: 0, cursor: 'pointer' }}
    >
      <Icon name="play" filled size={20} />
      <span className="grow" style={{ textAlign: 'left' }}>
        <span className="nowrap" style={{ display: 'block' }}>
          {session.name}
        </span>
        <span className="tiny">
          {done}/{total} séries · {formatClock(sessionDurationSec(session))}
        </span>
      </span>
      <Icon name="chevron" size={18} />
    </button>
  );
}

interface ScreenProps {
  title: string;
  subtitle?: string;
  back?: string | (() => void);
  actions?: ReactNode;
  /** Masque la barre d'onglets (écrans plein écran : séance, édition). */
  fullscreen?: boolean;
  children: ReactNode;
}

export function Screen({
  title,
  subtitle,
  back,
  actions,
  fullscreen,
  children,
}: ScreenProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <header className="appbar">
        {back && (
          <button
            className="btn-icon"
            aria-label="Retour"
            onClick={() => (typeof back === 'string' ? navigate(back) : back())}
          >
            <Icon name="back" />
          </button>
        )}
        <h1>
          {title}
          {subtitle && <span className="subtitle">{subtitle}</span>}
        </h1>
        {actions}
      </header>
      <main className={`page ${fullscreen ? 'no-tabbar' : ''}`}>
        {children}
        {!fullscreen && <ActiveSessionBar />}
      </main>
      {!fullscreen && <TabBar />}
    </div>
  );
}

/** Applique le thème choisi au document. */
export function useThemeEffect() {
  const { theme } = useSettings();

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved = theme === 'auto' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.dataset.theme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'light' ? '#f4f6fa' : '#0b0f14');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
