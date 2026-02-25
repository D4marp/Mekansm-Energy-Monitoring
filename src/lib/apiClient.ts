/**
 * API Client for Mekansm Energy Dashboard
 * Handles all backend API requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api/v1';

// Error handler
class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Generic fetch wrapper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(
      response.status,
      data.message || `API Error: ${response.statusText}`,
      data
    );
  }

  return data;
}

// ============ CLASSES API ============
export const classesAPI = {
  getAll: async () => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      '/classes'
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/classes/${id}`
    );
    return response.data;
  },
};

// ============ DEVICES API ============
export const devicesAPI = {
  getAll: async () => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      '/devices'
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/devices/${id}`
    );
    return response.data;
  },

  getByClass: async (classId: number) => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      `/devices/class/${classId}`
    );
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      '/devices',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/devices/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/devices/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/devices/${id}`,
      {
        method: 'DELETE',
      }
    );
    return response.data;
  },
};

// ============ CONSUMPTION API ============
export const consumptionAPI = {
  getDaily: async (deviceId: number, date: string) => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      `/consumption/daily/${deviceId}?date=${date}`
    );
    return response.data;
  },

  getMonthly: async (deviceId: number, month: string) => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      `/consumption/monthly/${deviceId}?month=${month}`
    );
    return response.data;
  },

  getHourly: async (deviceId: number, date: string) => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      `/consumption/hourly/${deviceId}?date=${date}`
    );
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      '/consumption',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },
};

// ============ ALERTS API ============
export const alertsAPI = {
  getAll: async () => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      '/alerts'
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/alerts/${id}`
    );
    return response.data;
  },

  getUnread: async () => {
    const response = await apiCall<{ success: boolean; data: any }>(
      '/alerts/count/unread'
    );
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      '/alerts',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/alerts/${id}/read`,
      {
        method: 'PATCH',
      }
    );
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/alerts/${id}`,
      {
        method: 'DELETE',
      }
    );
    return response.data;
  },
};

// ============ SETTINGS API ============
export const settingsAPI = {
  getAll: async () => {
    const response = await apiCall<{ success: boolean; data: any[] }>(
      '/settings'
    );
    return response.data;
  },

  getByKey: async (key: string) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/settings/${key}`
    );
    return response.data;
  },

  getUserSettings: async (userId: number) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/settings/user/${userId}`
    );
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      '/settings',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  update: async (key: string, value: any) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/settings/${key}`,
      {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }
    );
    return response.data;
  },

  updateUserSettings: async (userId: number, data: any) => {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/settings/user/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },
};

// ============ EXPORT ERROR CLASS ============
export { APIError };
