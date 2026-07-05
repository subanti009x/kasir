import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

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
