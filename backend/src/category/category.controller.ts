import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.categoryService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoryService.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('OWNER', 'SUPER_ADMIN')
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: any) {
    return this.categoryService.create(dto, user.tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() user: any) {
    return this.categoryService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @Roles('OWNER', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoryService.remove(id, user.tenantId);
  }
}
