// @signalgrid/sdk
// Typed REST client + WebSocket client with runtime validation
// Uses @signalgrid/contracts for all type definitions

import {
  // Version
  CONTRACTS_VERSION,
  // Auth schemas
  LoginRequestSchema,
  RegisterRequestSchema,
  AuthResponseSchema,
  MeResponseSchema,
  // Event schemas
  EventsQuerySchema,
  EventsResponseSchema,
  // Incident schemas
  CreateIncidentRequestSchema,
  CreateIncidentResponseSchema,
  IncidentsListResponseSchema,
  IncidentDetailResponseSchema,
  CreateCommentRequestSchema,
  CreateCommentResponseSchema,
  // Metrics schemas
  OpsMetricsResponseSchema,
  // WebSocket schemas
  WsClientFrameSchema,
  WsServerFrameSchema,
  // Types
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
  type MeResponse,
  type Event,
  type EventsQuery,
  type EventsResponse,
  type CreateIncidentRequest,
  type CreateIncidentResponse,
  type IncidentsListResponse,
  type IncidentDetailResponse,
  type CreateCommentRequest,
  type CreateCommentResponse,
  type OpsMetricsResponse,
  type WsClientFrame,
  type WsServerFrame,
  type WsEventFilters,
  type Uuid,
} from '@signalgrid/contracts';

export const SDK_VERSION = '0.0.1';

// ============================================================================
// SDK Configuration
// ============================================================================

export interface SdkConfig {
  baseUrl: string;
  wsUrl?: string;
}

// ============================================================================
// Errors
// ============================================================================

export class SdkError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'SdkError';
  }
}

export class ValidationError extends SdkError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// ============================================================================
// HTTP Client (internal helper)
// ============================================================================

class HttpClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      auth?: boolean;
    } = {},
  ): Promise<T> {
    const { body, query, auth = true } = options;

    // Build URL with query params
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Make request
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Parse response
    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      throw new SdkError(
        data.message || 'Request failed',
        data.code || 'UNKNOWN_ERROR',
        response.status,
      );
    }

    return data as T;
  }

  get<T>(
    path: string,
    options?: { query?: Record<string, string | number | undefined>; auth?: boolean },
  ): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: unknown, options?: { auth?: boolean }): Promise<T> {
    return this.request<T>('POST', path, { body, ...options });
  }
}

// ============================================================================
// Auth Module
// ============================================================================

class AuthModule {
  constructor(private http: HttpClient) {}

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Validate input
    const validated = LoginRequestSchema.parse(data);

    // Make request
    const response = await this.http.post<AuthResponse>('/auth/login', validated, { auth: false });

    // Validate response
    const result = AuthResponseSchema.parse(response);

    // Store token
    this.http.setToken(result.token);

    return result;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Validate input
    const validated = RegisterRequestSchema.parse(data);

    // Make request
    const response = await this.http.post<AuthResponse>('/auth/register', validated, {
      auth: false,
    });

    // Validate response
    const result = AuthResponseSchema.parse(response);

    // Store token
    this.http.setToken(result.token);

    return result;
  }

  async me(): Promise<MeResponse> {
    const response = await this.http.get<MeResponse>('/me');
    return MeResponseSchema.parse(response);
  }

  setToken(token: string | null): void {
    this.http.setToken(token);
  }

  getToken(): string | null {
    return this.http.getToken();
  }
}

// ============================================================================
// Events Module
// ============================================================================

class EventsModule {
  constructor(private http: HttpClient) {}

  async list(query?: Partial<EventsQuery>): Promise<EventsResponse> {
    // Validate and apply defaults to query
    const validated = EventsQuerySchema.parse(query ?? {});

    const response = await this.http.get<EventsResponse>('/events', {
      query: {
        cursor: validated.cursor,
        limit: validated.limit,
        severity: validated.severity,
        type: validated.type,
      },
    });

    return EventsResponseSchema.parse(response);
  }
}

// ============================================================================
// Incidents Module
// ============================================================================

class IncidentsModule {
  constructor(private http: HttpClient) {}

  async list(): Promise<IncidentsListResponse> {
    const response = await this.http.get<IncidentsListResponse>('/incidents');
    return IncidentsListResponseSchema.parse(response);
  }

  async get(id: Uuid): Promise<IncidentDetailResponse> {
    const response = await this.http.get<IncidentDetailResponse>(`/incidents/${id}`);
    return IncidentDetailResponseSchema.parse(response);
  }

  async create(data: CreateIncidentRequest): Promise<CreateIncidentResponse> {
    const validated = CreateIncidentRequestSchema.parse(data);
    const response = await this.http.post<CreateIncidentResponse>('/incidents', validated);
    return CreateIncidentResponseSchema.parse(response);
  }

  async addComment(incidentId: Uuid, data: CreateCommentRequest): Promise<CreateCommentResponse> {
    const validated = CreateCommentRequestSchema.parse(data);
    const response = await this.http.post<CreateCommentResponse>(
      `/incidents/${incidentId}/comments`,
      validated,
    );
    return CreateCommentResponseSchema.parse(response);
  }
}

// ============================================================================
// Metrics Module
// ============================================================================

class MetricsModule {
  constructor(private http: HttpClient) {}

  async getOps(): Promise<OpsMetricsResponse> {
    const response = await this.http.get<OpsMetricsResponse>('/metrics/ops');
    return OpsMetricsResponseSchema.parse(response);
  }
}

// ============================================================================
// WebSocket Client
// ============================================================================

export type WsEventHandler = (frame: WsServerFrame) => void;
export type WsErrorHandler = (error: Error) => void;
export type WsCloseHandler = (code: number, reason: string) => void;

class WsClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private getToken: () => string | null;
  private eventHandlers: Set<WsEventHandler> = new Set();
  private errorHandlers: Set<WsErrorHandler> = new Set();
  private closeHandlers: Set<WsCloseHandler> = new Set();
  private lastCursor: string | null = null;

  constructor(wsUrl: string, getToken: () => string | null) {
    this.wsUrl = wsUrl.replace(/\/$/, '');
    this.getToken = getToken;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = this.getToken();
      if (!token) {
        reject(new SdkError('No auth token available', 'AUTH_REQUIRED'));
        return;
      }

      const url = `${this.wsUrl}/ws?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        resolve();
      };

      this.ws.onerror = () => {
        const error = new SdkError('WebSocket connection failed', 'WS_CONNECTION_ERROR');
        reject(error);
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = (event) => {
        this.closeHandlers.forEach((handler) => handler(event.code, event.reason));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          const frame = WsServerFrameSchema.parse(data);

          // Track cursor for reconnection
          if (frame.type === 'event') {
            this.lastCursor = frame.cursor;
          }

          this.eventHandlers.forEach((handler) => handler(frame));
        } catch (error) {
          const sdkError =
            error instanceof Error
              ? new ValidationError(`Invalid WebSocket frame: ${error.message}`)
              : new ValidationError('Invalid WebSocket frame');
          this.errorHandlers.forEach((handler) => handler(sdkError));
        }
      };
    });
  }

  subscribe(filters: WsEventFilters, cursor?: string | null): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new SdkError('WebSocket not connected', 'WS_NOT_CONNECTED');
    }

    const frame: WsClientFrame = {
      type: 'subscribe_events',
      requestId: crypto.randomUUID(),
      filters,
      cursor: cursor ?? this.lastCursor,
    };

    // Validate before sending
    WsClientFrameSchema.parse(frame);
    this.ws.send(JSON.stringify(frame));
  }

  unsubscribe(requestId: Uuid): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new SdkError('WebSocket not connected', 'WS_NOT_CONNECTED');
    }

    const frame: WsClientFrame = {
      type: 'unsubscribe',
      requestId,
    };

    WsClientFrameSchema.parse(frame);
    this.ws.send(JSON.stringify(frame));
  }

  ping(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new SdkError('WebSocket not connected', 'WS_NOT_CONNECTED');
    }

    const frame: WsClientFrame = {
      type: 'ping',
      ts: new Date().toISOString(),
    };

    WsClientFrameSchema.parse(frame);
    this.ws.send(JSON.stringify(frame));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: WsEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onError(handler: WsErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onClose(handler: WsCloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  getLastCursor(): string | null {
    return this.lastCursor;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// ============================================================================
// Main SDK Client
// ============================================================================

export class SignalGridClient {
  private http: HttpClient;

  public readonly auth: AuthModule;
  public readonly events: EventsModule;
  public readonly incidents: IncidentsModule;
  public readonly metrics: MetricsModule;
  public readonly ws: WsClient;

  constructor(config: SdkConfig) {
    this.http = new HttpClient(config.baseUrl);

    // Derive WebSocket URL from base URL if not provided
    const wsUrl = config.wsUrl ?? config.baseUrl.replace(/^http/, 'ws');

    this.auth = new AuthModule(this.http);
    this.events = new EventsModule(this.http);
    this.incidents = new IncidentsModule(this.http);
    this.metrics = new MetricsModule(this.http);
    this.ws = new WsClient(wsUrl, () => this.auth.getToken());
  }

  get contractsVersion(): string {
    return CONTRACTS_VERSION;
  }
}

// Re-export types for convenience
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  MeResponse,
  Event,
  EventsQuery,
  EventsResponse,
  CreateIncidentRequest,
  CreateIncidentResponse,
  IncidentsListResponse,
  IncidentDetailResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  OpsMetricsResponse,
  WsClientFrame,
  WsServerFrame,
  WsEventFilters,
};
