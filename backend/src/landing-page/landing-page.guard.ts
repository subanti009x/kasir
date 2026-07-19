import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Guard that verifies a tenant has the LANDING_PAGE exclusive feature enabled.
 * Extracts `slug` from route params, resolves the tenant, checks the feature,
 * and injects `tenantId` into the request for downstream use.
 */
@Injectable()
export class LandingPageGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const slug = request.params.slug;

    if (!slug) {
      throw new NotFoundException('Tenant slug is required');
    }

    // Resolve tenant by slug
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, status: true },
    });

    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Store is not active');
    }

    // Check if tenant has LANDING_PAGE feature enabled
    const landingPageFeature = await this.prisma.tenantFeature.findFirst({
      where: {
        tenantId: tenant.id,
        enabled: true,
        feature: {
          code: 'LANDING_PAGE',
          isActive: true,
        },
      },
      include: {
        feature: { select: { code: true } },
      },
    });

    if (!landingPageFeature) {
      throw new ForbiddenException('Landing Page feature is not available for this store');
    }

    // Inject tenantId into request for downstream controllers/services
    request.tenantId = tenant.id;
    request.tenantName = tenant.name;

    return true;
  }
}
