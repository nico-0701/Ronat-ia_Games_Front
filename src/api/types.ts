import type { components } from './schema';

/** Atalhos para os tipos do contrato (OpenAPI). O que o servidor devolve nunca é redefinido à mão. */
type Schemas = components['schemas'];

export type AuthResponse = Schemas['AuthResponse'];
export type UserDto = Schemas['UserDto'];
export type AvatarDto = Schemas['AvatarDto'];
export type MetaResponse = Schemas['MetaResponse'];
export type GroupSummary = Schemas['GroupSummaryDto'];
export type GroupDetail = Schemas['GroupDetailDto'];
export type GroupPreview = Schemas['GroupPreviewDto'];
export type GroupRole = Schemas['GroupRole'];
export type Member = Schemas['MemberDto'];
export type ClaimableMember = Schemas['ClaimableMemberDto'];
export type Game = Schemas['GameDto'];
export type GameSession = Schemas['GameSessionDto'];
export type GameSessionSummary = Schemas['GameSessionSummaryDto'];
export type SessionPlayer = Schemas['SessionPlayerDto'];
export type SessionStatus = Schemas['SessionStatus'];
export type Standing = Schemas['StandingDto'];
export type SessionEvent = Schemas['EventDto'];
export type Ranking = Schemas['RankingDto'];
export type RankingEntry = Schemas['RankingEntryDto'];
export type RankingPeriod = Schemas['RankingPeriod'];
export type HistoryPage = Schemas['HistoryPageDto'];
export type HistoryEntry = Schemas['HistoryEntryDto'];
export type MyStats = Schemas['MyStatsDto'];
export type LoginDevice = Schemas['SessionDto'];
export type PersonalDataExport = Schemas['PersonalDataExportDto'];
export type AvatarPresets = Schemas['AvatarPresetsDto'];
export type ActionResponse = Schemas['ActionResponse'];
