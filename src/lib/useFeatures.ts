"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import { exclusiveFeatureApi } from "./api";

/**
 * Hook to check which exclusive features are enabled for the current tenant.
 * Returns a `hasFeature(code)` function for quick checks in UI.
 *
 * Example usage:
 *   const { hasFeature } = useFeatures();
 *   if (hasFeature("PAYMENT_SYSTEM")) { ... }
 */
export function useFeatures() {
  const { user, token } = useAuth();
  const tenantId = user?.tenantId;

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-features", tenantId],
    queryFn: () => exclusiveFeatureApi.check(token!, tenantId!),
    enabled: !!token && !!tenantId,
    staleTime: 60_000, // Cache for 1 minute
  });

  const featureMap = data?.featureMap || {};
  const features = data?.features || [];

  function hasFeature(code: string): boolean {
    return !!featureMap[code];
  }

  return { hasFeature, features, featureMap, loading: isLoading };
}
