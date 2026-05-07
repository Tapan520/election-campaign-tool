import apiClient from './client';

export interface LoginResponse {
  token: string;
  expiresAt: string;
  fullName: string;
  role: string;
  constituencyId: number | null;
  userId: string;
}

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
};

export const getMeApi = async (): Promise<LoginResponse> => {
  const { data } = await apiClient.get<LoginResponse>('/auth/me');
  return data;
};
