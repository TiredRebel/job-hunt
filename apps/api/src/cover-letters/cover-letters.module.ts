/**
 * @module cover-letters.module
 *
 * Bounded context: cover-letter draft reads, edits, and regeneration, scoped
 * to the active profile. Depends on {@link ProfilesModule} for active-profile
 * lookup and {@link JobsModule} for regeneration's job context.
 */
import { Module } from '@nestjs/common';

import { ProfilesModule } from '../profiles/profiles.module';
import { JobsModule } from '../jobs/jobs.module';
import { COVER_LETTER_REPOSITORY } from '../application/ports/cover-letter-repository.port';
import { LLM_COVER_LETTER_CLIENT } from '../application/ports/llm-cover-letter-client.port';
import { HttpLlmCoverLetterClient } from '../infrastructure/clients/http-llm-cover-letter.client';
import { PostgresCoverLetterRepository } from '../infrastructure/repositories/postgres-cover-letter.repository';
import { CoverLettersController } from './cover-letters.controller';
import { CoverLettersService } from './cover-letters.service';

/**
 * Cover-letters bounded-context module.
 */
@Module({
  imports: [ProfilesModule, JobsModule],
  controllers: [CoverLettersController],
  providers: [
    CoverLettersService,
    {
      provide: COVER_LETTER_REPOSITORY,
      useClass: PostgresCoverLetterRepository,
    },
    {
      provide: LLM_COVER_LETTER_CLIENT,
      useClass: HttpLlmCoverLetterClient,
    },
  ],
})
export class CoverLettersModule {}
