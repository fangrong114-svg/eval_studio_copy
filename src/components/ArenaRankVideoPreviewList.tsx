import React from 'react';
import { ExternalLink } from 'lucide-react';
import MediaRenderer from './MediaRenderer';

export interface ArenaRankVideoPreviewEntry {
  id: string;
  modelName: string;
  rankLabel: string;
  metaLabel?: string;
  videoUrl?: string;
}

interface ArenaRankVideoPreviewListProps {
  entries: ArenaRankVideoPreviewEntry[];
}

const ArenaRankVideoPreviewList: React.FC<ArenaRankVideoPreviewListProps> = ({ entries }) => (
  <div className="flex flex-wrap gap-3 min-w-[360px]">
    {entries.map(entry => (
      <div key={`${entry.id}-${entry.rankLabel}`} className="w-[184px] overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-b border-white/10">
          <span className="text-xs font-semibold text-amber-300">{entry.rankLabel}</span>
          {entry.videoUrl && (
            <a
              href={entry.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="打开视频链接"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        <div className="h-[104px] bg-black/30">
          {entry.videoUrl ? (
            <MediaRenderer
              url={entry.videoUrl}
              isActive={false}
              forceType="video"
              videoPreload="metadata"
              className="rounded-none border-0 shadow-none"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center px-3 text-center text-xs text-slate-500">
              暂无视频链接
            </div>
          )}
        </div>

        <div className="px-2.5 py-2">
          <div className="truncate text-xs font-medium text-slate-200" title={entry.modelName}>
            {entry.modelName}
          </div>
          {entry.metaLabel && (
            <div className="mt-0.5 text-[11px] text-slate-400">{entry.metaLabel}</div>
          )}
        </div>
      </div>
    ))}
  </div>
);

export default ArenaRankVideoPreviewList;
