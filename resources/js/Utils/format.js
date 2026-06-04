// Shared date formatting — replaces the ~10 per-file fmtDate definitions.
const MS_DAY = 86400000;

// "Jan 5, 2026"
export const fmtDate = (s) => s
    ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

// "January 5, 2026"
export const fmtDateLong = (s) => s
    ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

// "Jan 5" (no year)
export const fmtDateShort = (s) => s
    ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

// { day: 5, mon: 'Jan' } — for calendar-style date chips
export const parseDay = (s) => {
    const d = new Date(s);
    return { day: d.getDate(), mon: d.toLocaleString('en-US', { month: 'short' }) };
};

// Human relative due label: "3d overdue", "Due today", "Due tomorrow", "Due Jan 5"
export const dueLabel = (s) => {
    if (!s) return 'No due date';
    const today = new Date(new Date().toDateString());
    const diff = Math.round((new Date(s) - today) / MS_DAY);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due ${fmtDateShort(s)}`;
};

export const isOverdue = (s) => !!s && new Date(s) < new Date(new Date().toDateString());
