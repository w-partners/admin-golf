import type { paths } from './types'

// API Error 타입 정의
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// API 클라이언트 설정
export interface ApiClientConfig {
  baseUrl?: string
  headers?: Record<string, string>
  onError?: (error: ApiError) => void
}

// 기본 설정
const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
}

// API 클라이언트 클래스
export class ApiClient {
  private config: ApiClientConfig

  constructor(config?: ApiClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // 인증 토큰 설정
  setAuthToken(token: string) {
    this.config.headers = {
      ...this.config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  // HTTP 요청 헬퍼
  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown
      params?: Record<string, any>
      headers?: Record<string, string>
    }
  ): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${path}`, window.location.origin)
    
    // Query parameters 추가
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        ...this.config.headers,
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    // 204 No Content 처리
    if (response.status === 204) {
      return undefined as unknown as T
    }

    const data = await response.json()

    if (!response.ok) {
      const error = new ApiError(
        data.code || 'UNKNOWN_ERROR',
        data.message || 'An error occurred',
        response.status,
        data.details
      )
      
      if (this.config.onError) {
        this.config.onError(error)
      }
      
      throw error
    }

    return data
  }

  // GET 요청
  get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', path, { params })
  }

  // POST 요청
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body })
  }

  // PUT 요청
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body })
  }

  // DELETE 요청
  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  // PATCH 요청
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body })
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient()

// Type-safe API 메서드들
export const api = {
  // Auth
  auth: {
    login: (data: paths['/auth/login']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/auth/login']['post']['responses']['200']['content']['application/json']>('/auth/login', data),
    
    logout: () => 
      apiClient.post<paths['/auth/logout']['post']['responses']['200']['content']['application/json']>('/auth/logout'),
    
    getSession: () => 
      apiClient.get<paths['/auth/session']['get']['responses']['200']['content']['application/json']>('/auth/session'),
  },

  // Tee Times
  teeTimes: {
    list: (params?: paths['/tee-times']['get']['parameters']['query']) => 
      apiClient.get<paths['/tee-times']['get']['responses']['200']['content']['application/json']>('/tee-times', params),
    
    create: (data: paths['/tee-times']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/tee-times']['post']['responses']['201']['content']['application/json']>('/tee-times', data),
    
    getById: (id: string) => 
      apiClient.get<paths['/tee-times/{id}']['get']['responses']['200']['content']['application/json']>(`/tee-times/${id}`),
    
    update: (id: string, data: paths['/tee-times/{id}']['put']['requestBody']['content']['application/json']) => 
      apiClient.put<paths['/tee-times/{id}']['put']['responses']['200']['content']['application/json']>(`/tee-times/${id}`, data),
    
    delete: (id: string) => 
      apiClient.delete(`/tee-times/${id}`),
    
    // Matrix View
    getMatrix: (params?: paths['/tee-times/matrix']['get']['parameters']['query']) => 
      apiClient.get<paths['/tee-times/matrix']['get']['responses']['200']['content']['application/json']>('/tee-times/matrix', params),
    
    // 10분 타이머 관련
    reserve: (data: paths['/tee-times/reserve']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/tee-times/reserve']['post']['responses']['200']['content']['application/json']>('/tee-times/reserve', data),
    
    confirm: (data: paths['/tee-times/confirm']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/tee-times/confirm']['post']['responses']['200']['content']['application/json']>('/tee-times/confirm', data),
    
    cancel: (data: paths['/tee-times/cancel']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/tee-times/cancel']['post']['responses']['200']['content']['application/json']>('/tee-times/cancel', data),
    
    getTimerStatus: (id: string) => 
      apiClient.get<paths['/tee-times/timer-status/{id}']['get']['responses']['200']['content']['application/json']>(`/tee-times/timer-status/${id}`),
  },

  // Performance
  performance: {
    complete: (data: paths['/performance/complete']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/performance/complete']['post']['responses']['201']['content']['application/json']>('/performance/complete', data),
    
    getSummary: (params: paths['/performance/summary']['get']['parameters']['query']) => 
      apiClient.get<paths['/performance/summary']['get']['responses']['200']['content']['application/json']>('/performance/summary', params),
    
    getStats: (params: paths['/performance/stats']['get']['parameters']['query']) => 
      apiClient.get<paths['/performance/stats']['get']['responses']['200']['content']['application/json']>('/performance/stats', params),
  },

  // Golf Courses
  golfCourses: {
    list: (params?: paths['/golf-courses']['get']['parameters']['query']) => 
      apiClient.get<paths['/golf-courses']['get']['responses']['200']['content']['application/json']>('/golf-courses', params),
    
    create: (data: paths['/golf-courses']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/golf-courses']['post']['responses']['201']['content']['application/json']>('/golf-courses', data),
    
    getById: (id: string) => 
      apiClient.get<paths['/golf-courses/{id}']['get']['responses']['200']['content']['application/json']>(`/golf-courses/${id}`),
    
    update: (id: string, data: paths['/golf-courses/{id}']['put']['requestBody']['content']['application/json']) => 
      apiClient.put<paths['/golf-courses/{id}']['put']['responses']['200']['content']['application/json']>(`/golf-courses/${id}`, data),
    
    delete: (id: string) => 
      apiClient.delete(`/golf-courses/${id}`),
  },

  // Users
  users: {
    list: (params?: paths['/users']['get']['parameters']['query']) => 
      apiClient.get<paths['/users']['get']['responses']['200']['content']['application/json']>('/users', params),
    
    create: (data: paths['/users']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/users']['post']['responses']['201']['content']['application/json']>('/users', data),
    
    getById: (id: string) => 
      apiClient.get<paths['/users/{id}']['get']['responses']['200']['content']['application/json']>(`/users/${id}`),
    
    update: (id: string, data: paths['/users/{id}']['put']['requestBody']['content']['application/json']) => 
      apiClient.put<paths['/users/{id}']['put']['responses']['200']['content']['application/json']>(`/users/${id}`, data),
    
    delete: (id: string) => 
      apiClient.delete(`/users/${id}`),
  },

  // Teams
  teams: {
    list: (params?: paths['/teams']['get']['parameters']['query']) => 
      apiClient.get<paths['/teams']['get']['responses']['200']['content']['application/json']>('/teams', params),
    
    create: (data: paths['/teams']['post']['requestBody']['content']['application/json']) => 
      apiClient.post<paths['/teams']['post']['responses']['201']['content']['application/json']>('/teams', data),
    
    getById: (id: string) => 
      apiClient.get<paths['/teams/{id}']['get']['responses']['200']['content']['application/json']>(`/teams/${id}`),
    
    update: (id: string, data: paths['/teams/{id}']['put']['requestBody']['content']['application/json']) => 
      apiClient.put<paths['/teams/{id}']['put']['responses']['200']['content']['application/json']>(`/teams/${id}`, data),
    
    delete: (id: string) => 
      apiClient.delete(`/teams/${id}`),
  },
}

export default api