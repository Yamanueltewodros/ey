// src/pages/policy/PolicyAdderWizard.tsx
import React from "react";
import {
  PolicyType,
  Product,
  CoverageOption,
  SelectedCoverageState,
} from "./PolicyAdder";

import {
  Step1PolicyAsset,
  Step2PersonalPolicy,
  Step3ReviewSubmit,
} from "./WizardSteps";

interface PolicyAdderWizardProps {
  currentStep: number;
  completedSteps: number[];
  goToStep: (step: number) => void;

  // Policy type data
  policyTypes: PolicyType[];
  selectedPolicyTypeId: string;
  setSelectedPolicyTypeId: (id: string) => void;
  
  // Product data
  products: Product[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  
  // Coverage data
  coverageOptions: CoverageOption[];
  selectedCoverages: Record<string, SelectedCoverageState>;
  toggleCoverageIncluded: (coverageId: string) => void;
  toggleRiskFactor?: (coverageId: string, riskId: string) => void; // Made optional
  
  // Asset data
  assetTypes: Array<{id: string, name?: string}>;
  assetTypeId: string;
  setAssetTypeId: (id: string) => void;
  
  // Loading states for dropdowns
  loadingProducts: boolean;
  loadingCoverages: boolean;
  loadingMakes: boolean;
  loadingModels: boolean;
  loadingCategories: boolean;
  loadingYears: boolean;
  
  // Vehicle API data
  makes: Array<{make?: string, name?: string, id?: string}>;
  models: Array<{model?: string, name?: string, id?: string}>;
  categories: Array<{category?: string, name?: string, id?: string}>;
  years: Array<{year?: number, name?: string, id?: string}>;
  
  // Vehicle selection
  selectedMake: string;
  setSelectedMake: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  
  // Form data
  policyHolder: any;
  setPolicyHolder: (field: string | object, value?: any) => void;
  policyDetails: any;
  setPolicyDetails: (field: string | object, value?: any) => void;
  vehicleDetails: any;
  setVehicleDetails: (field: string | object, value?: any) => void;
  
  // Navigation
  prevStep: () => void;
  nextStep: () => void;
  handleSubmit: () => void; // Changed to () => void
  
  // Submission
  isSubmitting: boolean;
}

/**
 * ✅ Simplified 3-Step Flow:
 * 1) Policy & Asset Selection - Choose insurance type, product, vehicle details
 * 2) Personal & Policy Details - Account setup and policy timeline
 * 3) Review & Submit - Final review and submission
 */
export const UPDATED_STEPS = [
  { id: 1, title: "Policy & Asset", description: "Choose insurance and vehicle details" },
  { id: 2, title: "Personal Info", description: "Account setup and policy timeline" },
  { id: 3, title: "Review", description: "Final review and submission" },
];

export const PolicyAdderWizard: React.FC<PolicyAdderWizardProps> = ({
  currentStep,
  completedSteps,
  goToStep,
  
  // Policy data
  policyTypes,
  selectedPolicyTypeId,
  setSelectedPolicyTypeId,
  products,
  selectedProductId,
  setSelectedProductId,
  coverageOptions,
  selectedCoverages,
  toggleCoverageIncluded,
  toggleRiskFactor, // Now optional
  loadingProducts,
  loadingCoverages,
  
  // Asset data
  assetTypes,
  assetTypeId,
  setAssetTypeId,
  
  // Loading states
  loadingMakes,
  loadingModels,
  loadingCategories,
  loadingYears,
  
  // Vehicle API data
  makes,
  models,
  categories,
  years,
  selectedMake,
  setSelectedMake,
  selectedModel,
  setSelectedModel,
  selectedCategory,
  setSelectedCategory,
  selectedYear,
  setSelectedYear,
  
  // Form data
  policyHolder,
  setPolicyHolder,
  policyDetails,
  setPolicyDetails,
  vehicleDetails,
  setVehicleDetails,
  
  // Navigation
  prevStep,
  nextStep,
  handleSubmit,
  
  // Submission
  isSubmitting,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // prevent accidental next/submit by Enter (except final step)
    if (e.key === "Enter" && currentStep < UPDATED_STEPS.length) {
      e.preventDefault();
    }
  };

  // Step validation functions
  const isStep1Valid = () => {
    return selectedPolicyTypeId && selectedProductId && selectedMake && selectedModel;
  };

  const isStep2Valid = () => {
    return policyHolder?.phoneNumber && policyDetails?.effectiveDate;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !isStep1Valid()) {
      alert("Please complete all required fields: Policy Type, Product, Make, and Model");
      return;
    }
    
    if (currentStep === 2 && !isStep2Valid()) {
      alert("Please complete all required fields: Phone Number and Policy Start Date");
      return;
    }
    
    nextStep();
  };

  const renderStepContent = () => {
    const commonProps = {
      policyHolder,
      setPolicyHolder,
      policyDetails,
      setPolicyDetails,
      vehicleDetails,
      setVehicleDetails,
      handleKeyDown,
    };

    switch (currentStep) {
      case 1:
        return (
          <Step1PolicyAsset
            {...commonProps}
            policyTypes={policyTypes}
            products={products}
            selectedPolicyTypeId={selectedPolicyTypeId}
            selectedProductId={selectedProductId}
            setSelectedPolicyTypeId={setSelectedPolicyTypeId}
            setSelectedProductId={setSelectedProductId}
            loadingProducts={loadingProducts}
            coverageOptions={coverageOptions}
            selectedCoverages={selectedCoverages}
            toggleCoverageIncluded={toggleCoverageIncluded}
            makes={makes}
            models={models}
            categories={categories}
            years={years}
            selectedMake={selectedMake}
            setSelectedMake={setSelectedMake}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            loadingMakes={loadingMakes}
            loadingModels={loadingModels}
            loadingCategories={loadingCategories}
            loadingYears={loadingYears}
          />
        );

      case 2:
        return (
          <Step2PersonalPolicy
            {...commonProps}
            selectedPolicyTypeId={selectedPolicyTypeId}
            selectedProductId={selectedProductId}
            policyTypes={policyTypes}
            products={products}
          />
        );

      case 3:
        return (
          <Step3ReviewSubmit
            selectedPolicyTypeId={selectedPolicyTypeId}
            selectedProductId={selectedProductId}
            selectedMake={selectedMake}
            selectedModel={selectedModel}
            selectedCategory={selectedCategory}
            selectedYear={selectedYear}
            policyTypes={policyTypes}
            products={products}
            makes={makes}
            models={models}
            categories={categories}
            years={years}
            selectedCoverages={selectedCoverages}
            coverageOptions={coverageOptions}
            policyHolder={policyHolder}
            policyDetails={policyDetails}
            vehicleDetails={vehicleDetails}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Steps indicator (desktop) */}
      <div className="mb-8">
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {UPDATED_STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const canNavigate = step.id <= currentStep || isCompleted;

              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => canNavigate && goToStep(step.id)}
                    className={`flex flex-col items-center ${
                      canNavigate ? "cursor-pointer" : "cursor-default"
                    }`}
                    disabled={!canNavigate}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isCompleted
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-lg"
                          : isCurrent
                          ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <span className="text-lg font-bold">✓</span>
                      ) : (
                        <span className="text-lg font-bold">{step.id}</span>
                      )}
                    </div>
                    <span
                      className={`mt-3 text-sm font-semibold ${
                        isCurrent ? "text-blue-600" : 
                        isCompleted ? "text-emerald-600" : 
                        "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="mt-1 text-xs text-slate-500">{step.description}</span>
                  </button>

                  {index < UPDATED_STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-8 rounded-full ${
                        step.id < currentStep ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Steps indicator (mobile) */}
        <div className="md:hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                currentStep === 3 ? "bg-purple-600" : "bg-blue-600"
              } text-white font-bold text-lg shadow-lg`}>
                {currentStep}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {UPDATED_STEPS[currentStep - 1]?.title}
                </p>
                <p className="text-xs text-slate-600">
                  {UPDATED_STEPS[currentStep - 1]?.description}
                </p>
              </div>
            </div>
            <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Step {currentStep}/{UPDATED_STEPS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
              currentStep === 1
                ? "cursor-not-allowed text-slate-300 bg-slate-50"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>←</span> Back
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-slate-500">
              Step <span className="font-semibold text-blue-600">{currentStep}</span> of <span className="font-semibold">{UPDATED_STEPS.length}</span>
            </div>
            
            {currentStep < UPDATED_STEPS.length ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStep === 1 ? !isStep1Valid() : currentStep === 2 ? !isStep2Valid() : false}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
                <span className="text-lg">→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <span className="text-lg">✓</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
        <div className="mb-3 flex justify-between text-sm">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="font-semibold text-blue-600">
            {Math.round((currentStep / UPDATED_STEPS.length) * 100)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / UPDATED_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
          <div className={`text-center ${currentStep >= 1 ? "text-blue-600 font-medium" : ""}`}>
            Policy & Asset
          </div>
          <div className={`text-center ${currentStep >= 2 ? "text-blue-600 font-medium" : ""}`}>
            Personal Info
          </div>
          <div className={`text-center ${currentStep >= 3 ? "text-blue-600 font-medium" : ""}`}>
            Review
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          Need help? Contact our support team at support@insure.com
        </p>
      </div>
    </div>
  );
};
