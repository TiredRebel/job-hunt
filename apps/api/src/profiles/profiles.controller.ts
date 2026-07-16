/**
 * @module profiles.controller
 *
 * REST controllers for profile CRUD and active-profile lookup.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { DeletedResponse } from '../common/common.response.dto';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './profiles.dto';
import { ProfileResponse } from './profiles.response.dto';

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
  @ApiOperation({ summary: 'List all profiles' })
  @ApiOkResponse({ type: ProfileResponse, isArray: true })
  public async list() {
    return this.service.list();
  }

  /**
   * Get the active profile.
   */
  @Get('active')
  @ApiOperation({ summary: 'Get the active profile' })
  @ApiOkResponse({ type: ProfileResponse })
  public async active() {
    return this.service.active();
  }

  /**
   * Get a profile by id.
   *
   * @param id - Profile id.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a profile by id' })
  @ApiParam({ name: 'id', description: 'Profile id.', example: '1' })
  @ApiOkResponse({ type: ProfileResponse })
  public async get(@Param('id') id: string) {
    return this.service.get(Number(id));
  }

  /**
   * Create a profile.
   *
   * @param payload - Profile data.
   */
  @Post()
  @ApiOperation({ summary: 'Create a profile' })
  @ApiBody({ type: CreateProfileDto })
  @ApiCreatedResponse({ type: ProfileResponse })
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
  @ApiOperation({ summary: 'Update a profile' })
  @ApiParam({ name: 'id', description: 'Profile id.', example: '1' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: ProfileResponse })
  public async update(@Param('id') id: string, @Body() payload: UpdateProfileDto) {
    return this.service.update(Number(id), payload);
  }

  /**
   * Delete a profile.
   *
   * @param id - Profile id.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a profile' })
  @ApiParam({ name: 'id', description: 'Profile id.', example: '1' })
  @ApiOkResponse({ type: DeletedResponse })
  public async remove(@Param('id') id: string): Promise<DeletedResponse> {
    return { deleted: await this.service.remove(Number(id)) };
  }
}
