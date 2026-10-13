import { useState, type FormEvent } from 'react';
import { CalendarDays, Eye, EyeOff, LogIn, UserPlus, ArrowLeft, ArrowRight, LoaderCircle, KeyRound } from 'lucide-react';
import { supabase } from '../supabase';
import { GROUP } from '../types';
import styles from './Auth.module.css';

type Mode = 'login' | 'register' | 'forgot';
type Props = { onDemo: () => void; recovery: boolean; onRecovered: () => void };

export default function Auth({ onDemo, recovery, onRecovered }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const register = mode === 'register' && !recovery;
  const forgot = mode === 'forgot' && !recovery;
  const title = recovery ? 'Новый пароль' : register ? 'Регистрация' : forgot ? 'Восстановление доступа' : 'Вход в группу';

  function changeMode(next: Mode) {
    setMode(next); setMessage(''); setError(''); setPassword(''); setRepeat(''); setVisible(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    if ((register || recovery) && password !== repeat) { setError('Пароли не совпадают.'); return; }
    if (!supabase) { setError('Вход и регистрация пока не подключены. Расписание доступно в демоверсии.'); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    setBusy(true);
    try {
      if (recovery) {
        const { error: failure } = await supabase.auth.updateUser({ password });
        if (failure) throw failure;
        onRecovered();
      } else if (register) {
        const { data, error: failure } = await supabase.auth.signUp({ email, password,
          options: { data: { full_name: String(form.get('name') || '').trim(), group_id: GROUP }, emailRedirectTo: window.location.origin },
        });
        if (failure) throw failure;
        if (!data.session) { setMessage('Проверьте почту: отправили ссылку для подтверждения аккаунта.'); setPassword(''); setRepeat(''); }
      } else if (forgot) {
        const { error: failure } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (failure) throw failure;
        setMessage('Если аккаунт с такой почтой существует, на него придёт ссылка для восстановления.');
      } else {
        const { error: failure } = await supabase.auth.signInWithPassword({ email, password });
        if (failure) throw failure;
      }
    } catch (failure) {
      const text = failure instanceof Error ? failure.message : '';
      setError(text.includes('Invalid login') ? 'Неверная почта или пароль.'
        : text.includes('Email not confirmed') ? 'Подтвердите почту по ссылке из письма.'
        : text.includes('rate limit') ? 'Слишком много попыток. Попробуйте немного позже.'
        : 'Не удалось выполнить запрос. Проверьте соединение и введённые данные.');
    } finally { setBusy(false); }
  }

  return <main className={styles.page}>
    <section className={styles.panel} aria-labelledby="auth-title">
      <CalendarDays size={40} className={styles.logo} />
      <h1 id="auth-title">{title}</h1>
      <p className={styles.group}>{GROUP}</p>
      <form onSubmit={event => void submit(event)} className={styles.form}>
        {!forgot && !recovery && <label>Учебная группа<select name="group"><option>{GROUP}</option></select></label>}
        {register && <label>Имя и фамилия<input name="name" autoComplete="name" maxLength={80} placeholder="Анна Вернадская" required /></label>}
        {!recovery && <label>Электронная почта<input name="email" type="email" autoComplete="email" placeholder="name@example.com" maxLength={254} required /></label>}
        {!forgot && <label>{recovery ? 'Новый пароль' : 'Пароль'}<span className={styles.password}>
          <input name="password" type={visible ? 'text' : 'password'} autoComplete={register || recovery ? 'new-password' : 'current-password'} minLength={register || recovery ? 8 : 1} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} />
          <button type="button" title={visible ? 'Скрыть пароль' : 'Показать пароль'} aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
        </span></label>}
        {(register || recovery) && <label>Повторите пароль<input name="repeat" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} value={repeat} onChange={event => setRepeat(event.target.value)} /></label>}
        {mode === 'login' && !recovery && <button type="button" className={styles.forgot} onClick={() => changeMode('forgot')}>Забыли пароль?</button>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={styles.message} role="status">{message}</p>}
        <button className={styles.primary} disabled={busy} type="submit">
          {busy ? <LoaderCircle size={20} className={styles.spinner} /> : recovery || forgot ? <KeyRound size={20} /> : register ? <UserPlus size={20} /> : <LogIn size={20} />}
          {busy ? 'Подождите…' : recovery ? 'Сохранить пароль' : register ? 'Зарегистрироваться' : forgot ? 'Отправить ссылку' : 'Войти'}
        </button>
      </form>
      {!recovery && <div className={styles.footer}>
        {mode === 'login' ? <p>Нет аккаунта? <button onClick={() => changeMode('register')}>Зарегистрироваться</button></p>
          : <button className={styles.back} onClick={() => changeMode('login')}><ArrowLeft size={16} /> Вернуться ко входу</button>}
      </div>}
    </section>
    {!recovery && <button className={styles.demo} onClick={onDemo}>Открыть демоверсию <ArrowRight size={17} /></button>}
  </main>;
}
