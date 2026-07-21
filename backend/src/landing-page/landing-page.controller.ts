import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LandingPageService } from './landing-page.service';
import { LandingPageGuard } from './landing-page.guard';
import { LandingPageCheckoutDto } from './dto/landing-page.dto';

@ApiTags('landing-page')
@Controller('landing')
export class LandingPageController {
  constructor(private readonly service: LandingPageService) {}

  @Get(':slug/info')
  @UseGuards(LandingPageGuard)
  @ApiParam({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' })
  getStoreInfo(@Req() req: any) {
    return this.service.getStoreInfo(req.tenantId);
  }

  @Get(':slug/products')
  @UseGuards(LandingPageGuard)
  @ApiParam({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  getProducts(
    @Req() req: any,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getProducts(req.tenantId, categoryId, search);
  }

  @Get(':slug/categories')
  @UseGuards(LandingPageGuard)
  @ApiParam({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' })
  getCategories(@Req() req: any) {
    return this.service.getCategories(req.tenantId);
  }

  @Post(':slug/checkout')
  @UseGuards(LandingPageGuard)
  @ApiParam({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' })
  checkout(@Req() req: any, @Body() dto: LandingPageCheckoutDto) {
    return this.service.checkout(req.tenantId, dto);
  }
}
