import { Injectable, NotFoundException, ConflictException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationGateway } from '../notification/notification.gateway.js';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto.js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, @Optional() private notifications?: NotificationGateway) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMyAvatar(id: string, tenantId: string, avatar: string | null) {
    const user = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: { avatar },
    });
    if (!user.count) throw new NotFoundException('User not found');

    this.notifications?.notifyDataChanged(tenantId, 'users');
    return this.findOne(id, tenantId);
  }

  async create(dto: CreateUserDto, tenantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true,
      },
    });
    this.notifications?.notifyDataChanged(tenantId, 'users');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    this.notifications?.notifyDataChanged(tenantId, 'users');
    return user;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    const user = await this.prisma.user.delete({ where: { id } });
    this.notifications?.notifyDataChanged(tenantId, 'users');
    return user;
  }
}
