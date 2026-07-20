/**
 * @module settings.controller
 *
 * REST controller for notification settings — the `/profile` page's
 * Notifications section reads and writes through this surface.
 */
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SettingsService } from './settings.service';
import { UpdateNotificationSettingsDto } from './settings.dto';
import { NotificationSettingsResponse } from './settings.response.dto';

/**
 * Notification settings API controller.
 */
@ApiTags('settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  /**
   * Notification settings API controller.
   *
   * @param service - Settings application service.
   */
  public constructor(private readonly service: SettingsService) {}

  /**
   * Read the effective notification settings.
   */
  @Get('notifications')
  @ApiOperation({ summary: 'Read notification settings' })
  @ApiOkResponse({ type: NotificationSettingsResponse })
  public async getNotificationSettings() {
    return this.service.getNotificationSettings();
  }

  /**
   * Apply a partial update to notification settings.
   *
   * @param payload - Fields to change.
   */
  @Patch('notifications')
  @ApiOperation({ summary: 'Update notification settings (partial)' })
  @ApiBody({ type: UpdateNotificationSettingsDto })
  @ApiOkResponse({ type: NotificationSettingsResponse })
  public async updateNotificationSettings(@Body() payload: UpdateNotificationSettingsDto) {
    return this.service.updateNotificationSettings(payload);
  }
}
