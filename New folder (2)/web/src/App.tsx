import { useCallback, useEffect, useState } from 'react';
import { api, User, Goal, ApiError } from './api';
import { STR } from './i18n';
import { AmbientBackground } from './components/AmbientBackground';
import { Onboarding } from './components/Onboarding';
import { SignIn } from './components/SignIn';
import { TabBar, Screen } from './components/TabBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { CoachingScreen } from './components/screens/CoachingScreen';
import { MaqsadScreen } from './components/screens/MaqsadScreen';
import { KasbScreen } from './components/screens/KasbScreen';
import { ProfilScreen } from './components/screens/ProfilScreen';

export interface WeekDay {
  date: string;
  pct: number;
  doneCount: number;
  totalCount: number;
  isToday: boolean;
}

function readOnboarded() {
  // The offline demo build should always show onboarding from the start —
  // it's a preview, not a returning-user experience, and file:// pages can
  // end up sharing localStorage across separately downloaded copies of the
  // same demo file, which would otherwise skip it after the first viewing.
  if (typeof window !== 'undefined' && window.__QN_MOCK__) return false;
  try {
    return localStorage.getItem('qanotim_onboarded') === '1';
  } catch {
    return true;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
  const [onboarded, setOnboarded] = useState(readOnboarded);
  const [screen, setScreen] = useState<Screen>('home');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streak, setStreak] = useState(0);
  const [weekly, setWeekly] = useState<WeekDay[]>([]);
  const [coachingDoneCount, setCoachingDoneCount] = useState(0);
  const [dailyPrompt, setDailyPrompt] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setUser(null);
        else setUser(null);
      });
  }, []);

  // The offline demo can never do real Google OAuth (no server, no origin
  // Google recognizes), and there's no guest sign-in button in the real UI
  // to fall back to anymore — so once onboarding is out of the way, the
  // demo signs itself in behind the scenes instead of dead-ending on the
  // sign-in screen with a Google button that can't work from file://.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__QN_MOCK__ && onboarded && user === null) {
      api.post<{ user: User }>('/auth/guest', { name: 'Foydalanuvchi' }).then((r) => setUser(r.user));
    }
  }, [onboarded, user]);

  const refreshGoals = useCallback(() => {
    api.get<{ goals: Goal[] }>('/goals').then((r) => setGoals(r.goals));
  }, []);
  const refreshStreak = useCallback(() => {
    api.get<{ streak: number }>('/goals/streak').then((r) => setStreak(r.streak));
  }, []);
  const refreshWeekly = useCallback(() => {
    api.get<{ days: WeekDay[] }>('/goals/weekly').then((r) => setWeekly(r.days));
  }, []);
  const refreshCoachingStats = useCallback(() => {
    api.get<{ coachingDoneCount: number }>('/coaching/stats').then((r) => setCoachingDoneCount(r.coachingDoneCount));
  }, []);
  const refreshDailyPrompt = useCallback(() => {
    api.get<{ prompt: string | null }>('/coaching/pattern').then((r) => setDailyPrompt(r.prompt));
  }, []);

  useEffect(() => {
    if (user && user !== 'loading') {
      refreshGoals();
      refreshStreak();
      refreshWeekly();
      refreshCoachingStats();
      refreshDailyPrompt();
    }
  }, [user, refreshGoals, refreshStreak, refreshWeekly, refreshCoachingStats, refreshDailyPrompt]);

  if (user === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {STR.uz.loading}
      </div>
    );
  }
  if (!onboarded) {
    return (
      <div className="qn-shell">
        <div className="qn-app">
          <AmbientBackground />
          <Onboarding
            onDone={() => {
              try {
                localStorage.setItem('qanotim_onboarded', '1');
              } catch {
                /* private-browsing or storage-blocked — onboarding just reappears next visit, harmless */
              }
              setOnboarded(true);
            }}
          />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="qn-shell">
        <div className="qn-app">
          <AmbientBackground />
          <SignIn onSignedIn={setUser} />
        </div>
      </div>
    );
  }

  const t = STR[user.lang];
  const goalsDoneN = goals.filter((g) => g.done).length;

  function setLang(lang: 'uz' | 'ru') {
    api.patch<{ user: User }>('/user/lang', { lang }).then((r) => setUser(r.user));
  }

  function logout() {
    api.post('/auth/logout').then(() => setUser(null));
  }

  return (
    <div className="qn-shell">
      <div className="qn-app">
        <AmbientBackground />
        <div className="qn-content-scrim" style={{ flex: 1, overflow: 'auto', padding: '24px 20px 8px' }}>
          {screen === 'home' && (
            <HomeScreen
              t={t}
              user={user}
              goalsDoneN={goalsDoneN}
              goalsTotal={goals.length}
              streak={streak}
              dailyPrompt={dailyPrompt}
              onNavigate={setScreen}
            />
          )}
          {screen === 'coaching' && (
            <CoachingScreen
              t={t}
              lang={user.lang}
              onBack={() => setScreen('home')}
              onCompleted={() => {
                refreshCoachingStats();
                refreshDailyPrompt();
              }}
            />
          )}
          {screen === 'maqsad' && (
            <MaqsadScreen
              t={t}
              lang={user.lang}
              goals={goals}
              goalsDoneN={goalsDoneN}
              onBack={() => setScreen('home')}
              onGoalsChanged={() => {
                refreshGoals();
                refreshStreak();
                refreshWeekly();
              }}
            />
          )}
          {screen === 'kasb' && <KasbScreen t={t} onBack={() => setScreen('home')} />}
          {screen === 'profil' && (
            <ProfilScreen
              t={t}
              user={user}
              streak={streak}
              goalsDoneCount={goalsDoneN}
              coachingDoneCount={coachingDoneCount}
              weekly={weekly}
              onSetLang={setLang}
              onLogout={logout}
              onBack={() => setScreen('home')}
            />
          )}
        </div>
        <TabBar screen={screen} onChange={setScreen} t={t} />
      </div>
    </div>
  );
}
