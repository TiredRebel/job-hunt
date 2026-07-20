/**
 * @module board.controller
 *
 * REST controller for the board's manual card ordering. A distinct
 * top-level resource (`/v1/board`) from `/v1/reactions`, though both are
 * served by the reactions bounded context — see design.md D3/D5 in
 * openspec/changes/notification-settings-and-board-reorder.
 */
import { Body, Controller, HttpCode, Put } from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReactionsService } from './reactions.service';
import { SetBoardOrderDto } from './reactions.dto';

/**
 * Board ordering API controller.
 */
@ApiTags('board')
@Controller({ path: 'board', version: '1' })
export class BoardController {
  /**
   * Board ordering API controller.
   *
   * @param service - Reactions application service (owns board ordering too).
   */
  public constructor(private readonly service: ReactionsService) {}

  /**
   * Rewrite a board column's manual card order.
   *
   * @param payload - Stage and the full ordered list of job ids.
   */
  @Put('order')
  @HttpCode(204)
  @ApiOperation({ summary: "Rewrite a board column's manual card order" })
  @ApiBody({ type: SetBoardOrderDto })
  @ApiNoContentResponse()
  public async setOrder(@Body() payload: SetBoardOrderDto): Promise<void> {
    await this.service.setBoardOrder(
      payload.profileId,
      payload.stage,
      payload.jobIds.map((id) => BigInt(id)),
    );
  }
}
