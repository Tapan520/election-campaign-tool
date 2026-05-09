import apiClient from './client';

export interface SurveyItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  isActive: boolean;
  responseCount: number;
  createdAt: string;
}

export const getSurveys = async (): Promise<SurveyItem[]> => {
  const { data } = await apiClient.get<SurveyItem[]>('/surveys');
  return data;
};
