import React, { useState } from 'react';
import { ModelBaseline } from '../types';
import { Badge } from './Badge';
import { LineChart, Search, TrendingUp } from 'lucide-react';

export function ModelBaselines({ baselines }: { baselines: ModelBaseline[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = baselines.filter(b => 
    b.modelName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center">
          <LineChart className="w-6 h-6 mr-2 text-indigo-500" />
          模型基线 (Leaderboard)
        </h1>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-white/10 shadow-sm flex items-center">
        <Search className="w-5 h-5 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="搜索模型名称或厂商..."
          className="w-full bg-transparent outline-none text-sm text-slate-200 placeholder-slate-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel rounded-xl border border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">模型名称</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">厂商/来源</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">模态</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">版本</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">核心指标表现</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">更新时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((baseline) => (
                <tr key={baseline.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" />
                      <span className="text-sm font-medium text-slate-100">{baseline.modelName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {baseline.provider === '自研' ? <Badge variant="info">自研</Badge> : baseline.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {baseline.modality}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {baseline.version}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {baseline.scores.map((score, idx) => (
                        <div key={idx} className="text-xs flex items-center justify-between bg-white/5 px-2 py-1 rounded border border-white/10">
                          <span className="text-slate-400 truncate max-w-[150px]" title={score.datasetName}>{score.datasetName}</span>
                          <span className="font-medium text-indigo-400 ml-2">{score.score}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {baseline.updateDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              没有找到匹配的模型基线数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
