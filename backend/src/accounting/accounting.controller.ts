import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service.js';
import { CreateExpenseDto } from './dto/accounting.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'SUPER_ADMIN')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ---- Expenses ----

  @Post('expenses')
  createExpense(@CurrentUser() user: any, @Body() dto: CreateExpenseDto) {
    return this.accountingService.createExpense(user.tenantId, user.id, dto);
  }

  @Get('expenses')
  @ApiQuery({ name: 'startDate', required: false, example: '2026-07-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-07-31' })
  listExpenses(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.listExpenses(user.tenantId, startDate, endDate);
  }

  @Delete('expenses/:id')
  deleteExpense(@CurrentUser() user: any, @Param('id') id: string) {
    return this.accountingService.deleteExpense(user.tenantId, id);
  }

  // ---- Financial Statements ----

  @Get('balance-sheet')
  @ApiQuery({ name: 'asOfDate', required: false, example: '2026-07-06' })
  getBalanceSheet(@CurrentUser() user: any, @Query('asOfDate') asOfDate?: string) {
    return this.accountingService.getBalanceSheet(user.tenantId, asOfDate);
  }

  @Get('profit-loss')
  @ApiQuery({ name: 'startDate', required: true, example: '2026-07-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-07-31' })
  getProfitLoss(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getProfitLoss(user.tenantId, startDate, endDate);
  }
}
