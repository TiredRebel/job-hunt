/**
 * @module settings.dto
 *
 * Request DTO for notification settings. Every field is optional —
 * partial-update semantics per the notification-settings spec: omitted
 * fields are left unchanged.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** Matches a valid environment variable name (uppercase, digits, underscore). */
const ENV_VAR_NAME_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

/**
 * DTO for partially updating notification settings.
 */
export class UpdateNotificationSettingsDto {
  /** Whether the Telegram channel is enabled. */
  @ApiPropertyOptional({ description: 'Whether the Telegram channel is enabled.', type: Boolean })
  @IsOptional()
  @IsBoolean()
  public telegramEnabled?: boolean;

  /** Destination Telegram chat id. */
  @ApiPropertyOptional({ description: 'Destination Telegram chat id.', type: String })
  @IsOptional()
  @IsString()
  public telegramChatId?: string;

  /** Name of the environment variable holding the Telegram bot token (never the value). */
  @ApiPropertyOptional({
    description:
      'Name of the environment variable holding the Telegram bot token (never the value).',
    type: String,
    example: 'TELEGRAM_BOT_TOKEN',
  })
  @IsOptional()
  @Matches(ENV_VAR_NAME_PATTERN, { message: 'must be a valid environment variable name' })
  public telegramBotTokenEnv?: string;

  /** Whether the email channel is enabled. */
  @ApiPropertyOptional({ description: 'Whether the email channel is enabled.', type: Boolean })
  @IsOptional()
  @IsBoolean()
  public emailEnabled?: boolean;

  /** SMTP server host. */
  @ApiPropertyOptional({ description: 'SMTP server host.', type: String })
  @IsOptional()
  @IsString()
  public smtpHost?: string;

  /** SMTP server port (1–65535). */
  @ApiPropertyOptional({ description: 'SMTP server port (1-65535).', type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65_535)
  public smtpPort?: number;

  /** SMTP username. */
  @ApiPropertyOptional({ description: 'SMTP username.', type: String })
  @IsOptional()
  @IsString()
  public smtpUser?: string;

  /** Name of the environment variable holding the SMTP password (never the value). */
  @ApiPropertyOptional({
    description: 'Name of the environment variable holding the SMTP password (never the value).',
    type: String,
    example: 'SMTP_PASSWORD',
  })
  @IsOptional()
  @Matches(ENV_VAR_NAME_PATTERN, { message: 'must be a valid environment variable name' })
  public smtpPasswordEnv?: string;

  /** Sender address for the digest email. */
  @ApiPropertyOptional({ description: 'Sender address for the digest email.', type: String })
  @IsOptional()
  @IsEmail()
  public fromEmail?: string;

  /** Recipient address for the digest email. */
  @ApiPropertyOptional({ description: 'Recipient address for the digest email.', type: String })
  @IsOptional()
  @IsEmail()
  public toEmail?: string;

  /** Minimum match score (0-100) that triggers a notification. */
  @ApiPropertyOptional({
    description: 'Minimum match score (0-100) that triggers a notification.',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  public matchThreshold?: number;

  /** Hour of day (0-23) the daily digest is intended to run. */
  @ApiPropertyOptional({
    description: 'Hour of day (0-23) the daily digest is intended to run.',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  public digestHour?: number;
}
