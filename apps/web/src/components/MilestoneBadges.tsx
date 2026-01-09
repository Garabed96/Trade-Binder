'use client';

interface MilestoneBadgesProps {
  currentCount: number;
  targetCapacity: number | null;
}

const MILESTONES = [25, 50, 75, 100];

export function MilestoneBadges({
  currentCount,
  targetCapacity,
}: MilestoneBadgesProps) {
  if (!targetCapacity) {
    return null; // No milestones for unlimited capacity binders
  }

  const progressPercent = Math.min(
    Math.floor((currentCount / targetCapacity) * 100),
    100
  );

  return (
    <div className="flex items-center justify-center gap-3">
      {MILESTONES.map(milestone => {
        const isAchieved = progressPercent >= milestone;

        return (
          <div
            key={milestone}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
              isAchieved
                ? 'animate-milestone-unlock border-purple-500 bg-gradient-to-br from-purple-600 to-purple-800 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'border-slate-700 bg-slate-900/60 text-slate-500'
            }`}
          >
            {milestone}%
          </div>
        );
      })}
    </div>
  );
}
