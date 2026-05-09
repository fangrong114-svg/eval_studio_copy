import React from 'react';
import { Download, RotateCcw, Trophy, Check } from 'lucide-react';
import { EvalParadigm, VoteRecord, EvaluationItem, VotingStats } from '../types';
import { calculateArenaRankModelStats, getBordaScore, isArenaRankVote, sortRanking } from '../rankingUtils';

interface ResultsScreenProps {
  votes: VoteRecord[];
  items: EvaluationItem[];
  onReset: () => void;
  userName?: string;
  modelNames: { a: string; b: string };
  models?: { id: string; name: string }[];
  paradigm?: EvalParadigm;
  onGoToDashboard?: () => void;
}

const escapeCsvField = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const ResultsScreen: React.FC<ResultsScreenProps> = ({ votes, items, onReset, userName, modelNames, models = [], paradigm = 'Arena', onGoToDashboard }) => {
  const isArenaRank = paradigm === 'Arena-rank';
  const rankVotes = votes.filter(isArenaRankVote);
  const rankStats = calculateArenaRankModelStats(rankVotes);
  const maxRankCount = Math.max(0, ...rankVotes.map(v => v.ranking?.length || 0));

  // Calculate Stats
  const stats: VotingStats = votes.reduce(
    (acc, curr) => {
      acc.total++;
      if (curr.vote === 'A') acc.aCount++;
      else if (curr.vote === 'B') acc.bCount++;
      else acc.tieCount++;
      return acc;
    },
    { total: 0, aCount: 0, bCount: 0, tieCount: 0 }
  );

  const aPercent = stats.total ? Math.round((stats.aCount / stats.total) * 100) : 0;
  const bPercent = stats.total ? Math.round((stats.bCount / stats.total) * 100) : 0;
  const tiePercent = stats.total ? 100 - aPercent - bPercent : 0;

  const downloadCSV = () => {
    if (isArenaRank) {
      const modelList = models.length > 0
        ? models
        : rankStats.map(stat => ({ id: stat.modelId, name: stat.modelName }));
      const rankHeaders = Array.from({ length: maxRankCount }, (_, idx) => `rank_${idx + 1}`);
      const modelHeaders = modelList.flatMap(model => [`${model.name}_rank`, `${model.name}_score`]);
      const headers = ['ItemID', 'Timestamp', 'User', ...rankHeaders, ...modelHeaders, 'ranking_json'];
      const rows = rankVotes.map(v => {
        const ranking = sortRanking(v.ranking);
        const rankValues = rankHeaders.map((_, idx) => {
          const entry = ranking[idx];
          return entry ? `${entry.modelName} (${entry.modelId})` : '';
        });
        const modelValues = modelList.flatMap(model => {
          const entry = ranking.find(candidate => candidate.modelId === model.id);
          return [
            entry?.rank || '',
            entry ? getBordaScore(entry.rank, ranking.length) : ''
          ];
        });
        return [
          v.itemId,
          new Date(v.timestamp).toISOString(),
          userName || v.user || 'Anonymous',
          ...rankValues,
          ...modelValues,
          JSON.stringify(ranking)
        ].map(escapeCsvField).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `arena_rank_results_${userName || 'anon'}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Standard cols: ItemID, ModelA_URL, ModelB_URL, Winner, Timestamp, User, ModelA_Name, ModelB_Name, References
    const headers = ['ItemID', 'ModelA_URL', 'ModelB_URL', 'Winner', 'Timestamp', 'User', 'ModelA_Name', 'ModelB_Name', 'References'];
    const rows = votes.map(v => {
      const item = items.find(i => i.id === v.itemId);
      return [
        v.itemId,
        item?.modelA_Url || '',
        item?.modelB_Url || '',
        v.vote,
        new Date(v.timestamp).toISOString(),
        userName || 'Anonymous',
        modelNames.a,
        modelNames.b,
        item?.referenceUrls ? item.referenceUrls.join(' | ') : ''
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `results_${userName || 'anon'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isArenaRank) {
    return (
      <div className="max-w-6xl mx-auto p-6 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full mb-4 ring-8 ring-amber-500/5">
            <Trophy size={32} />
          </div>
          <h1 className="text-4xl font-bold text-slate-200 mb-2">Arena-rank 完成</h1>
          <p className="text-slate-300">{userName || 'Evaluator'} 的多视频排名结果</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {rankStats.slice(0, 3).map((stat, index) => (
            <div key={stat.modelId} className={`p-5 rounded-xl border shadow-md shadow-black/20 ${index === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Rank {index + 1}</div>
              <h3 className="font-bold text-slate-100 truncate" title={stat.modelName}>{stat.modelName}</h3>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-amber-300">{stat.totalScore}</div>
                  <div className="text-[10px] text-slate-400">总积分</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{stat.averageRank.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">平均名次</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{stat.firstPlaceCount}</div>
                  <div className="text-[10px] text-slate-400">第一名</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-panel/5 rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 glass-panel/5 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200">逐 case 排名明细</h3>
            <div className="flex gap-2">
              <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 text-slate-200 hover:text-white glass-panel-hover rounded-lg transition-colors font-medium text-sm">
                <RotateCcw size={16} /> 返回发起任务
              </button>
              {onGoToDashboard && (
                <button onClick={onGoToDashboard} className="flex items-center gap-2 px-4 py-2 text-slate-200 hover:text-white glass-panel-hover rounded-lg transition-colors font-medium text-sm">
                  返回大盘
                </button>
              )}
              <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-2 bg-black/40 glass-panel-hover text-white rounded-lg transition-colors font-medium text-sm shadow-md">
                <Download size={16} /> 下载 CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-300 uppercase border-b border-white/10">ID</th>
                  <th className="p-4 text-xs font-semibold text-slate-300 uppercase border-b border-white/10">实际排名</th>
                  <th className="p-4 text-xs font-semibold text-slate-300 uppercase border-b border-white/10 text-right">时间</th>
                </tr>
              </thead>
              <tbody>
                {rankVotes.map((v, i) => (
                  <tr key={i} className="border-b border-white/10 glass-panel-hover">
                    <td className="p-4 text-sm text-slate-200 font-mono">{v.itemId}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {sortRanking(v.ranking).map(entry => (
                          <span key={entry.modelId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10">
                            <span className="text-amber-300">#{entry.rank}</span>
                            {entry.modelName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-200 text-right">{new Date(v.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-4 ring-8 ring-yellow-50">
          <Trophy size={32} />
        </div>
        <h1 className="text-4xl font-bold text-slate-200 mb-2">评测完成</h1>
        <p className="text-slate-200">干得好，{userName || '评测者'}！以下是模型的表现。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Stat Cards */}
        <div className={`p-6 rounded-2xl border-2 ${stats.aCount >= stats.bCount ? 'bg-blue-500/10 border-blue-200' : 'glass-panel/5 border-white/10'} shadow-md shadow-black/20`}>
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500/80"></span>
            {modelNames.a}
          </h3>
          <div className="text-4xl font-bold text-slate-200 mb-2">{stats.aCount} <span className="text-sm font-normal text-slate-200">票</span></div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500/80" style={{ width: `${aPercent}%` }}></div>
          </div>
          <p className="text-xs text-slate-200 mt-2">{aPercent}% 胜率</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel shadow-md shadow-black/20">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-1">平局</h3>
          <div className="text-4xl font-bold text-slate-200 mb-2">{stats.tieCount} <span className="text-sm font-normal text-slate-200">票</span></div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
             <div className="h-full bg-slate-400" style={{ width: `${tiePercent}%` }}></div>
          </div>
          <p className="text-xs text-slate-200 mt-2">{tiePercent}% 比例</p>
        </div>

        <div className={`p-6 rounded-2xl border-2 ${stats.bCount >= stats.aCount ? 'bg-amber-500/10 border-indigo-200' : 'glass-panel/5 border-white/10'} shadow-md shadow-black/20`}>
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {modelNames.b}
          </h3>
          <div className="text-4xl font-bold text-slate-200 mb-2">{stats.bCount} <span className="text-sm font-normal text-slate-200">票</span></div>
           <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${bPercent}%` }}></div>
          </div>
          <p className="text-xs text-slate-200 mt-2">{bPercent}% 胜率</p>
        </div>
      </div>

      <div className="glass-panel/5 rounded-xl shadow-lg border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 glass-panel/5 flex justify-between items-center">
          <h3 className="font-semibold text-slate-200">详细明细</h3>
          <div className="flex gap-2">
             <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 text-slate-200 hover:text-slate-200 glass-panel-hover rounded-lg transition-colors font-medium text-sm"
            >
              <RotateCcw size={16} /> 返回发起任务
            </button>
            {onGoToDashboard && (
              <button
                onClick={onGoToDashboard}
                className="flex items-center gap-2 px-4 py-2 text-slate-200 hover:text-slate-200 glass-panel-hover rounded-lg transition-colors font-medium text-sm"
              >
                返回大盘
              </button>
            )}
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-5 py-2 bg-black/40 glass-panel-hover text-white rounded-lg transition-colors font-medium text-sm shadow-md"
            >
              <Download size={16} /> 下载 CSV
            </button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="glass-panel/5 sticky top-0">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-200 uppercase border-b border-white/10">ID</th>
                <th className="p-4 text-xs font-semibold text-slate-200 uppercase border-b border-white/10">获胜者</th>
                <th className="p-4 text-xs font-semibold text-slate-200 uppercase border-b border-white/10 text-right">时间</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((v, i) => (
                <tr key={i} className="border-b border-white/10 glass-panel-hover">
                  <td className="p-4 text-sm text-slate-200 font-mono">{v.itemId}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${v.vote === 'A' ? 'bg-blue-500/80/20 text-amber-300' : 
                        v.vote === 'B' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-slate-200'}`}>
                      {v.vote === 'Tie' ? '平局' : v.vote === 'A' ? modelNames.a : modelNames.b}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-200 text-right">
                    {new Date(v.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
