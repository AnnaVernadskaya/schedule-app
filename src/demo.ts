import { GROUP, type Lesson } from './types';

const subjects = [
  { subject: 'Веб-разработка', teacher: 'Петрова Мария Андреевна', topic: 'Компоненты и состояние приложения', color: 'violet', kind: 'Практика' },
  { subject: 'Анализ данных', teacher: 'Смирнов Павел Олегович', topic: 'Подготовка и исследование данных', color: 'blue', kind: 'Лекция' },
  { subject: 'Базы данных', teacher: 'Кузнецова Елена Викторовна', topic: 'Связи между таблицами', color: 'green', kind: 'Практика' },
  { subject: 'Английский язык', teacher: 'Соколова Ольга Игоревна', topic: 'Обсуждение командного проекта', color: 'peach', kind: 'Семинар' },
  { subject: 'Управление проектами', teacher: 'Иванов Алексей Сергеевич', topic: 'Планирование этапов проекта', color: 'pink', kind: 'Семинар' },
];

// The demo follows the current month, so it stays useful after the presentation.
export function createDemoLessons(): Lesson[] {
  const today = new Date();
  const lessons: Lesson[] = [];
  for (let offset = -2; offset <= 3; offset++) {
    const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      if (![2, 4, 6].includes(date.getDay())) continue;
      const index = (day + month.getMonth()) % subjects.length;
      const details = subjects[index];
      const start = new Date(date);
      start.setHours(date.getDay() === 6 ? 11 : 18, date.getDay() === 6 ? 0 : 30);
      const end = new Date(start.getTime() + 90 * 60_000);
      lessons.push({
        ...details, id: `demo-${month.getMonth()}-${day}`, group_id: GROUP,
        starts_at: start.toISOString(), ends_at: end.toISOString(),
        meeting_url: null, recording_url: null,
      });
    }
  }
  return lessons;
}
