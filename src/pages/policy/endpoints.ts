

export const ENDPOINTS = {
  // --- Policy 
  policyTypes: "/p/types",
  policyTypesCustomer: "/customer/policyTypes",

  // Products
  products: "/p/iproducts",

  plansByProduct: (productId: string) =>
    `/p/pplans/ip/${productId}`,

  coveragesByPlan: (planId: string) =>
    `/p/pcoverages/pp/${planId}`,

  optionsByCoverage: (coverageId: string) =>
    `/p/coptions/pc/${coverageId}`,

  calculatePremium: "/p/premium/calculate",

  createPolicy: "/policies",

  customerPolicies: "/customer/policies",
  allPolicies: "/policies",

  // Auth
  loginCustomer: "/auth/login",

  // Claims
  claimTypes: "/claims/types",
  createClaim: "/claims",

  //Asset

  // Asset types depend on product
  assetTypesByProduct: (productId: string) =>
    `/asset/types/product/${productId}`,

  // All asset types (only if backend supports it)
  assetTypes: "/asset/types",

  activitiesByAssetType: (assetTypeId: string) =>
    `/asset/types/${assetTypeId}/activities`,

  usagesByActivity: (activityId: string) =>
    `/asset/activities/${activityId}/usages`,

  servicesByUsage: (usageId: string) =>
    `/asset/usages/${usageId}/services`,

  // Vehicle 
  vehicleMakes: "/vehicles/makes",

  vehicleModels: (make: string) =>
    `/vehicles/make/${encodeURIComponent(make)}`,

  vehicleCategories: (make: string, model: string) =>
    `/vehicles/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}/category`,

  vehicleYears: (make: string, model: string, category: string) =>
    `/vehicles/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}/category/${encodeURIComponent(category)}/year`,
} as const;
