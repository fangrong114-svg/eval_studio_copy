import React, { useState, useRef, useEffect } from 'react';
import { Database, Plus, Download, Upload, FileText, Settings, ArrowRight, Trash2, Tag, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { EvalDataset, DatasetSchemaField, SchemaFieldType } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { ConfirmModal } from './ConfirmModal';

interface DatasetRepositoryScreenProps {
  onBack: () => void;
}

const DatasetRepositoryScreen: React.FC<DatasetRepositoryScreenProps> = ({ onBack }) => {
  const [datasets, setDatasets] = useState<EvalDataset[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDatasetId, setUploadingDatasetId] = useState<string | null>(null);
  const [datasetToDelete, setDatasetToDelete] = useState<string | null>(null);
  
  // New Dataset Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [schemaFields, setSchemaFields] = useState<DatasetSchemaField[]>([
    { key: 'id', label: '用例ID', type: 'text' },
    { key: 'prompt', label: '提示词', type: 'text' }
  ]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'evalDatasets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedDatasets: EvalDataset[] = [];
      snapshot.forEach((doc) => {
        loadedDatasets.push({ id: doc.id, ...doc.data() } as EvalDataset);
      });
      setDatasets(loadedDatasets);
    }, (error) => {
      console.error("Error fetching datasets:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleAddField = () => {
    setSchemaFields([...schemaFields, { key: `field_${schemaFields.length + 1}`, label: '新字段', type: 'text' }]);
  };

  const handleUpdateField = (index: number, updates: Partial<DatasetSchemaField>) => {
    const newFields = [...schemaFields];
    newFields[index] = { ...newFields[index], ...updates };
    setSchemaFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
  };

  const confirmDeleteDataset = async () => {
    if (!datasetToDelete) return;
    try {
      await deleteDoc(doc(db, 'evalDatasets', datasetToDelete));
      setDatasetToDelete(null);
    } catch (error: any) {
      console.error("Error deleting dataset:", error);
      alert("删除失败: " + error.message);
      setDatasetToDelete(null);
    }
  };

  const handleCreateDataset = async () => {
    if (!newName.trim() || !auth.currentUser) return;
    
    const newDataset: EvalDataset = {
      id: `ds-${Date.now()}`,
      name: newName,
      description: newDesc,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      inputSchema: schemaFields,
      items: [],
      creatorUid: auth.currentUser.uid,
      creatorName: auth.currentUser.displayName || auth.currentUser.email || 'Unknown',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'evalDatasets', newDataset.id), newDataset);
      setIsCreating(false);
      // Reset form
      setNewName('');
      setNewDesc('');
      setNewTags('');
      setSchemaFields([
        { key: 'id', label: '用例ID', type: 'text' },
        { key: 'prompt', label: '提示词', type: 'text' }
      ]);
    } catch (error) {
      console.error("Error creating dataset:", error);
      alert("创建评测集失败，请重试。");
    }
  };

  const downloadCsvTemplate = (dataset: EvalDataset) => {
    let csvContent = '';
    let filename = '';
    
    if (dataset.items && dataset.items.length > 0) {
      // Download actual data
      csvContent = Papa.unparse(dataset.items);
      filename = `${dataset.name}_data.csv`;
    } else {
      // Download template
      const headers = dataset.inputSchema.map(f => f.key).join(',');
      csvContent = headers + '\n';
      filename = `template_${dataset.id}.csv`;
    }

    // Add BOM for Excel UTF-8 compatibility
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUploadClick = (datasetId: string) => {
    setUploadingDatasetId(datasetId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingDatasetId) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim(),
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        const parsedItems = results.data as Record<string, any>[];
        
        const targetDataset = datasets.find(ds => ds.id === uploadingDatasetId);
        if (targetDataset) {
          try {
            const updatedDataset = {
              ...targetDataset,
              items: parsedItems,
              updatedAt: Date.now()
            };
            await setDoc(doc(db, 'evalDatasets', targetDataset.id), updatedDataset);
          } catch (error) {
            console.error("Error updating dataset with items:", error);
            alert("上传数据失败，请重试。");
          }
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadingDatasetId(null);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('解析 CSV 文件失败，请检查文件格式。');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadingDatasetId(null);
      }
    });
  };

  if (isCreating) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setIsCreating(false)} className="text-slate-300 hover:text-slate-200 transition-colors">
            &larr; 返回列表
          </button>
          <h1 className="text-2xl font-bold text-slate-200">创建新评测集</h1>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-8 space-y-8 shadow-2xl">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <FileText size={20} className="text-amber-500" /> 基本信息
            </h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">评测集名称 *</label>
                <input 
                  type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-400"
                  placeholder="例如：2026 Q1 核心 Prompt 集"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">描述</label>
                <textarea 
                  value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-400"
                  placeholder="描述这个评测集的用途、来源等..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">标签 (逗号分隔)</label>
                <input 
                  type="text" value={newTags} onChange={e => setNewTags(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Text-to-Image, Hard-Prompt"
                />
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Schema Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Settings size={20} className="text-amber-500" /> 定义数据结构 (Schema)
              </h2>
              <button 
                onClick={handleAddField}
                className="text-sm flex items-center gap-1 text-amber-500 hover:text-amber-400 font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg transition-colors border border-amber-500/20"
              >
                <Plus size={16} /> 添加字段
              </button>
            </div>
            <p className="text-sm text-slate-300">
              定义该评测集需要哪些输入参数。系统将根据这些字段生成 CSV 模板供业务同学填写。
            </p>

            <div className="space-y-3 mt-4">
              {schemaFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-300 mb-1.5">字段 Key (英文)</label>
                    <input 
                      type="text" value={field.key} onChange={e => handleUpdateField(idx, { key: e.target.value })}
                      className="w-full px-3 py-2 glass-input rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none placeholder:text-slate-400"
                      placeholder="e.g., prompt"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-300 mb-1.5">显示名称 (中文)</label>
                    <input 
                      type="text" value={field.label} onChange={e => handleUpdateField(idx, { label: e.target.value })}
                      className="w-full px-3 py-2 glass-input rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none placeholder:text-slate-400"
                      placeholder="e.g., 提示词"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-300 mb-1.5">数据类型</label>
                    <select 
                      value={field.type} onChange={e => handleUpdateField(idx, { type: e.target.value as SchemaFieldType })}
                      className="w-full px-3 py-2 glass-input rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none"
                    >
                      <option value="text" className="bg-black/40">纯文本 (Text)</option>
                      <option value="image_url" className="bg-black/40">图片链接 (Image URL)</option>
                      <option value="video_url" className="bg-black/40">视频链接 (Video URL)</option>
                      <option value="chat_history" className="bg-black/40">对话历史 (JSON)</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => handleRemoveField(idx)}
                    className="mt-6 p-2 text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-300 glass-panel-hover hover:text-slate-200 transition-colors text-sm"
            >
              取消
            </button>
            <button 
              onClick={handleCreateDataset}
              disabled={!newName.trim()}
              className="px-6 py-2.5 rounded-xl font-medium bg-gradient-accent text-black shadow-lg shadow-amber-500/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              保存并生成模板
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-10 relative">
        <button 
          onClick={onBack}
          className="absolute left-0 top-0 bg-white/5 glass-panel-hover text-slate-300 px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors border border-white/10"
        >
          <ArrowRight className="rotate-180" size={16} /> 返回大盘
        </button>
        <div className="ml-32">
          <h1 className="text-4xl font-bold text-slate-100 flex items-center gap-3 tracking-tight">
            <Database className="text-amber-500" size={32} /> 评测集仓库
          </h1>
          <p className="text-slate-300 mt-2 text-sm">管理评测输入数据。定义 Schema，下载模板，上传物料。</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-gradient-accent text-black px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-amber-500/20 transition-all hover:opacity-90"
        >
          <Plus size={18} /> 新建评测集
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Hidden file input for CSV upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".csv" 
          onChange={handleFileUpload}
        />
        
        {datasets.map(dataset => (
          <div key={dataset.id} className="glass-panel rounded-2xl border border-white/10 hover:border-white/10 hover:bg-white/[0.05] transition-all p-6 flex flex-col relative group">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setDatasetToDelete(dataset.id);
              }}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="删除评测集"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex justify-between items-start mb-3 pr-8">
              <h3 className="font-bold text-lg text-slate-200 line-clamp-1" title={dataset.name}>{dataset.name}</h3>
              <span className="glass-panel text-slate-300 text-xs px-2.5 py-1 rounded-md font-mono shrink-0">
                {dataset.items.length} items
              </span>
            </div>
            <p className="text-sm text-slate-300 line-clamp-2 mb-5 flex-1">
              {dataset.description || '暂无描述'}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {dataset.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs font-medium bg-amber-500/10 text-amber-500/90 border border-amber-500/20 px-2.5 py-1 rounded-md">
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>

            <div className="pt-5 border-t border-white/10 flex gap-3">
              <button 
                onClick={() => downloadCsvTemplate(dataset)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 glass-panel-hover text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
              >
                <Download size={16} /> {dataset.items.length > 0 ? '下载数据' : '下载模板'}
              </button>
              <button 
                onClick={() => handleFileUploadClick(dataset.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 py-2.5 rounded-xl text-sm font-medium transition-colors border border-amber-500/20"
              >
                {dataset.items.length > 0 ? (
                  <><CheckCircle2 size={16} className="text-emerald-500" /> 重新上传</>
                ) : (
                  <><Upload size={16} /> 上传数据</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!datasetToDelete}
        title="删除评测集"
        message="确定要删除这个评测集吗？此操作不可恢复，相关的评测物料可能无法正常工作。"
        onConfirm={confirmDeleteDataset}
        onCancel={() => setDatasetToDelete(null)}
        confirmText="删除"
      />
    </div>
  );
};

export default DatasetRepositoryScreen;
