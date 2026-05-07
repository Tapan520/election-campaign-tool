import apiClient from './client';

export interface BoothTurnout {
  boothNumber: number;
  boothName: string;
  totalVoters: number;
  votedCount: number;
  turnoutPercent: number;
}

export interface LiveTurnout {
  totalVoters: number;
  totalVoted: number;
  overallPercent: number;
  booths: BoothTurnout[];
}

export const getLiveTurnout = async (): Promise<LiveTurnout> => {
  const { data } = await apiClient.get<LiveTurnout>('/electionday/turnout');
  return data;
};

export const markVoted = async (voterId: number) => {
  const { data } = await apiClient.post('/electionday/mark-voted', { voterId });
  return data;
};

export const markAbsent = async (voterId: number) => {
  const { data } = await apiClient.post('/electionday/mark-absent', { voterId });
  return data;
};
