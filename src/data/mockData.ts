import { Dataset, EvaluationProject, ModelBaseline } from '../types';

export const mockDatasets: Dataset[] = [
  { id: 'ds-001', name: '通用多模态理解测试集 v1.0', description: '包含1000张各类场景图片及对应的高难度QA', size: '1000', type: '图文QA' },
  { id: 'ds-002', name: 'MV创意文本基准集', description: '人工精选的500个高质量MV创意梗概', size: '500', type: '纯文本' },
  { id: 'ds-003', name: '音乐情感分析测试集', description: '包含200首不同情绪的音乐片段及人工标注的情感标签', size: '200', type: '音频' },
  { id: 'ds-004', name: '日常快速验证集-视觉', description: '用于快速验证视觉模型的小型集合', size: '50', type: '图像' },
];

export const mockBaselines: ModelBaseline[] = [
  {
    id: 'mb-001',
    modelName: 'GPT-4o',
    provider: 'OpenAI',
    modality: '多模态',
    version: '2024-05-13',
    updateDate: '2026-03-15',
    scores: [
      { datasetName: '通用多模态理解测试集 v1.0', score: '88.5%' },
      { datasetName: '日常快速验证集-视觉', score: '92.0%' }
    ]
  },
  {
    id: 'mb-002',
    modelName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    modality: '多模态',
    version: '20240620',
    updateDate: '2026-03-10',
    scores: [
      { datasetName: '通用多模态理解测试集 v1.0', score: '89.2%' },
      { datasetName: '日常快速验证集-视觉', score: '90.5%' }
    ]
  },
  {
    id: 'mb-003',
    modelName: '内部视觉大模型 V2.0',
    provider: '自研',
    modality: '图像生成',
    version: 'v2.0.1',
    updateDate: '2026-03-18',
    scores: [
      { datasetName: 'MV创意文本基准集', score: '85.0 (主观)' }
    ]
  }
];

export const mockProjects: EvaluationProject[] = [
  {
    id: 'proj-001',
    name: 'GPT-4o 多模态理解能力摸底',
    category: '产品上游模型能力评测',
    priority: 'P0',
    type: '重度评测 (周期/版本)',
    initiator: '不倦',
    goal: '评估最新GPT-4o在复杂图文理解上的准确率，决定是否替换当前线上模型',
    cycle: '2026 Q2 (4.1 - 4.15)',
    support: ['照野', '小八'],
    progress: 85,
    steps: [
      { id: 1, name: '评测物料生产', owner: '照野', status: 'completed', executionType: 'external' },
      { id: 2, name: '评测执行', owner: '小八', status: 'completed', executionType: 'internal', resultNote: '已完成1000条数据的推理和打分' },
      { id: 3, name: '评测结果分析', owner: '不倦', status: 'in-progress', executionType: 'internal' }
    ],
    resultSummary: '准确率较上一代提升15%，但在特定长文本图表理解上仍有幻觉。',
    link: 'https://doc.internal/eval/gpt4o-v1',
    datasetIds: ['ds-001'],
    dimensions: [
      { name: '基础物体识别', definition: '能否准确识别图中的主要物体及数量', type: '客观' },
      { name: '复杂逻辑推理', definition: '基于图文信息进行多步推理的正确率', type: '客观' },
      { name: '幻觉率', definition: '模型输出中包含图中不存在信息的比例', type: '客观' }
    ],
    generatedDataStatus: '已完成1000条测试数据的推理，耗时2.5小时。',
    analysis: '正在进行细粒度的错误case分析，初步发现模型在处理密集文字图像时容易出错。',
    lastUpdated: '2026-03-18'
  },
  {
    id: 'proj-002',
    name: 'V2.0 版本 MV 成片质量周期性回顾',
    category: '生成效果评测-成片',
    priority: 'P0',
    type: '重度评测 (周期/版本)',
    initiator: '钦钦',
    goal: '对比V1.5与V2.0版本的最终成片质量，验证核心指标是否提升',
    cycle: '2026 Q2 (4.10 - 4.25)',
    support: ['紫苏', '外包团队'],
    progress: 40,
    steps: [
      { id: 1, name: '评测物料生产', owner: '紫苏', status: 'completed', executionType: 'external' },
      { id: 2, name: '评测执行', owner: '外包团队', status: 'in-progress', executionType: 'external', resultNote: '自动化脚本正在运行中...' },
      { id: 3, name: '评测结果分析', owner: '钦钦', status: 'pending', executionType: 'internal' }
    ],
    resultSummary: '进行中',
    link: 'https://doc.internal/eval/v2-mv-quality',
    datasetIds: ['ds-002', 'ds-003'],
    dimensions: [
      { name: '画面美观度', definition: '整体画面的构图、色彩、光影是否具有美感', type: '主观' },
      { name: '音画同步率', definition: '画面切换与音乐节拍的契合程度', type: '客观' },
      { name: '叙事连贯性', definition: '镜头之间的逻辑是否通顺，能否表达完整故事', type: '主观' }
    ],
    generatedDataStatus: '已完成30%的视频生成，预计还需2天完成全部生成。',
    analysis: '等待评测执行完成后进行。',
    lastUpdated: '2026-03-17'
  },
  {
    id: 'proj-003',
    name: '新风格Skill微调效果快速验证',
    category: '生成效果评测-中间态',
    priority: 'P1',
    type: '轻度评测 (快速/专项)',
    initiator: '紫苏',
    goal: '快速验证新训练的"赛博朋克"风格Skill对视觉概念设计环节的影响',
    cycle: '2026-03-18 (1天)',
    support: ['照野'],
    progress: 100,
    steps: [
      { id: 1, name: '明确目的与周期', owner: '紫苏', status: 'completed' },
      { id: 2, name: '评测集准备', owner: '照野', status: 'completed' },
      { id: 3, name: '评测集生成', owner: '照野', status: 'completed' },
      { id: 4, name: '评测标准设计', owner: '紫苏', status: 'completed' },
      { id: 5, name: '评测执行', owner: '紫苏', status: 'completed' },
      { id: 6, name: '评测结果分析', owner: '紫苏', status: 'completed' },
      { id: 7, name: '结论归档及分享', owner: '紫苏', status: 'completed' },
    ],
    resultSummary: '风格特征明显，但部分场景下存在色彩过饱和问题，需进一步微调。',
    link: 'https://doc.internal/eval/skill-cyberpunk',
    datasetIds: ['ds-004'],
    dimensions: [
      { name: '风格一致性', definition: '生成的参考图是否符合赛博朋克风格特征', type: '主观' },
      { name: '元素保留率', definition: '原提示词中的核心元素是否被正确保留', type: '客观' }
    ],
    generatedDataStatus: '50张测试图已全部生成完毕。',
    analysis: '整体风格达标率88%，主要问题集中在夜景和人物面部的高光处理上。建议调整数据集分布。',
    lastUpdated: '2026-03-18'
  }
];
