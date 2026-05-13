import apiClient from './client';

export interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  createdByName: string;
  targetRoles: string;
  isPinned: boolean;
  requiresAcknowledgement: boolean;
  isAcknowledged: boolean;
  acknowledgementCount: number;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  category: string;
  targetRoles?: string;
  requiresAcknowledgement: boolean;
  expiresAt?: string;
}

/** Map backend color name ? hex */
export const CATEGORY_HEX: Record<string, string> = {
  danger:    '#e03131',
  warning:   '#f59f00',
  info:      '#4dabf7',
  success:   '#2f9e44',
  primary:   '#3b5bdb',
  secondary: '#868e96',
};

export const CATEGORY_ICONS: Record<string, string> = {
  CriticalAlert:       'warning',
  ECComplianceNotice:  'shield-checkmark',
  DailyBriefing:       'clipboard',
  Motivation:          'trophy',
  LiveDataNudge:       'trending-up',
  CampaignAnnouncement:'megaphone',
};

export const getAnnouncements = async (category?: string): Promise<AnnouncementItem[]> => {
  const { data } = await apiClient.get<AnnouncementItem[]>('/announcements',
    { params: category ? { category } : {} });
  return data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await apiClient.get<{ count: number }>('/announcements/unread-count');
  return data.count;
};

export const acknowledgeAnnouncement = async (id: number): Promise<void> => {
  await apiClient.post(`/announcements/${id}/acknowledge`);
};

export const createAnnouncement = async (payload: CreateAnnouncementPayload): Promise<void> => {
  await apiClient.post('/announcements', payload);
};

export const deactivateAnnouncement = async (id: number): Promise<void> => {
  await apiClient.delete(`/announcements/${id}`);
};
