import apiClient from './client';

export interface SentimentBreakdown {
  favour: number; against: number; neutral: number; floating: number; unknown: number;
}
export interface GenderBreakdown { male: number; female: number; other: number; }
export interface AgeGroupItem { label: string; count: number; }
export interface BoothAnalyticsItem {
  boothNumber: number; total: number;
  favour: number; against: number; neutral: number; unknown: number; floating: number;
}
export interface AnalyticsData {
  sentiment: SentimentBreakdown;
  gender: GenderBreakdown;
  ageGroups: AgeGroupItem[];
  boothBreakdown: BoothAnalyticsItem[];
}

export const getAnalytics = async (): Promise<AnalyticsData> => {
  const { data } = await apiClient.get<AnalyticsData>('/analytics');
  return data;
};
