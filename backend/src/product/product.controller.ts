import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

type UploadedProductImage = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productService.findAll(user.tenantId, search, categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('OWNER', 'SUPER_ADMIN')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productService.create(dto, user.tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: any) {
    return this.productService.update(id, dto, user.tenantId);
  }

  @Post(':id/image')
  @Roles('OWNER', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: UploadedProductImage,
    @CurrentUser() user: any,
  ) {
    return this.productService.uploadImage(id, user.tenantId, file);
  }

  @Delete(':id')
  @Roles('OWNER', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.remove(id, user.tenantId);
  }
}
