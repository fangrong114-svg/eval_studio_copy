import React from 'react';
import { EvaluationProject, Dataset } from '../types';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { ArrowLeft, ExternalLink, CheckCircle2, Circle, Clock, Database, Target, FileText, Activity } from 'lucide-react';

interface ProjectDetailProps {
  project: EvaluationProject;
  datasets: Dataset[];
  onBack: () => void;
}

export function ProjectDetail({ project, datasets, onBack }: ProjectDetailProps) {
  const projectDatasets = datasets.filter(d => project.datasetIds.includes(d.id));

  const getStepIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回任务列表
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
              <Badge variant={project.priority === 'P0' ? 'danger' : 'warning'}>{project.priority}</Badge>
              <Badge variant="outline">{project.type}</Badge>
            </div>
            <p className="text-slate-300 max-w-3xl">{project.goal}</p>
          </div>
          <div className="flex-shrink-0">
            <a 
              href={project.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              查看详细文档 <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-sm font-medium text-slate-400">发起人</p>
            <p className="mt-1 text-sm text-slate-100 font-medium">{project.initiator}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">中台/人员支持</p>
            <p className="mt-1 text-sm text-slate-100">{project.support.join(', ')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">预计周期</p>
            <p className="mt-1 text-sm text-slate-100">{project.cycle}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">最后更新</p>
            <p className="mt-1 text-sm text-slate-100">{project.lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress & Steps */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" />
              当前进度
            </h2>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-300">总体完成度</span>
                <span className="font-bold text-indigo-400">{project.progress}%</span>
              </div>
              <ProgressBar progress={project.progress} className="h-3" />
            </div>

            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/20 before:to-transparent">
              {project.steps.map((step, index) => (
                <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white/10 bg-black/40 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border border-white/10 bg-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-100">{step.id}. {step.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center">
                      负责人: <span className="font-medium ml-1 text-slate-300">{step.owner}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datasets */}
          <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-indigo-500" />
              评测集 ({projectDatasets.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectDatasets.map(ds => (
                <div key={ds.id} className="p-4 border border-white/10 rounded-lg hover:border-indigo-400/50 transition-colors bg-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-100">{ds.name}</h3>
                    <Badge variant="info">{ds.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{ds.description}</p>
                  <div className="text-xs font-medium text-slate-500">
                    数据量: {ds.size}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-sm font-medium text-slate-100 mb-1">已生成评测数据状态</h4>
              <p className="text-sm text-slate-300">{project.generatedDataStatus}</p>
            </div>
          </div>

          {/* Dimensions */}
          <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-500" />
              评测维度及定义
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">维度名称</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">类型</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">定义/标准</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {project.dimensions.map((dim, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-100">{dim.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Badge variant={dim.type === '客观' ? 'default' : 'warning'}>{dim.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{dim.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Analysis */}
          <div className="glass-panel p-6 rounded-xl border border-white/10 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" />
              评测结果分析
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <h4 className="text-sm font-bold text-indigo-300 mb-2">核心结论</h4>
                <p className="text-sm text-indigo-200">{project.resultSummary}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-100 mb-2">详细分析</h4>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {project.analysis}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
