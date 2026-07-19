/**
 * @module automation.controller
 *
 * REST controller for the n8n automation surface: unprocessed-jobs feed,
 * result persistence, notification dedup, and the digest. Every route is
 * guarded by {@link InternalTokenGuard} — this is not part of the public
 * dashboard API.
 */
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { AutomationService } from './automation.service';
import {
  DeadLetterJobsQueryDto,
  JobResultDto,
  RecordNotificationDto,
  UnnotifiedMatchesQueryDto,
  UnprocessedJobsQueryDto,
} from './automation.dto';
import {
  DeadLetterJobResponse,
  DigestResponse,
  DigestSentResponse,
  JobResultAckResponse,
  NotificationRecordedResponse,
  UnnotifiedMatchResponse,
  UnprocessedJobsResponse,
} from './automation.response.dto';
import { InternalTokenGuard } from './internal-token.guard';

/**
 * Automation API controller.
 */
@ApiTags('automation')
@ApiSecurity('internal-token')
@UseGuards(InternalTokenGuard)
@SkipThrottle()
@Controller({ path: 'automation', version: '1' })
export class AutomationController {
  /**
   * Automation API controller.
   *
   * @param service - Automation application service.
   */
  public constructor(private readonly service: AutomationService) {}

  /**
   * Fetch raw jobs awaiting processing, plus the active profile.
   *
   * @param query - Feed size.
   */
  @Get('jobs/unprocessed')
  @ApiOperation({ summary: 'Fetch raw jobs awaiting LLM processing' })
  @ApiOkResponse({ type: UnprocessedJobsResponse })
  public async unprocessedJobs(@Query() query: UnprocessedJobsQueryDto) {
    return this.service.unprocessedJobs(query.limit);
  }

  /**
   * List raw jobs that gave up after repeated processing failures.
   *
   * @param query - Feed size.
   */
  @Get('jobs/dead-letter')
  @ApiOperation({ summary: 'List raw jobs dead-lettered after repeated processing failures' })
  @ApiOkResponse({ type: DeadLetterJobResponse, isArray: true })
  public async deadLetterJobs(@Query() query: DeadLetterJobsQueryDto) {
    return this.service.deadLetterJobs(query.limit);
  }

  /**
   * Persist (or record the failure of) one processing-chain attempt.
   *
   * @param rawJobId - `scraper.jobs_raw.id`.
   * @param payload - Processing outcome.
   */
  @Post('jobs/:rawJobId/results')
  @ApiOperation({ summary: 'Persist one processing-chain result' })
  @ApiParam({ name: 'rawJobId', description: 'scraper.jobs_raw.id.', example: '42' })
  @ApiBody({ type: JobResultDto })
  @ApiCreatedResponse({ type: JobResultAckResponse })
  public async persistResult(
    @Param('rawJobId', ParseIntPipe) rawJobId: number,
    @Body() payload: JobResultDto,
  ) {
    return this.service.persistResult(rawJobId, payload);
  }

  /**
   * List matches awaiting notification on a channel.
   *
   * @param query - Notification channel.
   */
  @Get('matches/unnotified')
  @ApiOperation({ summary: 'List matches awaiting notification' })
  @ApiOkResponse({ type: UnnotifiedMatchResponse, isArray: true })
  public async unnotifiedMatches(@Query() query: UnnotifiedMatchesQueryDto) {
    return this.service.unnotifiedMatches(query.channel);
  }

  /**
   * Record a sent notification.
   *
   * @param payload - Match id and channel.
   */
  @Post('notifications')
  @ApiOperation({ summary: 'Record a sent notification' })
  @ApiBody({ type: RecordNotificationDto })
  @ApiCreatedResponse({ type: NotificationRecordedResponse })
  public async recordNotification(@Body() payload: RecordNotificationDto) {
    const jobMatchId = BigInt(payload.jobMatchId);
    await this.service.recordNotification(jobMatchId, payload.channel);
    return { jobMatchId: payload.jobMatchId, channel: payload.channel };
  }

  /**
   * Jobs and matches new since the last digest.
   */
  @Get('digest')
  @ApiOperation({ summary: 'Jobs and matches new since the last digest' })
  @ApiOkResponse({ type: DigestResponse })
  public async digest() {
    return this.service.digest();
  }

  /**
   * Advance the digest watermark to now.
   */
  @Post('digest/sent')
  @ApiOperation({ summary: 'Advance the digest watermark to now' })
  @ApiCreatedResponse({ type: DigestSentResponse })
  public async markDigestSent() {
    const lastDigestAt = await this.service.markDigestSent();
    return { lastDigestAt };
  }
}
