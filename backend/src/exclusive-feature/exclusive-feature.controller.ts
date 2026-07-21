import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExclusiveFeatureService } from './exclusive-feature.service';
import {
  CreateExclusiveFeatureDto,
  UpdateExclusiveFeatureDto,
  AssignFeatureDto,
  UpdateAssignmentDto,
} from './dto/exclusive-feature.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('exclusive-features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exclusive-features')
export class ExclusiveFeatureController {
  constructor(private readonly service: ExclusiveFeatureService) {}

  // ─── Master Feature CRUD (Super Admin) ──────────────────

  @Get()
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateExclusiveFeatureDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateExclusiveFeatureDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ─── Tenant Assignment (Super Admin) ────────────────────

  @Get('tenant/:tenantId')
  @Roles('SUPER_ADMIN')
  getTenantFeatures(@Param('tenantId') tenantId: string) {
    return this.service.getTenantFeatures(tenantId);
  }

  @Post('assign')
  @Roles('SUPER_ADMIN')
  assign(@Body() dto: AssignFeatureDto) {
    return this.service.assign(dto);
  }

  @Patch('assign/:id')
  @Roles('SUPER_ADMIN')
  updateAssignment(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.service.updateAssignment(id, dto);
  }

  @Delete('assign/:id')
  @Roles('SUPER_ADMIN')
  removeAssignment(@Param('id') id: string) {
    return this.service.removeAssignment(id);
  }

  // ─── Feature Check (All Roles) ─────────────────────────

  @Get('check/:tenantId')
  checkTenantFeatures(@Param('tenantId') tenantId: string) {
    return this.service.checkTenantFeatures(tenantId);
  }
}
