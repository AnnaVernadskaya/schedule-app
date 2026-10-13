import { CalendarDays, Clock3, Video, ExternalLink, X, UserRound, BookOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { GROUP, safeUrl, subjectColors, type Lesson } from '../types';
import styles from './Schedule.module.css';

type Props = { lesson: Lesson | null; onClose: () => void; mobile: boolean; demo: boolean };
const dateFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

export default function LessonDetails({ lesson, onClose, mobile, demo }: Props) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!lesson || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = panel.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = before; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [lesson, mobile, onClose]);

  if (!lesson) return <aside className={styles.details} aria-label="Подробности занятия">
    <div className={styles.empty}><CalendarDays size={50} strokeWidth={1.5} /><h2>Занятие не выбрано</h2><p>Выберите занятие в расписании,<br />чтобы посмотреть подробности.</p></div>
  </aside>;
  const join = safeUrl(lesson.meeting_url), recording = safeUrl(lesson.recording_url);
  const color = subjectColors[lesson.color] || subjectColors.blue;
  return <>
    {mobile && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
    <aside ref={panel} className={`${styles.details} ${mobile ? styles.mobileDetails : ''}`} role={mobile ? 'dialog' : undefined} aria-modal={mobile ? true : undefined} aria-labelledby="lesson-title">
      <div className={styles.detailTop}><span>{dateFormat.format(new Date(lesson.starts_at))}</span><button onClick={onClose} className={styles.iconButton} aria-label="Закрыть подробности" title="Закрыть подробности"><X size={21} /></button></div>
      <h2 id="lesson-title" className={styles.lessonHeading}>{lesson.subject}</h2>
      <span className={styles.kind} style={{ background: color.background, color: color.accent }}>{lesson.kind}</span>
      <p className={styles.time}><Clock3 size={21} />{timeFormat.format(new Date(lesson.starts_at))}–{timeFormat.format(new Date(lesson.ends_at))}</p>
      <div className={styles.detailField}><span><UserRound size={16} />Преподаватель</span><p>{lesson.teacher}</p></div>
      <div className={styles.detailField}><span><BookOpen size={16} />Тема занятия</span><p>{lesson.topic}</p></div>
      {join ? <a className={styles.join} href={join} target="_blank" rel="noopener noreferrer"><ExternalLink size={20} />Подключиться</a>
        : <><button className={styles.join} disabled><ExternalLink size={20} />Подключиться</button><p className={styles.linkNote}>{demo ? 'Ссылка недоступна в демоверсии' : 'Ссылка появится перед занятием'}</p></>}
      <div className={styles.recording}><Video size={22} /><div><h3>Запись занятия</h3>{recording ? <a href={recording} target="_blank" rel="noopener noreferrer">Смотреть запись <ExternalLink size={13} /></a> : <p>{demo ? 'В демоверсии записи нет' : 'Запись пока не добавлена'}</p>}</div></div>
      <div className={styles.detailField}><span>Группа</span><p>{GROUP}</p></div>
    </aside>
  </>;
}
