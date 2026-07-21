export declare class CreateExclusiveFeatureDto {
    code: string;
    name: string;
    description?: string;
    category?: string;
}
export declare class UpdateExclusiveFeatureDto {
    name?: string;
    description?: string;
    category?: string;
    isActive?: boolean;
}
export declare class AssignFeatureDto {
    tenantId: string;
    featureId: string;
    enabled?: boolean;
}
export declare class UpdateAssignmentDto {
    enabled?: boolean;
}
