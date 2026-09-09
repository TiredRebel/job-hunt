/**
 * @module web-api
 *
 * Typed dashboard API client modules and shared React Query keys.
 */
export { ApiError, apiRequest, buildQueryString, buildUrl } from './client';
export type { ApiRequestOptions, HttpMethod, QueryParams, QueryValue } from './client';
export { getApiBaseUrl, getClientApiBaseUrl, getServerApiBaseUrl } from './env';
export { queryKeys } from './query-keys';
export type { OperationBody, OperationQuery, OperationResponse } from './types';
export { listDeadLetterJobs } from './automation';
export type { DeadLetterJob } from './automation';
export { getCoverLetter, regenerateCoverLetter, saveCoverLetter } from './cover-letters';
export type { CoverLetter, SaveCoverLetterBody } from './cover-letters';
export {
  createDictionary,
  deleteDictionary,
  getDictionary,
  listDictionaries,
  updateDictionary,
} from './dictionaries';
export type {
  CreateDictionaryBody,
  DictionaryKind,
  KeywordDictionary,
  UpdateDictionaryBody,
} from './dictionaries';
export { deleteJob, deleteJobs, getJob, listJobs, setJobStatus } from './jobs';
export type {
  BulkDeletedJobsResponse,
  DateField,
  DeletedJobResponse,
  Job,
  JobDetail,
  JobSortBy,
  JobsListParams,
  PaginatedJobs,
  SetJobStatusBody,
  SortDir,
} from './jobs';
export {
  createLlmProvider,
  deleteLlmProvider,
  listLlmModels,
  listLlmProviders,
  setActiveLlmProvider,
  testLlmProvider,
  testLlmProviderConnection,
  updateLlmProvider,
} from './llm';
export type {
  CreateLlmProviderBody,
  LlmProvider,
  LlmProviderKind,
  ModelList,
  ProviderTestResult,
  TestLlmProviderConnectionBody,
  UpdateLlmProviderBody,
} from './llm';
export {
  createProfile,
  deleteProfile,
  getActiveProfile,
  getProfile,
  listProfiles,
  updateProfile,
} from './profiles';
export type { CreateProfileBody, Profile, UpdateProfileBody } from './profiles';
export { addBulkReactions, addReaction, getReactionTimeline, setBoardOrder } from './reactions';
export type {
  AddBulkReactionsParams,
  AddReactionParams,
  BoardStage,
  BulkInserted,
  ReactionEvent,
  ReactionKind,
  SetBoardOrderParams,
} from './reactions';
export { getJobsReconciliation, getSourceReconciliation } from './reconciliation';
export type { JobsReconciliationAggregate, SourceReconciliation } from './reconciliation';
export { getNotificationSettings, updateNotificationSettings } from './settings';
export type { NotificationSettings, UpdateNotificationSettingsBody } from './settings';
export {
  createSource,
  deleteSource,
  getSource,
  getSourceRuns,
  listAdapters,
  listSources,
  setSourceEnabled,
  testSource,
  triggerScrape,
  updateSource,
} from './sources';
export type {
  CreateSourceBody,
  DeletedSourceResponse,
  ScrapeRun,
  Source,
  SourceFetchStrategy,
  SourceRunsParams,
  SourceTestResult,
  UpdateSourceBody,
} from './sources';
