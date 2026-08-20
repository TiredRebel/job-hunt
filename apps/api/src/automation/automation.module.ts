/**
 * @module automation.module
 *
 * Bounded context: the n8n automation surface — unprocessed-jobs feed,
 * result persistence, notification dedup, and the digest. Every route is
 * guarded by {@link InternalTokenGuard}; see design.md in
 * openspec/changes/phase-6-n8n-workflows for the split with n8n.
 */
import { Module } from '@nestjs/common';

import { AUTOMATION_REPOSITORY } from '../application/ports/automation-repository.port';
import { PROFILE_REPOSITORY } from '../application/ports/profile-repository.port';
import { SCRAPER_CLIENT } from '../application/ports/scraper-client.port';
import { HttpScraperClient } from '../infrastructure/clients/http-scraper.client';
import { PostgresAutomationRepository } from '../infrastructure/repositories/postgres-automation.repository';
import { PostgresProfileRepository } from '../infrastructure/repositories/postgres-profile.repository';
import { KeywordDictionariesModule } from '../keyword-dictionaries/keyword-dictionaries.module';
import { SourcesModule } from '../sources/sources.module';
import { SettingsModule } from '../settings/settings.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

/**
 * Automation bounded-context module. Imports {@link SettingsModule} to reuse
 * `SettingsService` for `GET /v1/automation/settings` rather than
 * duplicating the notification-settings query (design.md D2/D6 in
 * openspec/changes/notification-settings-and-board-reorder).
 */
@Module({
  imports: [SettingsModule, KeywordDictionariesModule, SourcesModule],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    {
      provide: AUTOMATION_REPOSITORY,
      useClass: PostgresAutomationRepository,
    },
    {
      provide: PROFILE_REPOSITORY,
      useClass: PostgresProfileRepository,
    },
    {
      provide: SCRAPER_CLIENT,
      useClass: HttpScraperClient,
    },
  ],
})
export class AutomationModule {}
