/**
 * @module lib/api/settings
 *
 * Typed functions for the `/settings/notifications` resource.
 */
import { apiRequest } from './client';
import type { OperationBody, OperationResponse } from './types';

/** Notification settings, as returned by the API. */
export type NotificationSettings =
  OperationResponse<'SettingsController_getNotificationSettings_v1'>;

/** Body accepted by {@link updateNotificationSettings} (partial update). */
export type UpdateNotificationSettingsBody =
  OperationBody<'SettingsController_updateNotificationSettings_v1'>;

/**
 * Get the effective notification settings.
 *
 * @param signal - Optional abort signal.
 * @returns Current notification settings.
 */
export async function getNotificationSettings(signal?: AbortSignal): Promise<NotificationSettings> {
  return apiRequest<NotificationSettings>('/settings/notifications', { signal });
}

/**
 * Apply a partial update to notification settings.
 *
 * @param body - Fields to change.
 * @returns The updated notification settings.
 */
export async function updateNotificationSettings(
  body: UpdateNotificationSettingsBody,
): Promise<NotificationSettings> {
  return apiRequest<NotificationSettings>('/settings/notifications', { method: 'PATCH', body });
}
