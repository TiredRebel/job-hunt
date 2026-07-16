/**
 * @module cover-letters.module
 *
 * Bounded context: cover-letter draft reads and edits, scoped to the active
 * profile. Depends on {@link ProfilesModule} for active-profile lookup.
 */
import { Module } from '@nestjs/common';

import { ProfilesModule } from '../profiles/profiles.module';
import { COVER_LETTER_REPOSITORY } from '../application/ports/cover-letter-repository.port';
import { PostgresCoverLetterRepository } from '../infrastructure/repositories/postgres-cover-letter.repository';
import { CoverLettersController } from './cover-letters.controller';
import { CoverLettersService } from './cover-letters.service';

/**
 * Cover-letters bounded-context module.
 */
@Module({
  imports: [ProfilesModule],
  controllers: [CoverLettersController],
  providers: [
    CoverLettersService,
    {
      provide: COVER_LETTER_REPOSITORY,
      useClass: PostgresCoverLetterRepository,
    },
  ],
})
export class CoverLettersModule {}
