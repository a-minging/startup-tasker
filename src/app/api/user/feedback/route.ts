import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface FeedbackRequest {
  resourceId: number;
  action: 'like' | 'dislike';
  userId: string;
}

interface FeedbackRecord {
  id: string;
  resourceId: number;
  action: 'like' | 'dislike';
  userId: string;
  timestamp: number;
}

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json');

function loadFeedbacks(): FeedbackRecord[] {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const data = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Feedback] Failed to load feedbacks:', error);
  }
  return [];
}

function saveFeedbacks(feedbacks: FeedbackRecord[]): void {
  try {
    const dir = path.dirname(FEEDBACK_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Feedback] Failed to save feedbacks:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    
    const { resourceId, action, userId } = body;
    
    if (resourceId === undefined || resourceId === null) {
      return NextResponse.json(
        { error: 'resourceId is required' },
        { status: 400 }
      );
    }
    
    if (!action || !['like', 'dislike'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "like" or "dislike"' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const feedbacks = loadFeedbacks();
    
    const existingIndex = feedbacks.findIndex(
      f => f.resourceId === resourceId && f.userId === userId
    );
    
    if (existingIndex !== -1) {
      const existing = feedbacks[existingIndex];
      if (existing.action === action) {
        feedbacks.splice(existingIndex, 1);
        console.log(`[Feedback] User ${userId} removed ${action} for resource ${resourceId}`);
      } else {
        feedbacks[existingIndex] = {
          ...existing,
          action,
          timestamp: Date.now(),
        };
        console.log(`[Feedback] User ${userId} changed to ${action} for resource ${resourceId}`);
      }
    } else {
      const newFeedback: FeedbackRecord = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        resourceId,
        action,
        userId,
        timestamp: Date.now(),
      };
      feedbacks.push(newFeedback);
      console.log(`[Feedback] User ${userId} ${action}d resource ${resourceId}`);
    }
    
    saveFeedbacks(feedbacks);
    
    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      resourceId,
      action,
      userId,
    });
    
  } catch (error) {
    console.error('[Feedback] API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const resourceId = searchParams.get('resourceId');
  
  try {
    const feedbacks = loadFeedbacks();
    
    let filtered = feedbacks;
    
    if (userId) {
      filtered = filtered.filter(f => f.userId === userId);
    }
    
    if (resourceId) {
      filtered = filtered.filter(f => f.resourceId === parseInt(resourceId));
    }
    
    return NextResponse.json({
      success: true,
      count: filtered.length,
      feedbacks: filtered,
    });
    
  } catch (error) {
    console.error('[Feedback] GET error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
