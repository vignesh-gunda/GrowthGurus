export interface PostCardProps {
  platform: string;
  title: string;
  dataset: string;
  engagement: number;
  heat: number;
  date: string;
  hashtags: string[];
  caption: string;
}

export function PostCard({
  platform,
  title,
  dataset,
  engagement,
  heat,
  date,
  hashtags,
  caption
}: PostCardProps) {
  return (
    <div className="rounded-[18px] border border-[var(--panel-border)] bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
            {platform}
          </div>
          <h3 className="mt-1.5 text-lg font-bold tracking-[-0.02em]">{title}</h3>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{dataset}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[12px] bg-white/50 p-3">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">Engagement</div>
          <div className="mt-1 text-sm font-bold">{engagement.toLocaleString()}</div>
        </div>
        <div className="rounded-[12px] bg-white/50 p-3">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">Heat</div>
          <div className="mt-1 text-sm font-bold">{heat}</div>
        </div>
      </div>

      <div className="mt-3 text-xs text-[var(--ink-soft)]">{date}</div>

      <div className="mt-3 flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <span key={tag} className="inline-block rounded-full bg-[var(--panel-border)] px-2.5 py-1 text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">{caption}</p>
    </div>
  );
}
