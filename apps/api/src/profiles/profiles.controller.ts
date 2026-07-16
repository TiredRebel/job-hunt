/**
 * @module profiles.controller
 *
 * REST controllers for profile CRUD and active-profile lookup.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './profiles.dto';

/**
 * Profiles API controller.
 */
@ApiTags('profiles')
@Controller({ path: 'profiles', version: '1' })
export class ProfilesController {
  /**
   * Profiles API controller.
   *
   * @param service - Profiles application service.
   */
  public constructor(private readonly service: ProfilesService) {}

  /**
   * List all profiles.
   */
  @Get()
  public async list() {
    return this.service.list();
  }

  /**
   * Get the active profile.
   */
  @Get('active')
  public async active() {
    return this.service.active();
  }

  /**
   * Get a profile by id.
   *
   * @param id - Profile id.
   */
  @Get(':id')
  public async get(@Param('id') id: string) {
    return this.service.get(Number(id));
  }

  /**
   * Create a profile.
   *
   * @param payload - Profile data.
   */
  @Post()
  public async create(@Body() payload: CreateProfileDto) {
    return this.service.create(payload);
  }

  /**
   * Update a profile.
   *
   * @param id - Profile id.
   * @param payload - Partial update.
   */
  @Patch(':id')
  public async update(@Param('id') id: string, @Body() payload: UpdateProfileDto) {
    return this.service.update(Number(id), payload);
  }

  /**
   * Delete a profile.
   *
   * @param id - Profile id.
   */
  @Delete(':id')
  public async remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
