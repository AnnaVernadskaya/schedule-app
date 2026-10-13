import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CalendarDays, LogOut } from 'lucide-react';
import Auth from './components/Auth';
import Schedule from './components/Schedule';
import { supabase } from './supabase';
import { GROUP } from './types';
import styles from './App.module.css';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [demo, setDemo] = useState(() => sessionStorage.getItem('schedule-demo') === 'true');
  const [loading, setLoading] = useState(Boolean(supabase));
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    void supabase.auth.getSession().then(({ data, error: failure }) => {
      if (!active) return;
      if (failure) setError('Не удалось восстановить вход. Попробуйте войти ещё раз.');
      setSession(data.session);
      setLoading(false);
    }).catch(() => { if (active) { setError('Не удалось связаться с сервисом входа.'); setLoading(false); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function logout() {
    setError('');
    if (demo) { sessionStorage.removeItem('schedule-demo'); setDemo(false); return; }
    if (!supabase) return;
    const { error: failure } = await supabase.auth.signOut();
    if (failure) setError('Не удалось выйти. Проверьте соединение и повторите.');
    else { setSession(null); setRecovery(false); }
  }

  const signedIn = demo || Boolean(session);
  const name = demo ? 'Анна' : String(session?.user.user_metadata.full_name || session?.user.email?.split('@')[0] || 'Студент');
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  return <>
    <header className={styles.header}>
      <a className={styles.brand} href="/" aria-label="Расписание группы, главная"><CalendarDays size={25} /><span>Расписание группы</span></a>
      {signedIn && !recovery && <span className={styles.group}>{GROUP}</span>}
      {signedIn && <div className={styles.account}>
        {demo && <span className={styles.demoTag}>Демо</span>}
        <span className={styles.avatar}>{initials}</span><span className={styles.name}>{name}</span>
        <button className={styles.iconButton} title="Выйти" aria-label="Выйти" onClick={() => void logout()}><LogOut size={21} /></button>
      </div>}
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <main className={styles.loading} role="status">Загружаем расписание…</main>
      : signedIn && !recovery ? <Schedule demo={demo} userId={session?.user.id} />
      : <Auth recovery={recovery} onRecovered={() => setRecovery(false)} onDemo={() => { sessionStorage.setItem('schedule-demo', 'true'); setDemo(true); }} />}
  </>;
}
