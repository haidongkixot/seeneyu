# M22 — User Activity Analytics Dashboard Spec
> Designer: M22 delivery
> Date: 2026-03-25
> Status: READY FOR IMPLEMENTATION

---

## Overview

Admin-only analytics dashboard at `/admin/analytics`. Tracks user engagement: daily/weekly/monthly active users, session counts, learning progress curves, practice frequency. Per-user drill-down view.

**Visual language**: Data-dense but clean. Stat cards at top, charts below, user table at bottom. Dark chart backgrounds with accent-colored data lines. Consistent with admin CMS patterns.

---

## Screen 1: `/admin/analytics` — Dashboard Overview

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  📊 User Analytics                                   Last 30 days ▾  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ DAU       │  │ WAU       │  │ MAU       │  │ Sessions  │           │
│  │ 24        │  │ 89        │  │ 142       │  │ 1,247     │           │
│  │ ↑ 12%     │  │ ↑ 8%      │  │ → 0%      │  │ ↑ 15%     │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Active Users (30d)               │  │ Session Duration (avg)    │  │
│  │ [line chart: DAU over time]     │  │ [bar chart: daily avg]    │  │
│  └──────────────────────────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Learning Progress                │  │ Feature Usage             │  │
│  │ [stacked area: skills over time]│  │ [horizontal bars]         │  │
│  └──────────────────────────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ User Activity Table                                    [Search] ││
│  │ Name         Email           Last Active  Sessions  Score  Plan ││
│  │ Sarah Chen   sarah@..        2h ago       47        72     Std  ││
│  │ Marcus W.    marcus@..       1d ago       12        45     Free ││
│  │ ...                                                             ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

---

### StatCard Component

```tsx
function StatCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string
  value: string | number
  change?: { value: number; period: string }
  icon: LucideIcon
}) {
  const isPositive = change && change.value > 0
  const isNeutral = change && change.value === 0

  return (
    <div className="flex flex-col p-5 rounded-2xl bg-bg-surface border border-white/8 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-accent-400/10 flex items-center justify-center">
          <Icon size={16} className="text-accent-400" />
        </div>
      </div>

      <span className="text-3xl font-extrabold text-text-primary tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>

      {change && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${
          isPositive ? 'text-success' : isNeutral ? 'text-text-tertiary' : 'text-error'
        }`}>
          {isPositive ? <TrendingUp size={12} /> : isNeutral ? <Minus size={12} /> : <TrendingDown size={12} />}
          <span>{isPositive ? '+' : ''}{change.value}%</span>
          <span className="text-text-tertiary font-normal">vs {change.period}</span>
        </div>
      )}
    </div>
  )
}
```

### Stat Cards Grid

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <StatCard label="DAU" value={stats.dau} change={{ value: 12, period: 'last week' }} icon={Users} />
  <StatCard label="WAU" value={stats.wau} change={{ value: 8, period: 'last week' }} icon={Calendar} />
  <StatCard label="MAU" value={stats.mau} change={{ value: 0, period: 'last month' }} icon={CalendarDays} />
  <StatCard label="Sessions" value={stats.totalSessions} change={{ value: 15, period: 'last week' }} icon={Activity} />
</div>
```

---

### DateRangeSelector

```tsx
function DateRangeSelector({
  range,
  onChange,
}: {
  range: '7d' | '30d' | '90d' | 'all'
  onChange: (r: '7d' | '30d' | '90d' | 'all') => void
}) {
  const options = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: 'all', label: 'All time' },
  ]

  return (
    <div className="inline-flex items-center p-1 rounded-lg bg-bg-inset border border-white/8">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value as any)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
            range === opt.value
              ? 'bg-bg-surface text-text-primary shadow-sm'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

---

### ChartPanel Container

Consistent wrapper for all charts:

```tsx
function ChartPanel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-bg-surface border border-white/8 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/6">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}
```

### Chart Grid

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <ChartPanel title="Active Users (30d)">
    {/* Line chart: x=date, y=DAU. Amber line, area fill accent-400/10 */}
    <LineChart data={dauData} color="#fbbf24" />
  </ChartPanel>

  <ChartPanel title="Session Duration (avg)">
    {/* Bar chart: x=date, y=avg minutes. Amber bars */}
    <BarChart data={durationData} color="#fbbf24" />
  </ChartPanel>

  <ChartPanel title="Learning Progress">
    {/* Stacked area: one line per skill. Uses skill badge colors */}
    <StackedAreaChart data={progressData} colors={skillColors} />
  </ChartPanel>

  <ChartPanel title="Feature Usage">
    {/* Horizontal bars: Library, Arcade, Practice, Foundation, Record */}
    <HorizontalBarChart data={featureData} color="#fbbf24" />
  </ChartPanel>
</div>
```

**Chart library recommendation**: `recharts` (already common in Next.js projects) or lightweight `@tremor/react`. Use dark theme: chart backgrounds transparent, grid lines `rgba(255,255,255,0.06)`, axis labels `text-text-tertiary`.

**Chart colors**:
- Primary line/bar: `#fbbf24` (accent-400)
- Skill lines: Use skill badge colors (violet `#7c3aed`, cyan `#0891b2`, emerald `#059669`, amber `#d97706`, red `#dc2626`)
- Grid lines: `rgba(255,255,255,0.06)`
- Axis text: `#5c5c72` (text-tertiary)

---

### User Activity Table

```tsx
<div className="rounded-2xl bg-bg-surface border border-white/8 shadow-card overflow-hidden">
  {/* Header */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
    <h3 className="text-sm font-semibold text-text-primary">User Activity</h3>
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
      <input
        type="text"
        placeholder="Search users..."
        className="pl-9 pr-4 py-2 rounded-lg bg-bg-inset border border-white/10
                   text-sm text-text-primary placeholder:text-text-tertiary
                   focus:border-accent-400/60 focus:shadow-glow-sm outline-none
                   transition-all duration-150 w-56"
      />
    </div>
  </div>

  {/* Table */}
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-white/8">
        <th className="text-left py-3 px-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">User</th>
        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Last Active</th>
        <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Sessions</th>
        <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Avg Score</th>
        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Plan</th>
        <th className="py-3 px-4"></th>
      </tr>
    </thead>
    <tbody>
      {users.map(user => (
        <tr key={user.id} className="border-b border-white/6 last:border-0
                                      hover:bg-bg-overlay/30 transition-colors">
          <td className="py-3 px-5">
            <div>
              <p className="text-sm font-medium text-text-primary">{user.name}</p>
              <p className="text-xs text-text-tertiary">{user.email}</p>
            </div>
          </td>
          <td className="py-3 px-4 text-sm text-text-secondary">{user.lastActive}</td>
          <td className="py-3 px-4 text-sm text-text-primary text-right tabular-nums">{user.sessionCount}</td>
          <td className="py-3 px-4 text-sm text-text-primary text-right tabular-nums">{user.avgScore}</td>
          <td className="py-3 px-4"><PlanBadge plan={user.plan} /></td>
          <td className="py-3 px-4">
            <Link href={`/admin/analytics/users/${user.id}`}
                  className="text-xs text-accent-400 hover:underline">
              View
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Screen 2: `/admin/analytics/users/[id]` — Per-User Detail

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Analytics              Sarah Chen                         │
│                                   sarah.chen@example.com    [Std]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Sessions  │  │ Avg Score │  │ Streak    │  │ Since     │           │
│  │ 47        │  │ 72        │  │ 5 days    │  │ 14d ago   │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ Skill Radar                      │ Activity Timeline             ││
│  │ [radar chart: 5 skills]          │ [heatmap or timeline dots]    ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ Recent Activity                                                  ││
│  │ 2h ago — Practiced "Power Stance" — Score: 78                   ││
│  │ 5h ago — Watched "Eye Contact Mastery" (library)                ││
│  │ 1d ago — Completed Arcade challenge: "Confident Gaze" — 85     ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### User Profile Header

```tsx
<div className="flex items-start gap-4 mb-8">
  {/* Avatar placeholder */}
  <div className="w-12 h-12 rounded-full bg-accent-400/15 border border-accent-400/20
                  flex items-center justify-center text-lg font-bold text-accent-400">
    {user.name.charAt(0)}
  </div>
  <div>
    <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
    <p className="text-sm text-text-secondary">{user.email}</p>
  </div>
  <PlanBadge plan={user.plan} />
</div>
```

### Skill Radar Chart

5-axis radar chart using skill colors. Axes: Eye Contact, Open Posture, Active Listening, Vocal Pacing, Confident Disagreement.

```tsx
// Chart config
const radarConfig = {
  axes: ['Eye Contact', 'Open Posture', 'Active Listening', 'Vocal Pacing', 'Confident Disagreement'],
  maxValue: 100,
  gridColor: 'rgba(255,255,255,0.06)',
  fillColor: 'rgba(251,191,36,0.15)',
  strokeColor: '#fbbf24',
  dotColor: '#fbbf24',
}
```

### Activity Timeline

Recent events in a vertical timeline:

```tsx
function ActivityItem({ event }: { event: ActivityEvent }) {
  const iconMap = {
    practice: <Target size={14} className="text-accent-400" />,
    watch: <Play size={14} className="text-info" />,
    arcade: <Zap size={14} className="text-violet-400" />,
    quiz: <BookOpen size={14} className="text-success" />,
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
        {iconMap[event.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{event.description}</p>
        <p className="text-xs text-text-tertiary mt-0.5">{event.timeAgo}</p>
      </div>
      {event.score !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-pill ${
          event.score >= 70 ? 'text-success bg-success/10' :
          event.score >= 40 ? 'text-warning bg-warning/10' :
          'text-error bg-error/10'
        }`}>
          {event.score}
        </span>
      )}
    </div>
  )
}
```

---

## Mobile Behavior

| Screen | Mobile |
|---|---|
| Stat cards | 2-col grid |
| Charts | Full-width stacked, single column |
| User table | Horizontal scroll; hide email + plan columns on mobile |
| User detail | Stack radar + timeline vertically |

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/app/admin/analytics/page.tsx` | **NEW** — dashboard overview |
| `src/app/admin/analytics/users/[id]/page.tsx` | **NEW** — per-user detail |
| `src/components/admin/StatCard.tsx` | **NEW** |
| `src/components/admin/ChartPanel.tsx` | **NEW** |
| `src/components/admin/DateRangeSelector.tsx` | **NEW** |
| `src/components/admin/ActivityTimeline.tsx` | **NEW** |
| `src/components/admin/UserActivityTable.tsx` | **NEW** |
| `src/components/admin/SkillRadarChart.tsx` | **NEW** |
| `src/app/admin/layout.tsx` or sidebar | **MODIFY** — add Analytics nav link |
