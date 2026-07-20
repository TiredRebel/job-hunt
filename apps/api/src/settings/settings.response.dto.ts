/**
 * @module settings.response.dto
 *
 * Response DTOs for the notification settings endpoints. No field carries a
 * secret value — only the environment variable name and a computed
 * "is it populated" boolean (design.md D7 in
 * openspec/changes/notification-settings-and-board-reorder).
 */
import { ApiProperty } from '@nestjs/swagger';

/** Telegram channel configuration, as returned by the API. */
export class TelegramSettingsResponse {
  /** Whether the Telegram channel is enabled. */
  @ApiProperty({ type: Boolean })
  public enabled!: boolean;

  /** Destination Telegram chat id, when configured. */
  @ApiProperty({ type: String, nullable: true })
  public chatId!: string | null;

  /** Name of the environment variable holding the bot token (never the value). */
  @ApiProperty({ type: String })
  public botTokenEnv!: string;

  /** Whether the named environment variable currently holds a value. */
  @ApiProperty({ type: Boolean })
  public botTokenConfigured!: boolean;
}

/** Email channel configuration, as returned by the API. */
export class EmailSettingsResponse {
  /** Whether the email channel is enabled. */
  @ApiProperty({ type: Boolean })
  public enabled!: boolean;

  /** SMTP server host, when configured. */
  @ApiProperty({ type: String, nullable: true })
  public smtpHost!: string | null;

  /** SMTP server port, when configured. */
  @ApiProperty({ type: Number, nullable: true })
  public smtpPort!: number | null;

  /** SMTP username, when configured. */
  @ApiProperty({ type: String, nullable: true })
  public smtpUser!: string | null;

  /** Name of the environment variable holding the SMTP password (never the value). */
  @ApiProperty({ type: String })
  public smtpPasswordEnv!: string;

  /** Whether the named environment variable currently holds a value. */
  @ApiProperty({ type: Boolean })
  public smtpPasswordConfigured!: boolean;

  /** Sender address for the digest email, when configured. */
  @ApiProperty({ type: String, nullable: true })
  public fromEmail!: string | null;

  /** Recipient address for the digest email, when configured. */
  @ApiProperty({ type: String, nullable: true })
  public toEmail!: string | null;
}

/** Response for `GET /v1/settings/notifications` and `PATCH /v1/settings/notifications`. */
export class NotificationSettingsResponse {
  /** Telegram channel configuration. */
  @ApiProperty({ type: TelegramSettingsResponse })
  public telegram!: TelegramSettingsResponse;

  /** Email channel configuration. */
  @ApiProperty({ type: EmailSettingsResponse })
  public email!: EmailSettingsResponse;

  /** Minimum match score (0-100) that triggers a notification. */
  @ApiProperty({ type: Number })
  public matchThreshold!: number;

  /** Hour of day (0-23) the daily digest is intended to run. */
  @ApiProperty({ type: Number })
  public digestHour!: number;
}

/** Response for `GET /v1/automation/settings` — the subset n8n workflows need to route sends. */
export class AutomationSettingsResponse {
  /** Whether the Telegram channel is enabled. */
  @ApiProperty({ type: Boolean })
  public telegramEnabled!: boolean;

  /** Destination Telegram chat id, when configured. */
  @ApiProperty({ type: String, nullable: true })
  public telegramChatId!: string | null;

  /** Whether the email channel is enabled. */
  @ApiProperty({ type: Boolean })
  public emailEnabled!: boolean;

  /** Recipient address for the digest email, when configured. */
  @ApiProperty({ type: String, nullable: true })
  public toEmail!: string | null;

  /** Minimum match score (0-100) that triggers a notification. */
  @ApiProperty({ type: Number })
  public matchThreshold!: number;

  /** Hour of day (0-23) the daily digest is intended to run. */
  @ApiProperty({ type: Number })
  public digestHour!: number;
}
