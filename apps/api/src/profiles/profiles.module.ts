/**
 * @module profiles.module
 *
 * Bounded context: user profile CRUD and active-profile selection.
 */
import { Module } from '@nestjs/common';

import { PROFILE_REPOSITORY } from '../application/ports/profile-repository.port';
import { PostgresProfileRepository } from '../infrastructure/repositories/postgres-profile.repository';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

/**
 * Profiles bounded-context module.
 */
@Module({
  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    {
      provide: PROFILE_REPOSITORY,
      useClass: PostgresProfileRepository,
    },
  ],
  exports: [PROFILE_REPOSITORY],
})
export class ProfilesModule {}
