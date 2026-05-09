import { EvaluationItem, ModelOutput, RankingEntry, VoteRecord } from './types';

export interface ArenaRankModelStat {
  modelId: string;
  modelName: string;
  totalScore: number;
  averageRank: number;
  firstPlaceCount: number;
  rankedCount: number;
}

export interface ArenaRankCaseSummary {
  itemId: string;
  prompt?: string;
  voterCount: number;
  ranking: ArenaRankModelStat[];
}

export const getModelOutputsForItem = (
  item: EvaluationItem,
  models: { id: string; name: string }[] = []
): ModelOutput[] => {
  if (item.modelOutputs?.length) {
    return item.modelOutputs
      .filter(output => output.url)
      .map((output, index) => ({
        modelId: output.modelId || models[index]?.id || `model-${index}`,
        modelName: output.modelName || models[index]?.name || `Model ${index + 1}`,
        url: output.url
      }));
  }

  const fallbackModels = models.length > 0
    ? models
    : [
        { id: 'model-a', name: 'Model A' },
        { id: 'model-b', name: 'Model B' }
      ];

  return fallbackModels
    .map((model, index) => {
      const originalData = (item as any).originalData || {};
      const url = index === 0
        ? item.modelA_Url
        : index === 1
          ? item.modelB_Url
          : originalData[model.name] || originalData[model.id] || '';

      return {
        modelId: model.id || `model-${index}`,
        modelName: model.name || `Model ${index + 1}`,
        url
      };
    })
    .filter(output => output.url);
};

export const sortRanking = (ranking: RankingEntry[] = []) =>
  [...ranking].sort((a, b) => a.rank - b.rank);

export const isArenaRankVote = (vote: VoteRecord) =>
  Array.isArray(vote.ranking) && vote.ranking.length > 0;

export const getBordaScore = (rank: number, candidateCount: number) =>
  Math.max(candidateCount - rank + 1, 0);

export const calculateArenaRankModelStats = (votes: VoteRecord[]): ArenaRankModelStat[] => {
  const stats = new Map<string, ArenaRankModelStat & { rankSum: number }>();

  votes.filter(isArenaRankVote).forEach(vote => {
    const ranking = sortRanking(vote.ranking);
    const candidateCount = ranking.length;

    ranking.forEach(entry => {
      const existing = stats.get(entry.modelId) || {
        modelId: entry.modelId,
        modelName: entry.modelName,
        totalScore: 0,
        averageRank: 0,
        firstPlaceCount: 0,
        rankedCount: 0,
        rankSum: 0
      };

      existing.modelName = entry.modelName || existing.modelName;
      existing.totalScore += getBordaScore(entry.rank, candidateCount);
      existing.rankSum += entry.rank;
      existing.rankedCount += 1;
      if (entry.rank === 1) existing.firstPlaceCount += 1;
      stats.set(entry.modelId, existing);
    });
  });

  return Array.from(stats.values())
    .map(stat => ({
      modelId: stat.modelId,
      modelName: stat.modelName,
      totalScore: stat.totalScore,
      averageRank: stat.rankedCount ? stat.rankSum / stat.rankedCount : 0,
      firstPlaceCount: stat.firstPlaceCount,
      rankedCount: stat.rankedCount
    }))
    .sort((a, b) => b.totalScore - a.totalScore || a.averageRank - b.averageRank || a.modelName.localeCompare(b.modelName));
};

export const calculateArenaRankCaseSummaries = (
  votes: VoteRecord[],
  items: EvaluationItem[] = []
): ArenaRankCaseSummary[] => {
  const grouped = new Map<string, VoteRecord[]>();

  votes.filter(isArenaRankVote).forEach(vote => {
    grouped.set(vote.itemId, [...(grouped.get(vote.itemId) || []), vote]);
  });

  return Array.from(grouped.entries()).map(([itemId, itemVotes]) => {
    const item = items.find(candidate => candidate.id === itemId);
    return {
      itemId,
      prompt: item?.prompt,
      voterCount: new Set(itemVotes.map(vote => vote.user || 'Anonymous')).size,
      ranking: calculateArenaRankModelStats(itemVotes)
    };
  });
};
