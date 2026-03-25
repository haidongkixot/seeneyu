# M23 — Feature Performance Dashboard Spec
> Designer: M23 delivery
> Date: 2026-03-25
> Status: READY FOR IMPLEMENTATION

---

## Overview

Admin-only feature performance dashboard at `/admin/analytics/features`. Tracks system health: crawl job success rates, MediaPipe analysis performance (speed, detection rates, score distributions), content pipeline throughput.

**Visual language**: Operational dashboard. More technical/metric-dense than M22 user dashboard. Status indicators (green/amber/red), histograms, pipeline flow diagrams.

---

## Screen: `/admin/analytics/features` — Feature Performance

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚙️ Feature Performance                             Last 30 days ▾   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Crawl Jobs│  │ Success % │  │ MediaPipe│  │ Avg Speed │           │
│  │ 34        │  │ 88%       │  │ 1,247    │  │ 2.3s      │           │
│  │ ● healthy │  │ ↑ 5%      │  │ analyses │  │ ↓ 12%     │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  ═══════════════════ Crawl Pipeline ═════════════════════            │
│                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Crawl Job Status (30d)           │  │ Results per Job (avg)     │  │
│  │ [stacked bar: ok/fail/pending]  │  │ [bar chart]               │  │
│  └──────────────────────────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ Recent Crawl Jobs                                                ││
│  │ ID       Skill      Status   Results  Duration  Created          ││
│  │ #34      eye-cont.  ✓ done   12       4.2s      2h ago           ││
│  │ #33      vocal-p.   ✓ done   8        3.8s      5h ago           ││
│  │ #32      posture    ✗ fail   0        —         1d ago           ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ═══════════════════ MediaPipe Analysis ═════════════════════        │
│                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Analysis Speed Distribution      │  │ Detection Rate by Type    │  │
│  │ [histogram: ms buckets]         │  │ [horizontal bars %]       │  │
│  └──────────────────────────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Score Distribution               │  │ Errors (30d)             │  │
│  │ [histogram: score buckets 0-100]│  │ [mini error log]         │  │
│  └──────────────────────────────────┘  └──────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### StatusIndicator

Small dot + label for health status:

```tsx
function StatusIndicator({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const config = {
    healthy:  { color: 'bg-success', label: 'Healthy', textColor: 'text-success' },
    degraded: { color: 'bg-warning', label: 'Degraded', textColor: 'text-warning' },
    down:     { color: 'bg-error', label: 'Down', textColor: 'text-error' },
  }[status]

  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${config.textColor}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} ${
        status !== 'healthy' ? 'animate-pulse' : ''
      }`} />
      {config.label}
    </div>
  )
}
```

### MetricStatCard (extends StatCard with health indicator)

```tsx
function MetricStatCard({
  label,
  value,
  unit,
  status,
  change,
  icon: Icon,
}: {
  label: string
  value: string | number
  unit?: string
  status?: 'healthy' | 'degraded' | 'down'
  change?: { value: number; period: string }
  icon: LucideIcon
}) {
  return (
    <div className="flex flex-col p-5 rounded-2xl bg-bg-surface border border-white/8 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center">
          <Icon size={16} className="text-text-secondary" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-text-primary tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-text-tertiary">{unit}</span>}
      </div>

      <div className="flex items-center gap-3 mt-2">
        {status && <StatusIndicator status={status} />}
        {change && (
          <span className={`text-xs font-semibold ${
            change.value > 0 ? 'text-success' : change.value < 0 ? 'text-error' : 'text-text-tertiary'
          }`}>
            {change.value > 0 ? '↑' : change.value < 0 ? '↓' : '→'} {Math.abs(change.value)}%
          </span>
        )}
      </div>
    </div>
  )
}
```

---

### Section Divider

Used to separate Crawl Pipeline from MediaPipe sections:

```tsx
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="h-px flex-1 bg-white/8" />
      <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
        {title}
      </span>
      <div className="h-px flex-1 bg-white/8" />
    </div>
  )
}
```

---

### Crawl Job Status Table

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-white/8">
      <th className="text-left py-3 px-5 text-xs font-semibold text-text-tertiary uppercase">ID</th>
      <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Skill</th>
      <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Status</th>
      <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Results</th>
      <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Duration</th>
      <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Created</th>
    </tr>
  </thead>
  <tbody>
    {jobs.map(job => (
      <tr key={job.id} className="border-b border-white/6 last:border-0
                                   hover:bg-bg-overlay/30 transition-colors">
        <td className="py-3 px-5 text-sm font-mono text-text-secondary">#{job.id}</td>
        <td className="py-3 px-4">
          <span className="text-sm text-text-primary">{job.skill}</span>
        </td>
        <td className="py-3 px-4">
          <JobStatusBadge status={job.status} />
        </td>
        <td className="py-3 px-4 text-sm text-text-primary text-right tabular-nums">
          {job.resultCount}
        </td>
        <td className="py-3 px-4 text-sm text-text-secondary text-right tabular-nums">
          {job.duration ? `${job.duration}s` : '—'}
        </td>
        <td className="py-3 px-4 text-sm text-text-tertiary">{job.createdAgo}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### JobStatusBadge

```tsx
function JobStatusBadge({ status }: { status: 'pending' | 'running' | 'done' | 'failed' }) {
  const config = {
    pending: { label: 'Pending', classes: 'bg-white/5 text-text-tertiary border-white/10' },
    running: { label: 'Running', classes: 'bg-info/10 text-info border-info/20' },
    done:    { label: 'Done', classes: 'bg-success/10 text-success border-success/20' },
    failed:  { label: 'Failed', classes: 'bg-error/10 text-error border-error/20' },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill
                     text-xs font-semibold border ${config.classes}`}>
      {status === 'running' && <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />}
      {status === 'done' && <Check size={10} />}
      {status === 'failed' && <X size={10} />}
      {config.label}
    </span>
  )
}
```

---

### Histogram Component

Used for speed distribution and score distribution:

```tsx
// Histogram: vertical bars in buckets
function Histogram({
  buckets,
  color = '#fbbf24',
}: {
  buckets: { label: string; count: number }[]
  color?: string
}) {
  const max = Math.max(...buckets.map(b => b.count))

  return (
    <div className="flex items-end gap-1.5 h-40">
      {buckets.map((bucket, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs tabular-nums text-text-tertiary">{bucket.count}</span>
          <div
            className="w-full rounded-t-sm transition-all duration-300"
            style={{
              height: `${(bucket.count / max) * 100}%`,
              backgroundColor: color,
              opacity: 0.7 + (bucket.count / max) * 0.3,
              minHeight: bucket.count > 0 ? '4px' : '0',
            }}
          />
          <span className="text-[10px] text-text-tertiary">{bucket.label}</span>
        </div>
      ))}
    </div>
  )
}
```

**Speed distribution buckets**: <1s, 1-2s, 2-3s, 3-5s, 5-10s, >10s
**Score distribution buckets**: 0-10, 11-20, ..., 91-100

---

### Error Log (mini)

```tsx
function ErrorLog({ errors }: { errors: ErrorEntry[] }) {
  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
      {errors.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4 text-center">No errors in this period</p>
      ) : (
        errors.map((err, i) => (
          <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-error/5 border border-error/10">
            <AlertCircle size={14} className="text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary truncate">{err.message}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">{err.timeAgo} — {err.source}</p>
            </div>
          </div>
        ))
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
| Charts | Full-width stacked |
| Crawl job table | Horizontal scroll; hide duration column on mobile |
| Histograms | Full-width, reduce bucket count (merge nearby) |
| Error log | Unchanged — already compact |

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/app/admin/analytics/features/page.tsx` | **NEW** — feature performance dashboard |
| `src/components/admin/MetricStatCard.tsx` | **NEW** |
| `src/components/admin/StatusIndicator.tsx` | **NEW** |
| `src/components/admin/JobStatusBadge.tsx` | **NEW** |
| `src/components/admin/Histogram.tsx` | **NEW** |
| `src/components/admin/ErrorLog.tsx` | **NEW** |
| `src/components/admin/SectionDivider.tsx` | **NEW** |
| `src/app/admin/analytics/page.tsx` | **MODIFY** — add link to features sub-page |
