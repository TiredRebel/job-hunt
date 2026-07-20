/**
 * @module notification-settings.model
 *
 * Notification channel configuration entity. Backed by two storage
 * locations under the hood (`core.notification_settings` for the channel
 * fields, `core.app_settings` for `matchThreshold`/`digestHour`) but
 * presented as one coherent read model — see design.md D2 in
 * openspec/changes/notification-settings-and-board-reorder. Secrets (the
 * Telegram bot token, the SMTP password) are never part of this type —
 * only the name of the environment variable holding each one.
 */

/**
 * Notification channel configuration, as persisted.
 */
export interface NotificationSettings {
  readonly telegramEnabled: boolean;
  readonly telegramChatId: string | null;
  readonly telegramBotTokenEnv: string;
  readonly emailEnabled: boolean;
  readonly smtpHost: string | null;
  readonly smtpPort: number | null;
  readonly smtpUser: string | null;
  readonly smtpPasswordEnv: string;
  readonly fromEmail: string | null;
  readonly toEmail: string | null;
  readonly matchThreshold: number;
  readonly digestHour: number;
}

/**
 * Partial update accepted for notification settings. Omitted fields are
 * left unchanged.
 */
export interface UpdateNotificationSettingsInput {
  readonly telegramEnabled?: boolean;
  readonly telegramChatId?: string | null;
  readonly telegramBotTokenEnv?: string;
  readonly emailEnabled?: boolean;
  readonly smtpHost?: string | null;
  readonly smtpPort?: number | null;
  readonly smtpUser?: string | null;
  readonly smtpPasswordEnv?: string;
  readonly fromEmail?: string | null;
  readonly toEmail?: string | null;
  readonly matchThreshold?: number;
  readonly digestHour?: number;
}
