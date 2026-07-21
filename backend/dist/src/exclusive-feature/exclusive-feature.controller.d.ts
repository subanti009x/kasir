import { ExclusiveFeatureService } from './exclusive-feature.service';
import { CreateExclusiveFeatureDto, UpdateExclusiveFeatureDto, AssignFeatureDto, UpdateAssignmentDto } from './dto/exclusive-feature.dto';
export declare class ExclusiveFeatureController {
    private readonly service;
    constructor(service: ExclusiveFeatureService);
    findAll(): Promise<({
        _count: {
            tenantFeatures: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        category: string;
        code: string;
        isActive: boolean;
    })[]>;
    create(dto: CreateExclusiveFeatureDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        category: string;
        code: string;
        isActive: boolean;
    }>;
    update(id: string, dto: UpdateExclusiveFeatureDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        category: string;
        code: string;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        category: string;
        code: string;
        isActive: boolean;
    }>;
    getTenantFeatures(tenantId: string): Promise<({
        feature: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string;
            code: string;
            isActive: boolean;
        };
    } & {
        id: string;
        tenantId: string;
        updatedAt: Date;
        enabled: boolean;
        featureId: string;
        config: import("@prisma/client/runtime/library").JsonValue | null;
        assignedAt: Date;
    })[]>;
    assign(dto: AssignFeatureDto): Promise<{
        tenant: {
            id: string;
            name: string;
        };
        feature: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string;
            code: string;
            isActive: boolean;
        };
    } & {
        id: string;
        tenantId: string;
        updatedAt: Date;
        enabled: boolean;
        featureId: string;
        config: import("@prisma/client/runtime/library").JsonValue | null;
        assignedAt: Date;
    }>;
    updateAssignment(id: string, dto: UpdateAssignmentDto): Promise<{
        feature: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string;
            code: string;
            isActive: boolean;
        };
    } & {
        id: string;
        tenantId: string;
        updatedAt: Date;
        enabled: boolean;
        featureId: string;
        config: import("@prisma/client/runtime/library").JsonValue | null;
        assignedAt: Date;
    }>;
    removeAssignment(id: string): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        enabled: boolean;
        featureId: string;
        config: import("@prisma/client/runtime/library").JsonValue | null;
        assignedAt: Date;
    }>;
    checkTenantFeatures(tenantId: string): Promise<{
        features: {
            id: string;
            name: string;
            description: string | null;
            category: string;
            code: string;
        }[];
        featureMap: Record<string, boolean>;
    }>;
}
