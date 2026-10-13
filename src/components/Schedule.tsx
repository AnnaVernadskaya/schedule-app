import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import type { DatesSetArg, EventContentArg } from '@fullcalendar/core';
import { ChevronLeft, ChevronRight, Filter, CalendarDays, AlertCircle, RefreshCw } from 'lucide-react';
import LessonDetails from './LessonDetails';
import { createDemoLessons } from '../demo';
import { supabase } from '../supabase';
import { GROUP, subjectColors, type Lesson } from '../types';
import styles from './Schedule.module.css';

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin];
const shortSubjects: Record<string, string> = {
  'Веб-разработка': 'Веб', 'Анализ данных': 'АД', 'Базы данных': 'БД',
  'Английский язык': 'Англ.', 'Управление проектами': 'УП',
};
type View = 'dayGridMonth' | 'timeGridWeek' | 'listMonth';
const views: { id: View; label: string }[] = [{ id: 'dayGridMonth', label: 'Месяц' }, { id: 'timeGridWeek', label: 'Неделя' }, { id: 'listMonth', label: 'Список' }];

export default function Schedule({ demo, userId }: { demo: boolean; userId?: string }) {
  const calendar = useRef<FullCalendar>(null);
  const period = useRef('');
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 800px)').matches);
  const [view, setView] = useState<View>(() => mobile ? 'listMonth' : 'dayGridMonth');
  const [title, setTitle] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [subject, setSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const close = useCallback(() => setSelected(null), []);
  const onDatesSet = useCallback((info: DatesSetArg) => {
    const nextPeriod = `${info.view.type}:${info.startStr}:${info.endStr}`;
    setTitle(info.view.title);
    if (period.current !== nextPeriod) {
      period.current = nextPeriod;
      setSelected(null);
    }
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 800px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setLessons([]); setSelected(null);
    async function load() {
      try {
        if (demo) { if (active) setLessons(createDemoLessons()); return; }
        if (!supabase || !userId) throw new Error('no session');
        const { data: membership, error: memberError } = await supabase.from('group_members').select('group_id').eq('user_id', userId).eq('group_id', GROUP).maybeSingle();
        if (memberError || !membership) throw new Error('membership');
        const { data, error: failure } = await supabase.from('lessons').select('*').eq('group_id', membership.group_id).order('starts_at');
        if (failure) throw failure;
        if (active) setLessons(data as Lesson[]);
      } catch {
        if (active) setError('Не удалось загрузить расписание группы. Проверьте соединение или обратитесь к координатору.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [demo, userId, reload]);

  const subjects = useMemo(() => [...new Set(lessons.map(lesson => lesson.subject))].sort((a, b) => a.localeCompare(b, 'ru')), [lessons]);
  const events = useMemo(() => lessons.filter(lesson => subject === 'all' || lesson.subject === subject).map(lesson => {
    const color = subjectColors[lesson.color] || subjectColors.blue;
    return { id: lesson.id, title: lesson.subject, start: lesson.starts_at, end: lesson.ends_at,
      backgroundColor: color.background, borderColor: color.accent, textColor: '#202938',
      classNames: selected?.id === lesson.id ? [styles.selectedEvent] : [],
    };
  }), [lessons, subject, selected]);

  function changeView(next: View) { setView(next); setSelected(null); calendar.current?.getApi().changeView(next); }
  function navigate(action: 'prev' | 'next' | 'today') { setSelected(null); calendar.current?.getApi()[action](); }
  function eventContent(info: EventContentArg) {
    const compact = mobile && view === 'dayGridMonth';
    const label = compact ? shortSubjects[info.event.title] || info.event.title.split(/\s+/).map(word => word[0]).slice(0, 3).join('') : info.event.title;
    return <span className={styles.eventBody}><strong>{info.timeText}</strong><span title={info.event.title}>{label}</span></span>;
  }

  return <main className={styles.page}>
    <div className={styles.heading}><h1>Расписание</h1><p>Группа {GROUP}</p></div>
    <div className={styles.layout}>
      <section className={styles.calendarSection} aria-label="Расписание занятий">
        <div className={styles.toolbar}>
          <div className={styles.navigation}>
            <button className={styles.outlineIcon} title="Предыдущий период" aria-label="Предыдущий период" onClick={() => navigate('prev')}><ChevronLeft size={22} /></button>
            <h2 aria-live="polite">{title}</h2>
            <button className={styles.outlineIcon} title="Следующий период" aria-label="Следующий период" onClick={() => navigate('next')}><ChevronRight size={22} /></button>
            <button className={styles.today} onClick={() => navigate('today')}>Сегодня</button>
          </div>
          <div className={styles.segments} aria-label="Вид расписания">{views.map(item => <button key={item.id} aria-pressed={view === item.id} className={view === item.id ? styles.active : ''} onClick={() => changeView(item.id)}>{item.label}</button>)}</div>
        </div>
        <div className={styles.filters}><Filter size={20} /><select aria-label="Дисциплина" value={subject} onChange={event => { setSubject(event.target.value); setSelected(null); }}><option value="all">Все дисциплины</option>{subjects.map(item => <option key={item}>{item}</option>)}</select></div>
        {loading && <p role="status" className={styles.status}>Загружаем занятия…</p>}
        {error && <div role="alert" className={styles.error}><AlertCircle size={20} /><p>{error}</p><button onClick={() => setReload(reload + 1)}><RefreshCw size={17} />Повторить</button></div>}
        {!loading && !error && lessons.length === 0 && <p className={styles.status}>Занятия пока не добавлены.</p>}
        <div className={styles.calendar} data-testid="calendar">
          <FullCalendar ref={calendar} plugins={plugins} locale={ruLocale} initialView={view} firstDay={1} headerToolbar={false}
            height="auto" fixedWeekCount={false} showNonCurrentDates={true} dayMaxEvents={2} displayEventEnd={false} eventDisplay="block"
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }} events={events} eventContent={eventContent}
            eventClick={info => setSelected(lessons.find(lesson => lesson.id === info.event.id) || null)}
            eventDidMount={info => { info.el.setAttribute('tabindex', '0'); info.el.setAttribute('role', 'button'); info.el.setAttribute('aria-label', `${info.event.title}, ${new Date(info.event.start!).toLocaleString('ru-RU')}`); }}
            datesSet={onDatesSet}
            allDaySlot={false} slotMinTime="08:00:00" slotMaxTime="23:00:00" nowIndicator={true}
            noEventsContent={<div className={styles.noEvents}><CalendarDays size={30} /><span>В этом периоде занятий нет</span></div>}
          />
        </div>
      </section>
      {(!mobile || selected) && <LessonDetails lesson={selected} onClose={close} mobile={mobile} demo={demo} />}
    </div>
  </main>;
}
