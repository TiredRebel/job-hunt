/**
 * @module sources.module
 *
 * Bounded context: job source administration and scrape run history. Triggers
 * scraper runs via the outbound scraper client port.
 */
import { Module } from '@nestjs/common';

import { SOURCE_REPOSITORY } from '../application/ports/source-repository.port';
import { SCRAPER_CLIENT } from '../application/ports/scraper-client.port';
import { HttpScraperClient } from '../infrastructure/clients/http-scraper.client';
import { PostgresSourceRepository } from '../infrastructure/repositories/postgres-source.repository';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';

/**
 * Sources bounded-context module.
 */
@Module({
  controllers: [SourcesController],
  providers: [
    SourcesService,
    {
      provide: SOURCE_REPOSITORY,
      useClass: PostgresSourceRepository,
    },
    {
      provide: SCRAPER_CLIENT,
      useClass: HttpScraperClient,
    },
  ],
  exports: [SOURCE_REPOSITORY],
})
export class SourcesModule {}
