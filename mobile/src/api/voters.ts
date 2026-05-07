import apiClient from './client';

export interface VoterListItem {
  id: number;
  voterId: string;
  name: string;
  nameLocal?: string;
  age: number;
  gender: string;
  mobileNumber?: string;
  boothNumber: number;
  wardNumber?: string;
  serialNumber: number;
  sentiment: string;
  electionDayStatus: string;
  address: string;
}

export interface VisitHistory {
  id: number;
  workerName: string;
  visitedAt: string;
  status: string;
  sentiment: string;
  notes?: string;
}

export interface VoterDetail extends VoterListItem {
  fatherHusbandName?: string;
  pannaNumber?: string;
  notes?: string;
  lastContactedAt?: string;
  visits: VisitHistory[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getVoters = async (params: {
  search?: string; booth?: number; sentiment?: string;
  gender?: string; page?: number; pageSize?: number;
}): Promise<PagedResult<VoterListItem>> => {
  const { data } = await apiClient.get<PagedResult<VoterListItem>>('/voters', { params });
  return data;
};

export const getVoterDetail = async (id: number): Promise<VoterDetail> => {
  const { data } = await apiClient.get<VoterDetail>(`/voters/${id}`);
  return data;
};

export const updateSentiment = async (id: number, sentiment: string) => {
  const { data } = await apiClient.patch(`/voters/${id}/sentiment`, { voterId: id, sentiment });
  return data;
};

export const logVisit = async (
  id: number, visitStatus: string, sentiment: string, notes?: string
) => {
  const { data } = await apiClient.post(`/voters/${id}/visit`,
    { voterId: id, visitStatus, sentiment, notes });
  return data;
};
