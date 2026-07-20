/**
 * @module notification-settings-repository.port
 *
 * Port for reading and partially updating notification settings. The
 * implementation is responsible for the D2 split between
 * `core.notification_settings` and the `match_threshold`/`digest_hour`
 * scalars in `core.app_settings` — callers see one coherent record.
 */
import type {
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from '../../domain/notification-settings.model';

/**
 * Repository contract for notification settings.
 */
export interface NotificationSettingsRepository {
  /**
   * Read the current effective settings.
   */
  get(): Promise<NotificationSettings>;

  /**
   * Apply a partial update. Omitted fields are left unchanged.
   *
   * @param patch - Fields to change.
   */
  update(patch: UpdateNotificationSettingsInput): Promise<NotificationSettings>;
}

/**
 * Injection token for the notification settings repository port.
 */
export const NOTIFICATION_SETTINGS_REPOSITORY = Symbol('NOTIFICATION_SETTINGS_REPOSITORY');
