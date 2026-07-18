import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExclusiveFeatureDto,
  UpdateExclusiveFeatureDto,
  AssignFeatureDto,
  UpdateAssignmentDto,
} from './dto/exclusive-feature.dto';

@Injectable()
export class ExclusiveFeatureService {
  constructor(private prisma: PrismaService) {}

  // ─── Master Feature CRUD ────────────────────────────────

  async findAll() {
    return this.prisma.exclusiveFeature.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tenantFeatures: true } },
      },
    });
  }

  async findOne(id: string) {
    const feature = await this.prisma.exclusiveFeature.findUnique({
      where: { id },
      include: {
        tenantFeatures: {
          include: { tenant: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    if (!feature) throw new NotFoundException('Feature not found');
    return feature;
  }

  async create(dto: CreateExclusiveFeatureDto) {
    const existing = await this.prisma.exclusiveFeature.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException(`Feature code "${dto.code}" already exists`);

    return this.prisma.exclusiveFeature.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category || 'GENERAL',
      },
    });
  }

  async update(id: string, dto: UpdateExclusiveFeatureDto) {
    await this.findOne(id);
    return this.prisma.exclusiveFeature.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.exclusiveFeature.delete({ where: { id } });
  }

  // ─── Tenant Feature Assignment ──────────────────────────

  async getTenantFeatures(tenantId: string) {
    return this.prisma.tenantFeature.findMany({
      where: { tenantId },
      include: {
        feature: true,
      },
      orderBy: { assignedAt: 'asc' },
    });
  }

  async assign(dto: AssignFeatureDto) {
    // Check feature exists
    const feature = await this.prisma.exclusiveFeature.findUnique({
      where: { id: dto.featureId },
    });
    if (!feature) throw new NotFoundException('Feature not found');

    // Check tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Check for existing assignment
    const existing = await this.prisma.tenantFeature.findUnique({
      where: { tenantId_featureId: { tenantId: dto.tenantId, featureId: dto.featureId } },
    });
    if (existing) throw new ConflictException('Feature already assigned to this tenant');

    return this.prisma.tenantFeature.create({
      data: {
        tenantId: dto.tenantId,
        featureId: dto.featureId,
        enabled: dto.enabled ?? true,
      },
      include: { feature: true, tenant: { select: { id: true, name: true } } },
    });
  }

  async updateAssignment(id: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.tenantFeature.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.tenantFeature.update({
      where: { id },
      data: { enabled: dto.enabled },
      include: { feature: true },
    });
  }

  async removeAssignment(id: string) {
    const assignment = await this.prisma.tenantFeature.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.tenantFeature.delete({ where: { id } });
  }

  // ─── Feature Check (for any role) ──────────────────────

  async checkTenantFeatures(tenantId: string) {
    const assignments = await this.prisma.tenantFeature.findMany({
      where: {
        tenantId,
        enabled: true,
        feature: { isActive: true },
      },
      include: {
        feature: {
          select: { id: true, code: true, name: true, description: true, category: true },
        },
      },
    });

    // Return a flat map of { code: true } for quick lookup + full list
    const featureMap: Record<string, boolean> = {};
    const features = assignments.map((a) => {
      featureMap[a.feature.code] = true;
      return a.feature;
    });

    return { features, featureMap };
  }
}
