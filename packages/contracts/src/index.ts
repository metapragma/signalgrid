// @signalgrid/contracts
// Zod schemas and TypeScript types for REST + WebSocket contracts
// See CONTRACTS.md for canonical documentation

import { z } from 'zod';

export const CONTRACTS_VERSION = '0.0.1';

// ============================================================================
// Common Types
// ============================================================================

export const UuidSchema = z.string().uuid();
export const IsoDateSchema = z.string().datetime();

export type Uuid = z.infer<typeof UuidSchema>;
export type IsoDate = z.infer<typeof IsoDateSchema>;

// ============================================================================
// Error Model
// ============================================================================

// Error code prefixes:
// AUTH_* — authentication and authorization
// TENANT_* — tenant resolution / isolation
// VALIDATION_* — request validation failures
// NOT_FOUND_* — missing resources
// CONFLICT_* — uniqueness or state conflicts
// INTERNAL_* — unexpected server errors

export const ErrorResponseSchema = z.object({
  errorId: UuidSchema,
  status: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// Auth Types
// ============================================================================

export const RoleSchema = z.enum(['OWNER', 'MEMBER']);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: UuidSchema,
  email: z.string().email(),
});
export type User = z.infer<typeof UserSchema>;

export const TenantSchema = z.object({
  id: UuidSchema,
  name: z.string(),
});
export type Tenant = z.infer<typeof TenantSchema>;

// POST /auth/login, POST /auth/register - request body
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// POST /auth/login, POST /auth/register - response
// Note: refreshToken is returned in httpOnly cookie, not in response body
export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  expiresAt: IsoDateSchema, // When the access token expires
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// POST /auth/refresh - response (refresh token comes from httpOnly cookie)
export const RefreshResponseSchema = z.object({
  token: z.string(),
  expiresAt: IsoDateSchema,
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// GET /me - response
export const MeResponseSchema = z.object({
  user: UserSchema,
  tenant: TenantSchema,
  role: RoleSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

// ============================================================================
// Event Types
// ============================================================================

export const SeveritySchema = z.enum(['debug', 'info', 'warn', 'error']);
export type Severity = z.infer<typeof SeveritySchema>;

export const EventSchema = z.object({
  id: UuidSchema,
  ts: IsoDateSchema,
  type: z.string(),
  severity: SeveritySchema,
  fingerprint: z.string(),
  payload: z.record(z.unknown()),
  cursor: z.string(),
});
export type Event = z.infer<typeof EventSchema>;

// GET /events - query parameters
export const EventsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  severity: SeveritySchema.optional(),
  type: z.string().optional(),
});
export type EventsQuery = z.infer<typeof EventsQuerySchema>;

// GET /events - response
export const EventsResponseSchema = z.object({
  items: z.array(EventSchema),
  nextCursor: z.string().nullable(),
});
export type EventsResponse = z.infer<typeof EventsResponseSchema>;

// ============================================================================
// Incident Types
// ============================================================================

export const IncidentStatusSchema = z.enum(['OPEN', 'CLOSED']);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const CommentAuthorSchema = z.object({
  id: UuidSchema,
  email: z.string().email(),
});
export type CommentAuthor = z.infer<typeof CommentAuthorSchema>;

export const CommentSchema = z.object({
  id: UuidSchema,
  body: z.string(),
  createdAt: IsoDateSchema,
  author: CommentAuthorSchema,
});
export type Comment = z.infer<typeof CommentSchema>;

// Used in GET /incidents list
export const IncidentSummarySchema = z.object({
  id: UuidSchema,
  status: IncidentStatusSchema,
  title: z.string(),
  createdAt: IsoDateSchema,
  commentCount: z.number().int(),
  eventCount: z.number().int(),
});
export type IncidentSummary = z.infer<typeof IncidentSummarySchema>;

// Used in GET /incidents/:id detail
export const IncidentDetailSchema = z.object({
  id: UuidSchema,
  status: IncidentStatusSchema,
  title: z.string(),
  description: z.string().nullable(),
  createdAt: IsoDateSchema,
  comments: z.array(CommentSchema),
  events: z.array(EventSchema),
});
export type IncidentDetail = z.infer<typeof IncidentDetailSchema>;

// POST /incidents - request
export const CreateIncidentRequestSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  relatedEventIds: z.array(UuidSchema).optional().default([]),
});
export type CreateIncidentRequest = z.infer<typeof CreateIncidentRequestSchema>;

// POST /incidents - response
export const CreateIncidentResponseSchema = z.object({
  incident: z.object({
    id: UuidSchema,
    status: z.literal('OPEN'),
    title: z.string(),
    createdAt: IsoDateSchema,
  }),
});
export type CreateIncidentResponse = z.infer<typeof CreateIncidentResponseSchema>;

// GET /incidents - response
export const IncidentsListResponseSchema = z.object({
  items: z.array(IncidentSummarySchema),
});
export type IncidentsListResponse = z.infer<typeof IncidentsListResponseSchema>;

// GET /incidents/:id - response
export const IncidentDetailResponseSchema = z.object({
  incident: IncidentDetailSchema,
});
export type IncidentDetailResponse = z.infer<typeof IncidentDetailResponseSchema>;

// POST /incidents/:id/comments - request
export const CreateCommentRequestSchema = z.object({
  body: z.string(),
});
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

// POST /incidents/:id/comments - response
export const CreateCommentResponseSchema = z.object({
  comment: CommentSchema,
});
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>;

// ============================================================================
// Metrics Types
// ============================================================================

export const LatencyPercentilesSchema = z.object({
  p50: z.number(),
  p95: z.number(),
  p99: z.number(),
});
export type LatencyPercentiles = z.infer<typeof LatencyPercentilesSchema>;

export const FingerprintCountSchema = z.object({
  fingerprint: z.string(),
  count: z.number().int(),
});
export type FingerprintCount = z.infer<typeof FingerprintCountSchema>;

// GET /metrics/ops - response
export const OpsMetricsResponseSchema = z.object({
  latencyMs: LatencyPercentilesSchema,
  errorRate: z.number(),
  topFingerprints: z.array(FingerprintCountSchema),
  openIncidentCount: z.number().int(),
});
export type OpsMetricsResponse = z.infer<typeof OpsMetricsResponseSchema>;

// GET /metrics/timeseries - query parameters
export const TimeSeriesIntervalSchema = z.enum(['1m', '5m', '15m']);
export type TimeSeriesInterval = z.infer<typeof TimeSeriesIntervalSchema>;

export const TimeSeriesDurationSchema = z.enum(['15m', '1h', '6h', '24h']);
export type TimeSeriesDuration = z.infer<typeof TimeSeriesDurationSchema>;

export const TimeSeriesQuerySchema = z.object({
  interval: TimeSeriesIntervalSchema.default('1m'),
  duration: TimeSeriesDurationSchema.default('1h'),
});
export type TimeSeriesQuery = z.infer<typeof TimeSeriesQuerySchema>;

// GET /metrics/timeseries - response
export const TimeSeriesBucketSchema = z.object({
  ts: IsoDateSchema,
  total: z.number().int(),
  error: z.number().int(),
  warn: z.number().int(),
  info: z.number().int(),
  debug: z.number().int(),
});
export type TimeSeriesBucket = z.infer<typeof TimeSeriesBucketSchema>;

export const TimeSeriesResponseSchema = z.object({
  buckets: z.array(TimeSeriesBucketSchema),
  interval: TimeSeriesIntervalSchema,
  duration: TimeSeriesDurationSchema,
});
export type TimeSeriesResponse = z.infer<typeof TimeSeriesResponseSchema>;

// ============================================================================
// WebSocket Types - Client → Server Frames
// ============================================================================

export const WsEventFiltersSchema = z.object({
  severity: SeveritySchema.nullable(),
  type: z.string().nullable(),
});
export type WsEventFilters = z.infer<typeof WsEventFiltersSchema>;

export const WsSubscribeEventsSchema = z.object({
  type: z.literal('subscribe_events'),
  requestId: UuidSchema,
  filters: WsEventFiltersSchema,
  cursor: z.string().nullable(),
});
export type WsSubscribeEvents = z.infer<typeof WsSubscribeEventsSchema>;

export const WsUnsubscribeSchema = z.object({
  type: z.literal('unsubscribe'),
  requestId: UuidSchema,
});
export type WsUnsubscribe = z.infer<typeof WsUnsubscribeSchema>;

export const WsPingSchema = z.object({
  type: z.literal('ping'),
  ts: IsoDateSchema,
});
export type WsPing = z.infer<typeof WsPingSchema>;

// Discriminated union of all client→server frames
export const WsClientFrameSchema = z.discriminatedUnion('type', [
  WsSubscribeEventsSchema,
  WsUnsubscribeSchema,
  WsPingSchema,
]);
export type WsClientFrame = z.infer<typeof WsClientFrameSchema>;

// ============================================================================
// WebSocket Types - Server → Client Frames
// ============================================================================

export const WsSubscribedSchema = z.object({
  type: z.literal('subscribed'),
  requestId: UuidSchema,
});
export type WsSubscribed = z.infer<typeof WsSubscribedSchema>;

// Event payload within WS frame (without cursor at top level of event)
export const WsEventPayloadSchema = z.object({
  id: UuidSchema,
  ts: IsoDateSchema,
  type: z.string(),
  severity: SeveritySchema,
  fingerprint: z.string(),
  payload: z.record(z.unknown()),
});
export type WsEventPayload = z.infer<typeof WsEventPayloadSchema>;

export const WsEventSchema = z.object({
  type: z.literal('event'),
  event: WsEventPayloadSchema,
  cursor: z.string(),
});
export type WsEvent = z.infer<typeof WsEventSchema>;

export const WsResyncReasonSchema = z.enum(['CLIENT_LAG']);
export type WsResyncReason = z.infer<typeof WsResyncReasonSchema>;

export const WsResyncRequiredSchema = z.object({
  type: z.literal('resync_required'),
  reason: WsResyncReasonSchema,
});
export type WsResyncRequired = z.infer<typeof WsResyncRequiredSchema>;

export const WsErrorSchema = z.object({
  type: z.literal('error'),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type WsError = z.infer<typeof WsErrorSchema>;

export const WsPongSchema = z.object({
  type: z.literal('pong'),
  ts: IsoDateSchema,
});
export type WsPong = z.infer<typeof WsPongSchema>;

// Discriminated union of all server→client frames
export const WsServerFrameSchema = z.discriminatedUnion('type', [
  WsSubscribedSchema,
  WsEventSchema,
  WsResyncRequiredSchema,
  WsErrorSchema,
  WsPongSchema,
]);
export type WsServerFrame = z.infer<typeof WsServerFrameSchema>;
