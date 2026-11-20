import { BadRequestException, Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('me/avatar')
  @Roles('OWNER', 'CASHIER')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadMyAvatar(@UploadedFile() file: { mimetype: string; size: number; buffer: Buffer } | undefined, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('File foto profil wajib dipilih');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Foto profil harus berformat JPG, PNG, atau WebP');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Ukuran foto profil maksimal 2 MB');
    }

    const isJpeg = file.mimetype === 'image/jpeg' && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
    const isPng = file.mimetype === 'image/png' && file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = file.mimetype === 'image/webp' && file.buffer.toString('ascii', 0, 4) === 'RIFF' && file.buffer.toString('ascii', 8, 12) === 'WEBP';
    if (!isJpeg && !isPng && !isWebp) {
      throw new BadRequestException('Isi file tidak sesuai dengan format gambar yang dipilih');
    }

    const avatar = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.userService.updateMyAvatar(user.userId, user.tenantId, avatar);
  }

  @Delete('me/avatar')
  @Roles('OWNER', 'CASHIER')
  removeMyAvatar(@CurrentUser() user: any) {
    return this.userService.updateMyAvatar(user.userId, user.tenantId, null);
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
