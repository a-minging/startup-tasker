const STORAGE_KEY = 'user_interactions';
const USER_ID_KEY = 'user_id';
const RESOURCE_TAGS_KEY = 'resource_tags_cache';

export type InteractionAction = 'click' | 'like' | 'dislike' | 'ignore';

export interface Interaction {
  resourceId: number;
  action: InteractionAction;
  timestamp: number;
}

export interface UserInteractions {
  userId: string;
  interactions: Interaction[];
}

interface ResourceTagsCache {
  [resourceId: number]: string[];
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function getUserInteractions(): UserInteractions {
  if (typeof window === 'undefined') {
    return {
      userId: 'anonymous',
      interactions: [],
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      userId: getUserId(),
      interactions: [],
    };
  }

  try {
    const data = JSON.parse(stored) as UserInteractions;
    return data;
  } catch {
    return {
      userId: getUserId(),
      interactions: [],
    };
  }
}

export function saveUserInteractions(data: UserInteractions): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function cacheResourceTags(resourceId: number, tags: string[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(RESOURCE_TAGS_KEY);
    const cache: ResourceTagsCache = stored ? JSON.parse(stored) : {};
    cache[resourceId] = tags;
    localStorage.setItem(RESOURCE_TAGS_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to cache resource tags:', error);
  }
}

function getResourceTagsFromCache(resourceId: number): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(RESOURCE_TAGS_KEY);
    if (!stored) return [];
    const cache: ResourceTagsCache = JSON.parse(stored);
    return cache[resourceId] || [];
  } catch {
    return [];
  }
}

async function sendFeedbackToAPI(resourceId: number, action: 'like' | 'dislike'): Promise<void> {
  try {
    const userId = getUserId();
    
    await fetch('/api/user/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceId,
        action,
        userId,
      }),
    });
  } catch (error) {
    console.error('Failed to send feedback to API:', error);
  }
}

export function recordInteraction(resourceId: number, action: InteractionAction, tags?: string[]): void {
  if (typeof window === 'undefined') return;

  if (tags && tags.length > 0) {
    cacheResourceTags(resourceId, tags);
  }

  const data = getUserInteractions();
  
  const existingIndex = data.interactions.findIndex(
    i => i.resourceId === resourceId && (action === 'like' || action === 'dislike')
  );
  
  if (existingIndex !== -1 && (action === 'like' || action === 'dislike')) {
    const existing = data.interactions[existingIndex];
    if (existing.action === action) {
      data.interactions.splice(existingIndex, 1);
    } else {
      data.interactions[existingIndex] = {
        resourceId,
        action,
        timestamp: Date.now(),
      };
      if (action === 'like' || action === 'dislike') {
        sendFeedbackToAPI(resourceId, action);
      }
    }
  } else {
    data.interactions.push({
      resourceId,
      action,
      timestamp: Date.now(),
    });
    if (action === 'like' || action === 'dislike') {
      sendFeedbackToAPI(resourceId, action);
    }
  }

  data.userId = getUserId();
  saveUserInteractions(data);
}

export function getResourceInteraction(resourceId: number): InteractionAction | null {
  const data = getUserInteractions();
  const interaction = data.interactions.find(i => i.resourceId === resourceId);
  return interaction?.action || null;
}

export function getInteractionsByAction(action: InteractionAction): Interaction[] {
  const data = getUserInteractions();
  return data.interactions.filter(i => i.action === action);
}

export function getLikedResourceIds(): number[] {
  return getInteractionsByAction('like').map(i => i.resourceId);
}

export function getClickedResourceIds(): number[] {
  return getInteractionsByAction('click').map(i => i.resourceId);
}

export function getLikedTags(): string[] {
  const likedIds = getLikedResourceIds();
  const allTags = new Set<string>();
  
  for (const id of likedIds) {
    const tags = getResourceTagsFromCache(id);
    tags.forEach(tag => allTags.add(tag));
  }
  
  return Array.from(allTags);
}

export function clearInteractions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getInteractionStats(): {
  totalInteractions: number;
  clicks: number;
  likes: number;
  dislikes: number;
  ignores: number;
} {
  const data = getUserInteractions();
  return {
    totalInteractions: data.interactions.length,
    clicks: data.interactions.filter(i => i.action === 'click').length,
    likes: data.interactions.filter(i => i.action === 'like').length,
    dislikes: data.interactions.filter(i => i.action === 'dislike').length,
    ignores: data.interactions.filter(i => i.action === 'ignore').length,
  };
}
