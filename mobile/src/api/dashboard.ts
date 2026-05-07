import apiClient from './client';

export interface DashboardStats {
  totalVoters: number;
  favourVoters: number;
  againstVoters: number;
  neutralVoters: number;
  unknownVoters: number;
  totalBooths: number;
  openGrievances: number;
  totalVolunteers: number;
  totalVoted: number;
  turnoutPercent: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
  return data;
};
