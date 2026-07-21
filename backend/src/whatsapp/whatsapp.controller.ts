import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { UpdateWhatsappConfigDto } from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('whatsapp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  getConfig(@CurrentUser() user: any) {
    return this.whatsappService.getOrCreateConfig(user.tenantId);
  }

  @Patch()
  @Roles('OWNER', 'SUPER_ADMIN')
  updateConfig(@Body() dto: UpdateWhatsappConfigDto, @CurrentUser() user: any) {
    return this.whatsappService.updateConfig(user.tenantId, dto);
  }

  @Post('connect')
  @Roles('OWNER', 'SUPER_ADMIN')
  connect(@CurrentUser() user: any) {
    return this.whatsappService.connectSession(user.tenantId);
  }

  @Post('disconnect')
  @Roles('OWNER', 'SUPER_ADMIN')
  disconnect(@CurrentUser() user: any) {
    return this.whatsappService.disconnectSession(user.tenantId);
  }

  @Get('logs')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getLogs(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.whatsappService.getLogs(user.tenantId, status, page, limit);
  }

  @Get('logs/stats')
  getLogStats(@CurrentUser() user: any) {
    return this.whatsappService.getLogStats(user.tenantId);
  }

  @Post('logs/:id/retry')
  @Roles('OWNER', 'SUPER_ADMIN')
  retryLog(@Param('id') id: string, @CurrentUser() user: any) {
    return this.whatsappService.retryFailedLog(user.tenantId, id);
  }
}
