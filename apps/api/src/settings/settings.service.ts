/**
 * @module settings.service
 *
 * Application service for notification settings. Composes the persisted
 * configuration with a live check of whether each secret's named
 * environment variable is currently populated (design.md D7 in
 * openspec/changes/notification-settings-and-board-reorder) — never the
 * value itself.
 */
import { Inject, Injectable } from '@nestjs/common';

import type { NotificationSettings } from '../domain/notification-settings.model';
import {
  NOTIFICATION_SETTINGS_REPOSITORY,
  type NotificationSettingsRepository,
} from '../application/ports/notification-settings-repository.port';
import type { UpdateNotificationSettingsDto } from './settings.dto';
import type {
  AutomationSettingsResponse,
  EmailSettingsResponse,
  NotificationSettingsResponse,
  TelegramSettingsResponse,
} from './settings.response.dto';

/**
 * Whether the named environment variable currently holds a non-empty value.
 *
 * @param envVarName - Environment variable name to check.
 * @returns `true` if set and non-empty.
 */
function isEnvVarConfigured(envVarName: string): boolean {
  const value = process.env[envVarName];
  return value !== undefined && value.length > 0;
}

/**
 * Shape the domain model into the dashboard-facing response, computing the
 * env-presence booleans and never including a secret value.
 *
 * @param settings - Persisted notification settings.
 * @returns The dashboard response DTO shape.
 */
function toResponse(settings: NotificationSettings): NotificationSettingsResponse {
  const telegram: TelegramSettingsResponse = {
    enabled: settings.telegramEnabled,
    chatId: settings.telegramChatId,
    botTokenEnv: settings.telegramBotTokenEnv,
    botTokenConfigured: isEnvVarConfigured(settings.telegramBotTokenEnv),
  };
  const email: EmailSettingsResponse = {
    enabled: settings.emailEnabled,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPasswordEnv: settings.smtpPasswordEnv,
    smtpPasswordConfigured: isEnvVarConfigured(settings.smtpPasswordEnv),
    fromEmail: settings.fromEmail,
    toEmail: settings.toEmail,
  };
  return {
    telegram,
    email,
    matchThreshold: settings.matchThreshold,
    digestHour: settings.digestHour,
  };
}

/**
 * Application service for notification settings.
 */
@Injectable()
export class SettingsService {
  /**
   * Application service for notification settings.
   *
   * @param repository - Notification settings repository port.
   */
  public constructor(
    @Inject(NOTIFICATION_SETTINGS_REPOSITORY)
    private readonly repository: NotificationSettingsRepository,
  ) {}

  /**
   * Read the effective notification settings for the dashboard.
   */
  public async getNotificationSettings(): Promise<NotificationSettingsResponse> {
    const settings = await this.repository.get();
    return toResponse(settings);
  }

  /**
   * Apply a partial update and return the effective settings.
   *
   * @param dto - Fields to change.
   */
  public async updateNotificationSettings(
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettingsResponse> {
    const settings = await this.repository.update(dto);
    return toResponse(settings);
  }

  /**
   * Read the subset of settings the n8n workflows need to route sends.
   * Contains no secret and no env-var name — only what a workflow needs to
   * decide whether and where to send.
   */
  public async getAutomationSettings(): Promise<AutomationSettingsResponse> {
    const settings = await this.repository.get();
    return {
      telegramEnabled: settings.telegramEnabled,
      telegramChatId: settings.telegramChatId,
      emailEnabled: settings.emailEnabled,
      toEmail: settings.toEmail,
      matchThreshold: settings.matchThreshold,
      digestHour: settings.digestHour,
    };
  }
}
