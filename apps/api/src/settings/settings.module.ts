/**
 * @module settings.module
 *
 * Bounded context: notification channel configuration. Exports
 * `SettingsService` so the automation module can reuse it for
 * `GET /v1/automation/settings` rather than duplicating the repository
 * query (design.md D2 in
 * openspec/changes/notification-settings-and-board-reorder).
 */
import { Module } from '@nestjs/common';

import { NOTIFICATION_SETTINGS_REPOSITORY } from '../application/ports/notification-settings-repository.port';
import { PostgresNotificationSettingsRepository } from '../infrastructure/repositories/postgres-notification-settings.repository';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

/**
 * Notification settings bounded-context module.
 */
@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    {
      provide: NOTIFICATION_SETTINGS_REPOSITORY,
      useClass: PostgresNotificationSettingsRepository,
    },
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
