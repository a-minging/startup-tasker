const STORAGE_KEY = 'ai_usage_limits';

export type FeatureType = 'decompose' | 'recommend' | 'weeklyReport';

interface UsageData {
  month: string;
  decompose: number;
  recommend: number;
  weeklyReport: number;
}

interface FeatureLimit {
  name: string;
  limit: number;
}

export const FEATURE_LIMITS: Record<FeatureType, FeatureLimit> = {
  decompose: { name: 'AI 任务拆解', limit: 5 },
  recommend: { name: 'AI 资源推荐', limit: 3 },
  weeklyReport: { name: '周报生成', limit: 1 },
};

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUsageData(): UsageData {
  if (typeof window === 'undefined') {
    return {
      month: getCurrentMonth(),
      decompose: 0,
      recommend: 0,
      weeklyReport: 0,
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      month: getCurrentMonth(),
      decompose: 0,
      recommend: 0,
      weeklyReport: 0,
    };
  }

  try {
    const data = JSON.parse(stored) as UsageData;
    if (data.month !== getCurrentMonth()) {
      return {
        month: getCurrentMonth(),
        decompose: 0,
        recommend: 0,
        weeklyReport: 0,
      };
    }
    return data;
  } catch {
    return {
      month: getCurrentMonth(),
      decompose: 0,
      recommend: 0,
      weeklyReport: 0,
    };
  }
}

function saveUsageData(data: UsageData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUsageCount(feature: FeatureType): number {
  const data = getUsageData();
  return data[feature];
}

export function getRemainingCount(feature: FeatureType): number {
  const used = getUsageCount(feature);
  const limit = FEATURE_LIMITS[feature].limit;
  return Math.max(0, limit - used);
}

export function checkAndIncrement(feature: FeatureType): boolean {
  const data = getUsageData();
  const limit = FEATURE_LIMITS[feature].limit;

  if (data[feature] >= limit) {
    return false;
  }

  data[feature] += 1;
  saveUsageData(data);
  return true;
}

export function getFeatureUsageStatus(feature: FeatureType): {
  used: number;
  limit: number;
  remaining: number;
  name: string;
} {
  const used = getUsageCount(feature);
  const limit = FEATURE_LIMITS[feature].limit;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    name: FEATURE_LIMITS[feature].name,
  };
}

export function getAllUsageStatus(): Record<FeatureType, { used: number; limit: number; remaining: number; name: string }> {
  return {
    decompose: getFeatureUsageStatus('decompose'),
    recommend: getFeatureUsageStatus('recommend'),
    weeklyReport: getFeatureUsageStatus('weeklyReport'),
  };
}
