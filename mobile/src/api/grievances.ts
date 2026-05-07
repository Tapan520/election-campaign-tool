import apiClient from './client';

export interface GrievanceItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  reportedBy?: string;
  reporterPhone?: string;
  ward?: string;
  location?: string;
  reportedAt: string;
}

export const getGrievances = async (status?: string): Promise<GrievanceItem[]> => {
  const { data } = await apiClient.get<GrievanceItem[]>('/grievances',
    { params: status ? { status } : {} });
  return data;
};

export const createGrievance = async (req: {
  title: string; description: string; reportedBy?: string;
  reporterPhone?: string; priority: string; ward?: string; location?: string;
}) => {
  const { data } = await apiClient.post('/grievances', req);
  return data;
};
