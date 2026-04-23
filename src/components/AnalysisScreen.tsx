import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, Users, AlertCircle, PlusCircle, Download, ArrowRight, Database, Loader2 } from 'lucide-react';
import { AggregatedResult, EvalTask } from '../types';
import { RESULTS_TEMPLATE_CSV } from '../constants';
import { db, handleFirestoreError } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Papa from 'papaparse';

interface AnalysisScreenProps {
  onBack: () => void;
  onGoToDashboard?: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ onBack, onGoToDashboard }) => {
  const [aggregatedData, setAggregatedData] = useState<AggregatedResult[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uniqueVoters, setUniqueVoters] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<EvalTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const q = query(collection(db, 'evalTasks'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const fetchedTasks: EvalTask[] = [];
        snapshot.forEach(doc => {
          fetchedTasks.push({ id: doc.id, ...doc.data() } as EvalTask);
        });
        setTasks(fetchedTasks);
      } catch (err) {
        handleFirestoreError(err, 'list', 'evalTasks');
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  const handleImportFromPlatform = async () => {
    if (!selectedTaskId) return;
    setLoadingResults(true);
    setError(null);
    try {
      const votesRef = collection(db, 'evalTasks', selectedTaskId, 'userVotes');
      const snapshot = await getDocs(votesRef);
      
      const newAggregated: Record<string, AggregatedResult> = {};
      const voters = new Set<string>();
      let validRowsFound = 0;

      snapshot.forEach(docSnap => {
        const userData = docSnap.data();
        const userVotes = userData.votes || [];
        const user = docSnap.id;
        
        userVotes.forEach((v: any) => {
          const itemId = v.itemId;
          const winner = v.vote;
          
          if (!itemId || !['A', 'B', 'Tie'].includes(winner)) return;

          validRowsFound++;
          voters.add(user);

          if (!newAggregated[itemId]) {
            newAggregated[itemId] = {
              itemId,
              votes: { A: 0, B: 0, Tie: 0 },
              voters: []
            };
          }

          if (winner === 'A') newAggregated[itemId].votes.A++;
          else if (winner === 'B') newAggregated[itemId].votes.B++;
          else if (winner === 'Tie') newAggregated[itemId].votes.Tie++;
          
          newAggregated[itemId].voters.push(user);
        });
      });

      if (validRowsFound === 0) {
        setError("该任务暂无评测结果。");
      } else {
        setAggregatedData(Object.values(newAggregated));
        setUniqueVoters(voters);
      }
    } catch (err: any) {
      handleFirestoreError(err, 'list', `evalTasks/${selectedTaskId}/userVotes`);
    } finally {
      setLoadingResults(false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setTotalFiles(files.length);
    const newAggregated: Record<string, AggregatedResult> = {};
    const voters = new Set<string>();

    let filesProcessed = 0;
    let validRowsFound = 0;

    Array.from(files).forEach((file: File) => {
      Papa.parse<any>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          results.data.forEach((row: any) => {
            // Find columns dynamically
            const keys = Object.keys(row);
            const itemIdKey = keys.find(k => k.toLowerCase().includes('item id') || k.toLowerCase() === 'id' || k.toLowerCase() === 'itemid');
            const winnerKey = keys.find(k => k.toLowerCase().includes('winner') || k.toLowerCase() === 'result');
            const userKey = keys.find(k => k.toLowerCase().includes('user') || k.toLowerCase() === 'voter');

            const itemId = itemIdKey ? row[itemIdKey] : null;
            const winner = winnerKey ? row[winnerKey] : null;
            const user = (userKey ? row[userKey] : null) || 'Anonymous';

            if (!itemId || !['A', 'B', 'Tie'].includes(winner)) return;

            validRowsFound++;
            voters.add(user);

            if (!newAggregated[itemId]) {
              newAggregated[itemId] = {
                itemId,
                votes: { A: 0, B: 0, Tie: 0 },
                voters: []
              };
            }

            if (winner === 'A') newAggregated[itemId].votes.A++;
            else if (winner === 'B') newAggregated[itemId].votes.B++;
            else if (winner === 'Tie') newAggregated[itemId].votes.Tie++;
            
            newAggregated[itemId].voters.push(user);
          });

          filesProcessed++;
          if (filesProcessed === files.length) {
            if (validRowsFound === 0) {
              setError("未能从上传的文件中识别出有效的投票结果。请确保 CSV 文件包含 'Item ID' 和 'Winner' 列。");
              setTotalFiles(0);
            } else {
              setAggregatedData(Object.values(newAggregated));
              setUniqueVoters(voters);
            }
          }
        },
        error: (err) => {
          console.error("CSV Parse Error:", err);
          filesProcessed++;
        }
      });
    });
  };

  const downloadTemplate = async () => {
    if (!selectedTaskId) {
      setError("请先在左侧选择一个评测任务，然后再下载对应的数据模板。");
      return;
    }

    setIsDownloadingTemplate(true);
    setError(null);

    try {
      const itemsRef = collection(db, 'evalTasks', selectedTaskId, 'items');
      const snapshot = await getDocs(itemsRef);
      
      if (snapshot.empty) {
        setError("该任务没有评测物料数据。");
        setIsDownloadingTemplate(false);
        return;
      }

      const csvData: any[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const row: any = { 'Item ID': doc.id };
        
        // Add original data columns if available
        if (data.originalData) {
          Object.assign(row, data.originalData);
        } else {
          // Fallback if originalData is missing
          if (data.prompt) row['Prompt'] = data.prompt;
          if (data.inputs) {
            Object.assign(row, data.inputs);
          }
          if (data.modelA_Url) row['Model A'] = data.modelA_Url;
          if (data.modelB_Url) row['Model B'] = data.modelB_Url;
        }

        // Add result columns
        row['Winner'] = '';
        row['User'] = '';
        
        csvData.push(row);
      });

      const csvString = Papa.unparse(csvData);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const taskName = tasks.find(t => t.id === selectedTaskId)?.name || 'task';
      link.setAttribute('download', `${taskName}_template.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      handleFirestoreError(err, 'list', `evalTasks/${selectedTaskId}/items`);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Calculate totals
  const totalVotes = aggregatedData.reduce((acc, curr) => acc + curr.votes.A + curr.votes.B + curr.votes.Tie, 0);
  const totalA = aggregatedData.reduce((acc, curr) => acc + curr.votes.A, 0);
  const totalB = aggregatedData.reduce((acc, curr) => acc + curr.votes.B, 0);
  const totalTie = aggregatedData.reduce((acc, curr) => acc + curr.votes.Tie, 0);

  const percentA = totalVotes ? Math.round((totalA / totalVotes) * 100) : 0;
  const percentB = totalVotes ? Math.round((totalB / totalVotes) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 relative">
        {onGoToDashboard && (
          <button 
            onClick={onGoToDashboard}
            className="absolute left-0 top-0 glass-panel glass-panel-hover text-slate-300 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors border border-white/10"
          >
            <ArrowRight className="rotate-180" size={16} /> 返回大盘
          </button>
        )}
        <div className={onGoToDashboard ? "ml-32" : ""}>
          <h1 className="text-3xl font-bold text-slate-100">团队分析大盘</h1>
          <p className="text-slate-400">上传多个 CSV 结果文件以查看汇总统计信息，或在此发起新任务。</p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-black/40 hover:bg-white/5 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all transform hover:-translate-y-0.5"
        >
          去参与评测
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {aggregatedData.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Import from Platform Card */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">一键导入平台结果</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm">
              直接从平台中选择已有的评测任务，一键导入所有成员的评测结果进行分析。
            </p>
            
            <div className="w-full max-w-xs space-y-3">
              <select 
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-4 py-2 glass-input rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                disabled={loadingTasks}
              >
                <option value="">选择评测任务...</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.name} ({task.status === 'completed' ? '已完成' : '进行中'})
                  </option>
                ))}
              </select>
              
              <button 
                onClick={handleImportFromPlatform}
                disabled={!selectedTaskId || loadingResults}
                className={`w-full py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                  !selectedTaskId || loadingResults 
                    ? 'bg-white/10 text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {loadingResults ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                {loadingResults ? '导入中...' : '一键导入'}
              </button>
            </div>
          </div>

          {/* Upload Results Card */}
          <div className="glass-panel border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors flex flex-col justify-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">手动导入外部结果</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm">
              对于外部通过自动化模式跑出来的结果，或者离线收集的数据，可以通过上传 CSV 文件进行汇总。
            </p>
            <label className="inline-flex cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105 mx-auto">
              <input type="file" multiple accept=".csv" className="hidden" onChange={handleFileUpload} />
              选择文件
            </label>
          </div>

          {/* Start New Task Card */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">如何发起团队任务？</h3>
            <div className="text-slate-400 mb-8 max-w-sm mx-auto text-sm text-left space-y-2 bg-white/5 p-4 rounded-xl border border-white/10">
              <p><strong>1.</strong> 在“评测物料”中创建任务并分配给成员。</p>
              <p><strong>2.</strong> 成员在“去参与评测”页面完成任务。</p>
              <p><strong>3.</strong> 任务完成后，在左侧一键导入平台结果。</p>
              <p><strong>4.</strong> 外部自动化结果可通过中间的 CSV 上传导入。</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={downloadTemplate} 
                disabled={!selectedTaskId || isDownloadingTemplate}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors border ${
                  selectedTaskId 
                    ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20' 
                    : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                }`}
              >
                {isDownloadingTemplate ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isDownloadingTemplate ? '生成中...' : (selectedTaskId ? '下载数据模板' : '请先在左侧选择任务')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">参与者</div>
              <div className="flex items-center gap-2 text-2xl font-bold text-slate-100">
                <Users className="text-purple-500" />
                {uniqueVoters.size}
              </div>
              <div className="text-xs text-slate-400 truncate mt-1">
                {Array.from(uniqueVoters).join(', ')}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">总评测数</div>
              <div className="flex items-center gap-2 text-2xl font-bold text-slate-100">
                <FileText className="text-blue-500" />
                {totalVotes}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">模型 A 获胜</div>
              <div className="flex items-center gap-2 text-2xl font-bold text-slate-100">
                <BarChart3 className="text-green-500" />
                {percentA}%
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">模型 B 获胜</div>
              <div className="flex items-center gap-2 text-2xl font-bold text-slate-100">
                <BarChart3 className="text-indigo-500" />
                {percentB}%
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="glass-panel rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200">项目共识</h3>
              <label className="text-xs font-medium text-blue-400 cursor-pointer hover:underline">
                <input type="file" multiple accept=".csv" className="hidden" onChange={handleFileUpload} />
                + 添加更多文件
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-white/10">项目 ID</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-white/10 w-1/3">投票分布</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-white/10">共识度</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase border-b border-white/10">获胜者</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedData.map((item, i) => {
                    const itemTotal = item.votes.A + item.votes.B + item.votes.Tie;
                    const itemWin = item.votes.A > item.votes.B ? 'A' : item.votes.B > item.votes.A ? 'B' : 'Tie';
                    const maxVotes = Math.max(item.votes.A, item.votes.B, item.votes.Tie);
                    const agreement = Math.round((maxVotes / itemTotal) * 100);
                    
                    return (
                      <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-4 text-sm text-slate-300 font-mono">{item.itemId}</td>
                        <td className="p-4">
                          <div className="flex h-2 rounded-full overflow-hidden bg-white/10 w-full max-w-[200px]">
                            <div className="bg-blue-500" style={{ width: `${(item.votes.A / itemTotal) * 100}%` }} title={`A: ${item.votes.A}`} />
                            <div className="bg-slate-500" style={{ width: `${(item.votes.Tie / itemTotal) * 100}%` }} title={`Tie: ${item.votes.Tie}`} />
                            <div className="bg-indigo-500" style={{ width: `${(item.votes.B / itemTotal) * 100}%` }} title={`B: ${item.votes.B}`} />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1 max-w-[200px]">
                            <span>A: {item.votes.A}</span>
                            <span>B: {item.votes.B}</span>
                          </div>
                        </td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs font-medium ${agreement < 60 ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                             {agreement}% 一致
                           </span>
                        </td>
                        <td className="p-4 font-bold text-sm text-slate-200">模型 {itemWin}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisScreen;