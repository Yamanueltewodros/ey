/**
 * PolicyAdder.tsx
 * ─────────────────────────────────────────────────────────────
 * Orchestrates the policy creation wizard.
 * All API calls go through hooks → services → client.
 * No fetch() calls here.
 */

import React, { useEffect, useState, useCallback } from "react";
import { PolicyAdderWizard, UPDATED_STEPS } from "./PolicyAdderWizard";
import { PolicyAdderHeader } from "./PolicyAdderHeader";

// ✅ All types from one place
export type {
  PolicyType,
  Product,
  CoverageOption,
  RiskFactor,
  SelectedCoverageState,
  AssetType,
} from "./types";

// ✅ All hooks from one place
import {
  usePolicyTypes,
  useProducts,
  useCoverages,
  useVehicleMakes,
  useVehicleModels,
  useVehicleCategories,
  useVehicleYears,
} from "./hooks";

import { assetService, findVehicleAssetType, policyService } from "./services";

import type {
  PolicyHolderForm,
  PolicyDetailsForm,
  VehicleDetailsForm,
  SelectedCoverageState,
  CreatePolicyPayload,
} from "./types";

// ─── Utility ─────────────────────────────────────────────────

export const addOneYear = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

// ─── Default form values ──────────────────────────────────────

const DEFAULT_POLICY_HOLDER: PolicyHolderForm = { phoneNumber: "" };
const DEFAULT_POLICY_DETAILS: PolicyDetailsForm = {
  effectiveDate: new Date().toISOString().split("T")[0],
  policyDuration: "12",
};
const DEFAULT_VEHICLE_DETAILS: VehicleDetailsForm = {
  name: "", value: "", vin: "", make: "", model: "", year: "", category: "",
};

// ─── Component ───────────────────────────────────────────────

export default function PolicyAdder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [selectedPolicyTypeId, setSelectedPolicyTypeId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCoverages, setSelectedCoverages] = useState<Record<string, SelectedCoverageState>>({});

  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [assetTypeId, setAssetTypeId] = useState("");
  const [assetTypeName, setAssetTypeName] = useState("");
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  const [activityId, setActivityId] = useState("");
  const [usageId, setUsageId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [policyHolder, setPolicyHolder] = useState<PolicyHolderForm>(DEFAULT_POLICY_HOLDER);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailsForm>(DEFAULT_POLICY_DETAILS);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetailsForm>(DEFAULT_VEHICLE_DETAILS);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Hooks ──────────────────────────────────────────────────
  const { policyTypes, loading: loadingPolicyTypes, fetchPolicyTypes } = usePolicyTypes(selectedPolicyTypeId, setSelectedPolicyTypeId);
  const { products, loading: loadingProducts, fetchProducts } = useProducts(selectedPolicyTypeId, setSelectedProductId);
  const { coverageOptions, loading: loadingCoverages, fetchCoverages } = useCoverages(selectedProductId);
  const { makes, loading: loadingMakes, fetchMakes } = useVehicleMakes();
  const { models, loading: loadingModels, fetchModels } = useVehicleModels(selectedMake);
  const { categories, loading: loadingCategories, fetchCategories } = useVehicleCategories(selectedMake, selectedModel);
  const { years, loading: loadingYears, fetchYears } = useVehicleYears(selectedMake, selectedModel, selectedCategory);

  // ── Initial data load ──────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await fetchPolicyTypes();
      await fetchMakes();
    };
    init();
  }, [fetchPolicyTypes, fetchMakes]);

  // Load asset types once product is known
  useEffect(() => {
    if (!selectedProductId) {
      setAssetTypeId("");
      setActivityId("");
      setUsageId("");
      setServiceId("");
      return;
    }
    const loadAssetTypes = async () => {
      setLoadingAssetTypes(true);
      try {
        const types = await assetService.getTypesByProduct(selectedProductId);
        const vehicleType = findVehicleAssetType(types) ?? types[0];
        if (vehicleType) {
          setAssetTypeId(vehicleType.id);
          setAssetTypeName(vehicleType.name || "");
        }
      } finally {
        setLoadingAssetTypes(false);
      }
    };
    loadAssetTypes();
  }, [selectedProductId]);

  // Load default usage profile (activity/usage/service) once asset type is known
  useEffect(() => {
    if (!assetTypeId) {
      setActivityId("");
      setUsageId("");
      setServiceId("");
      return;
    }

    let cancelled = false;
    const loadUsageProfile = async () => {
      try {
        const activities = await assetService.getActivities(assetTypeId);
        if (cancelled) return;
        const firstActivity = activities[0];
        const firstUsage = firstActivity?.usages?.[0];
        const firstService = firstUsage?.services?.[0];

        setActivityId(firstActivity?.id || "");
        setUsageId(firstUsage?.id || "");
        setServiceId(firstService?.id || "");
      } catch {
        if (!cancelled) {
          setActivityId("");
          setUsageId("");
          setServiceId("");
        }
      }
    };

    loadUsageProfile();
    return () => { cancelled = true; };
  }, [assetTypeId]);

  // ── Cascade fetches ────────────────────────────────────────
  useEffect(() => { if (selectedPolicyTypeId) fetchProducts(); }, [selectedPolicyTypeId, fetchProducts]);
  useEffect(() => { if (selectedProductId) fetchCoverages(); else setSelectedCoverages({}); }, [selectedProductId, fetchCoverages]);
  useEffect(() => { if (selectedMake) fetchModels(); }, [selectedMake, fetchModels]);
  useEffect(() => { if (selectedMake && selectedModel) { fetchCategories(); } }, [selectedMake, selectedModel, fetchCategories]);
  useEffect(() => { if (selectedMake && selectedModel && selectedCategory) { fetchYears(); } }, [selectedMake, selectedModel, selectedCategory, fetchYears]);

  // ── Validation ─────────────────────────────────────────────
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        if (!selectedPolicyTypeId) { setError("Please select a policy type"); return false; }
        if (!selectedProductId)    { setError("Please select a product"); return false; }
        if (!assetTypeId)          { setError("Asset type not loaded yet, please wait"); return false; }
        if (!selectedMake)         { setError("Please select a vehicle make"); return false; }
        if (!selectedModel)        { setError("Please select a vehicle model"); return false; }
        if (!activityId || !usageId || !serviceId) { setError("Usage profile not loaded yet, please wait"); return false; }
        return true;
      case 2:
        if (!policyHolder.phoneNumber.trim()) { setError("Please enter a phone number"); return false; }
        if (!policyDetails.effectiveDate) { setError("Please select a policy start date"); return false; }
        return true;
      default:
        return true;
    }
  }, [selectedPolicyTypeId, selectedProductId, assetTypeId, selectedMake, selectedModel, policyHolder, policyDetails]);

  // ── Form handlers ──────────────────────────────────────────
  const handlePolicyHolderChange = useCallback((field: string | object, value?: any) => {
    setPolicyHolder((prev) => typeof field === "object" ? { ...prev, ...(field as any) } : { ...prev, [field]: value });
  }, []);

  const handleVehicleDetailsChange = useCallback((field: string | object, value?: any) => {
    setVehicleDetails((prev) => typeof field === "object" ? { ...prev, ...(field as any) } : { ...prev, [field]: value });
  }, []);

  const handlePolicyDetailsChange = useCallback((field: string | object, value?: any) => {
    setPolicyDetails((prev) => typeof field === "object" ? { ...prev, ...(field as any) } : { ...prev, [field]: value });
  }, []);

  const handleToggleCoverageIncluded = useCallback((coverageId: string) => {
    setSelectedCoverages((prev) => {
      const current = prev[coverageId] ?? { included: false, riskFactorIds: [] };
      return { ...prev, [coverageId]: { included: !current.included, riskFactorIds: !current.included ? current.riskFactorIds : [] } };
    });
  }, []);

  // ── Navigation ─────────────────────────────────────────────
  const handleNextStep = useCallback(() => {
    if (!validateStep(currentStep)) return;
    setCompletedSteps((prev) => prev.includes(currentStep) ? prev : [...prev, currentStep]);
    setCurrentStep((prev) => Math.min(prev + 1, UPDATED_STEPS.length));
    setError("");
  }, [currentStep, validateStep]);

  const handlePrevStep = useCallback(() => { setCurrentStep((prev) => Math.max(prev - 1, 1)); setError(""); }, []);

  const handleGoToStep = useCallback((step: number) => {
    if (step <= currentStep || completedSteps.includes(step)) { setCurrentStep(step); setError(""); }
  }, [currentStep, completedSteps]);

  // ── Reset ──────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setPolicyHolder(DEFAULT_POLICY_HOLDER);
    setPolicyDetails({ ...DEFAULT_POLICY_DETAILS, effectiveDate: new Date().toISOString().split("T")[0] });
    setVehicleDetails(DEFAULT_VEHICLE_DETAILS);
    setSelectedPolicyTypeId(""); setSelectedProductId(""); setSelectedCoverages({});
    setSelectedMake(""); setSelectedModel(""); setSelectedCategory(""); setSelectedYear("");
    setAssetTypeId(""); setCurrentStep(1); setCompletedSteps([]);
  }, []);

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!validateStep(1) || !validateStep(2)) { setCurrentStep(validateStep(1) ? 2 : 1); return; }
    setIsSubmitting(true);

    const valueStr = vehicleDetails.value ? String(vehicleDetails.value) : "";

    const payload: CreatePolicyPayload = {
      productId: selectedProductId,
      calculatePremiumPerAsset: true,
      assets: [{
        assetTypeId,
        asset: {
          type: "vehicle",
          make: vehicleDetails.make || selectedMake,
          model: vehicleDetails.model || selectedModel,
          category: vehicleDetails.category || selectedCategory,
          year: vehicleDetails.year || selectedYear,
          vin: vehicleDetails.vin || "",
          purchasePrice: valueStr || undefined,
          declaredValue: valueStr || undefined,
          insuredValue: valueStr || undefined,
          usageProfile: {
            activity: activityId,
            usage: usageId,
            service: serviceId,
          },
        },
      }],
      policyDetails: {
        effectiveDate: policyDetails.effectiveDate,
        policyDuration: policyDetails.policyDuration || "12",
      },
      p_c: { phoneNumber: policyHolder.phoneNumber },
    };

    try {
      const result = await policyService.create(payload);
      setSuccess(`Thank you! Policy submitted. ID: ${result?.policyId ?? "pending"}.`);
      setCompletedSteps((prev) => [...prev, 3]);
      setTimeout(resetForm, 3000);
    } catch (err: any) {
      setError(`Unable to submit your request: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInitialLoading = loadingPolicyTypes || loadingMakes || loadingAssetTypes;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <PolicyAdderHeader />

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-sm font-bold">✓</span>
              </div>
              <p className="text-sm font-medium text-emerald-800">{success}</p>
            </div>
          </div>
        )}

        <PolicyAdderWizard
          currentStep={currentStep} completedSteps={completedSteps} goToStep={handleGoToStep}
          assetTypes={[]} assetTypeId={assetTypeId} setAssetTypeId={setAssetTypeId}
          policyTypes={policyTypes} selectedPolicyTypeId={selectedPolicyTypeId} setSelectedPolicyTypeId={setSelectedPolicyTypeId}
          products={products} selectedProductId={selectedProductId} setSelectedProductId={setSelectedProductId}
          coverageOptions={coverageOptions} selectedCoverages={selectedCoverages} toggleCoverageIncluded={handleToggleCoverageIncluded}
          loadingProducts={loadingProducts} loadingCoverages={loadingCoverages}
          loadingMakes={loadingMakes} loadingModels={loadingModels} loadingCategories={loadingCategories} loadingYears={loadingYears}
          makes={makes} models={models} categories={categories} years={years}
          selectedMake={selectedMake} setSelectedMake={setSelectedMake}
          selectedModel={selectedModel} setSelectedModel={setSelectedModel}
          selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          selectedYear={selectedYear} setSelectedYear={setSelectedYear}
          policyHolder={policyHolder} setPolicyHolder={handlePolicyHolderChange}
          policyDetails={policyDetails} setPolicyDetails={handlePolicyDetailsChange}
          vehicleDetails={vehicleDetails} setVehicleDetails={handleVehicleDetailsChange}
          prevStep={handlePrevStep} nextStep={handleNextStep}
          handleSubmit={handleSubmit} isSubmitting={isSubmitting}
        />

        {isInitialLoading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <span>Loading initial data...</span>
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Need assistance?{" "}
            <a href="mailto:support@insure.com" className="text-blue-600 hover:text-blue-800 font-medium">support@insure.com</a>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            By submitting, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a> and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
