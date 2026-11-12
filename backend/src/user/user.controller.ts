import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('OWNER', 'SUPER_ADMIN')
  findAll(@CurrentUser() user: any) {
    return this.userService.findAll(user.tenantId);
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.userService.findOne(user.userId, user.tenantId);
  }

  @Get(':id')
  @Roles('OWNER', 'SUPER_ADMIN')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('OWNER', 'SUPER_ADMIN')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.userService.create(dto, user.tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.userService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @Roles('OWNER', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.remove(id, user.tenantId);
  }
}
