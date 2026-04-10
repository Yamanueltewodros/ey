/**
 * hooks.ts
 * ─────────────────────────────────────────────────────────────
 * React hooks for the Policy module.
 * Each hook manages loading / error state for one service call.
 * No fetch() calls here — all data comes from api/services.ts.
 */

import { useState, useCallback, useEffect } from "react";
import { policyService, assetService, vehicleService, extractPolicyList } from "./services";
import {
  PolicyType,
  Product,
  CoverageOption,
  AssetType,
  AssetActivityDto,
  AssetUsageDto,
  AssetServiceDto,
  VehicleMake,
  VehicleModel,
  VehicleCategory,
  VehicleYear,
  Policy,
} from "./types";

// ─── Policy hooks ─────────────────────────────────────────────

export const usePolicyTypes = (
  selectedId: string,
  setSelectedId: (id: string) => void
) => {
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await policyService.getTypes();
      setPolicyTypes(data);
      if (!selectedId && data.length > 0) setSelectedId(data[0].id);
    } catch (err: any) {
      setPolicyTypes([]);
      setError(err?.message || "Error loading policy types");
    } finally {
      setLoading(false);
    }
  }, [selectedId, setSelectedId]);

  return { policyTypes, loading, error, fetchPolicyTypes: fetch };
};

export const useProducts = (
  policyTypeId: string,
  setSelectedProductId: (id: string) => void
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!policyTypeId) { setProducts([]); setSelectedProductId(""); return; }
    setLoading(true);
    setError("");
    try {
      const data = await policyService.getProducts(policyTypeId);
      setProducts(data);
      if (data.length > 0) setSelectedProductId(data[0].id);
      else setSelectedProductId("");
    } catch (err: any) {
      setProducts([]);
      setSelectedProductId("");
      setError(err?.message || "Error loading products");
    } finally {
      setLoading(false);
    }
  }, [policyTypeId, setSelectedProductId]);

  return { products, loading, error, fetchProducts: fetch };
};

export const useCoverages = (productId: string) => {
  const [coverageOptions, setCoverageOptions] = useState<CoverageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!productId) { setCoverageOptions([]); return; }
    setLoading(true);
    setError("");
    try {
      const data = await policyService.getCoverages(productId);
      setCoverageOptions(data);
    } catch (err: any) {
      setCoverageOptions([]);
      setError(err?.message || "Error loading coverages");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  return { coverageOptions, loading, error, fetchCoverages: fetch };
};

// ─── Asset hooks ──────────────────────────────────────────────

export const useAssetTypes = (
  selectedId: string,
  setSelectedId: (id: string) => void
) => {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await assetService.getTypes();
      setAssetTypes(data);
      if (!selectedId && data.length > 0) setSelectedId(data[0].id);
    } catch (err: any) {
      setAssetTypes([]);
      setError(err?.message || "Error loading asset types");
    } finally {
      setLoading(false);
    }
  }, [selectedId, setSelectedId]);

  return { assetTypes, loading, error, fetchAssetTypes: fetch };
};

export const useAssetActivities = (assetTypeId: string) => {
  const [activities, setActivities] = useState<AssetActivityDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!assetTypeId) { setActivities([]); return; }
    setLoading(true);
    setError("");
    try {
      setActivities(await assetService.getActivities(assetTypeId));
    } catch (err: any) {
      setActivities([]);
      setError(err?.message || "Error loading activities");
    } finally {
      setLoading(false);
    }
  }, [assetTypeId]);

  return { activities, loading, error, fetchActivities: fetch };
};

export const useActivityUsages = (activityId: string) => {
  const [usages, setUsages] = useState<AssetUsageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!activityId) { setUsages([]); return; }
    setLoading(true);
    setError("");
    try {
      setUsages(await assetService.getUsages(activityId));
    } catch (err: any) {
      setUsages([]);
      setError(err?.message || "Error loading usages");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  return { usages, loading, error, fetchUsages: fetch };
};

export const useUsageServices = (usageId: string) => {
  const [services, setServices] = useState<AssetServiceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!usageId) { setServices([]); return; }
    setLoading(true);
    setError("");
    try {
      setServices(await assetService.getServices(usageId));
    } catch (err: any) {
      setServices([]);
      setError(err?.message || "Error loading services");
    } finally {
      setLoading(false);
    }
  }, [usageId]);

  return { services, loading, error, fetchServices: fetch };
};

// ─── Vehicle hooks ────────────────────────────────────────────

export const useVehicleMakes = () => {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMakes(await vehicleService.getMakes());
    } catch (err: any) {
      setMakes([]);
      setError(err?.message || "Error loading makes");
    } finally {
      setLoading(false);
    }
  }, []);

  return { makes, loading, error, fetchMakes: fetch };
};

export const useVehicleModels = (make: string) => {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!make) { setModels([]); return; }
    setLoading(true);
    setError("");
    try {
      setModels(await vehicleService.getModels(make));
    } catch (err: any) {
      setModels([]);
      setError(err?.message || "Error loading models");
    } finally {
      setLoading(false);
    }
  }, [make]);

  return { models, loading, error, fetchModels: fetch };
};

export const useVehicleCategories = (make: string, model: string) => {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!make || !model) { setCategories([]); return; }
    setLoading(true);
    setError("");
    try {
      setCategories(await vehicleService.getCategories(make, model));
    } catch (err: any) {
      setCategories([]);
      setError(err?.message || "Error loading categories");
    } finally {
      setLoading(false);
    }
  }, [make, model]);

  return { categories, loading, error, fetchCategories: fetch };
};

export const useVehicleYears = (make: string, model: string, category: string) => {
  const [years, setYears] = useState<VehicleYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!make || !model || !category) { setYears([]); return; }
    setLoading(true);
    setError("");
    try {
      setYears(await vehicleService.getYears(make, model, category));
    } catch (err: any) {
      setYears([]);
      setError(err?.message || "Error loading years");
    } finally {
      setLoading(false);
    }
  }, [make, model, category]);

  return { years, loading, error, fetchYears: fetch };
};

// ─── Policy Revealer hook ─────────────────────────────────────

export const usePolicyData = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");

    const { getToken } = await import("./client");
    if (!getToken()) {
      setPolicies([]);
      setError("You must be logged in to view policies.");
      setLoading(false);
      return;
    }

    try {
      const data = await policyService.getUserPolicies();
      setPolicies(extractPolicyList(data));
    } catch (err: any) {
      setPolicies([]);
      if (err?.status === 401 || err?.status === 403) {
        setError("Unauthorized. Please login again.");
      } else {
        setError(err?.message || "Error loading policies");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { policies, loading, error, refetch: fetch };
};
