// Resonance-First Bookmarking System types
// Focus: Capture WHY content resonates, not just WHAT to save

export type ResonanceStatus = 'active' | 'archived' | 'considered';

export interface Resonance {
  id: string;
  userId: string; // Email fingerprint for privacy
  articleId: string;
  resonanceNote: string; // Mandatory: Why this resonates (max 280 chars)
  quote?: string; // Optional captured quote from article
  vitality: number; // Days until archival (starts at 30, resets on visit)
  status: ResonanceStatus;
  visitCount: number; // Track return visits for depth metric
  lastVisitedAt?: number; // Timestamp of last visit
  createdAt: string;
  updatedAt: string;
}

export interface CreateResonanceInput {
  articleId: string;
  resonanceNote: string; // Required: Must articulate WHY it matters
  quote?: string; // Optional: Capture meaningful passage
}

export interface UpdateResonanceInput {
  resonanceNote?: string;
  quote?: string;
  vitality?: number;
  status?: ResonanceStatus;
}

// Public depth badge metrics (opt-in, future feature)
export interface DepthMetrics {
  totalResonances: number;
  activeCount: number;
  archivedCount: number;
  returnVisitRate: number; // Percentage: (visited / total) * 100
  averageVitality: number;
}

// User slot limits with progressive unlocks
export interface SlotLimits {
  currentSlots: number; // Starts at 5
  usedSlots: number;
  availableSlots: number;
  nextUnlockAt?: Date; // When more slots unlock
}

// TODO: Add resonance categories/tags if needed
// TODO: Add resonance export formats (Markdown, JSON)
