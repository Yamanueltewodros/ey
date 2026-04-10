/**
 * PolicyAdderHooks.tsx
 * ─────────────────────────────────────────────────────────────
 * Re-exports all hooks from the central hooks file.
 * Kept for backward compatibility. Import from "./hooks" in new code.
 */

export {
  usePolicyTypes,
  useProducts,
  useCoverages,
  useAssetTypes,
  useAssetActivities,
  useActivityUsages,
  useUsageServices,
  useVehicleMakes,
  useVehicleModels,
  useVehicleCategories,
  useVehicleYears,
  usePolicyData,
} from "./hooks";

// Type re-exports for backward compat
export type {
  AssetType,
  AssetServiceDto,
  AssetUsageDto,
  AssetActivityDto,
  VehicleMake,
  VehicleModel,
  VehicleCategory,
  VehicleYear,
} from "./types";
