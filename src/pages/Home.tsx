import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Section, SectionHeading, SectionSub } from '../components/common/Section'
import StarRating from '../components/ui/StarRating'
import Accordion from '../components/ui/Accordion'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

// Import hooks from your existing PolicyAdder
import { 
  usePolicyTypes, 
  useProducts, 
  useCoverages,
  useVehicleMakes,
  useVehicleModels,
  useVehicleCategories,
  useVehicleYears
} from '../pages/policy/PolicyAdderHooks'

const API_BASE = "/api";
const IN_TOKEN_KEY = "in-token";

type StepId = 'policy' | 'details' | 'contact' | 'review'

const steps: { id: StepId; label: string; sub: string }[] = [
  { id: 'policy', label: '1. Policy Type', sub: 'Choose policy and vehicle' },
  { id: 'details', label: '2. Details', sub: 'Vehicle and coverage details' },
  { id: 'contact', label: '3. Contact', sub: 'Your information' },
  { id: 'review', label: '4. Review', sub: 'Check & submit' },
]

export default function Home() {
  return (
    <div>
      {/* HERO – Ethiopia-focused */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b">
        <div className="container-prose section grid lg:grid-cols-12 gap-10 items-start">
          {/* Left */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="h1">
                Insurance in Ethiopia, <span className="text-brand-700">simple & transparent</span>
              </h1>
              <p className="p mt-4 max-w-2xl">
                Calculate your premium, sign policies online, pay with local banks or Telebirr, and manage
                everything from all over Ethiopia – without long queues or paper files.
              </p>
            </div>

            <div className="card">
              <div className="card-body grid sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">ተመረጠ እቃ (Featured)</p>
                  <h2 className="text-xl font-semibold flex items-center gap-2 mt-1">
                    Car Insurance <span className="text-2xl" aria-hidden>🚗</span>
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Third-party and comprehensive cover designed for Ethiopian roads, taxi fleets and private cars.
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-brand-700">from 1,200 ETB</span>
                    <span className="text-xs text-slate-500">/ month*</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-stretch">
                  <Link to="/policy/new" className="btn btn-primary w-full text-sm">
                    Create Policy
                  </Link>
                  <Button type="button" variant="ghost" className="w-full text-sm">
                    Request a call back
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <span aria-hidden className="text-xl">🇪🇹</span>
                <div>
                  <div className="font-medium">Built for Ethiopia</div>
                  <p className="text-xs text-slate-500">
                    Products tailored for local banks, traffic rules and business realities.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span aria-hidden className="text-xl">💬</span>
                <div>
                  <div className="font-medium">Local languages</div>
                  <p className="text-xs text-slate-500">
                    Support in Amharic, English and Afaan Oromo for key processes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span aria-hidden className="text-xl">📱</span>
                <div>
                  <div className="font-medium">Mobile-first</div>
                  <p className="text-xs text-slate-500">
                    Works on smartphones – perfect for customers in Addis and regions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span aria-hidden className="text-xl">🏦</span>
                <div>
                  <div className="font-medium">Local payments</div>
                  <p className="text-xs text-slate-500">
                    Pay via bank transfer, Telebirr, or card. Receipts sent instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Quick Policy Wizard */}
          <div className="lg:col-span-5">
            <QuickPolicyWizard />
          </div>
        </div>
      </section>

      {/* keep the rest of Home sections below as you already have */}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                          Quick Policy Wizard (Mini)                        */

function QuickPolicyWizard() {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Policy selection states
  const [selectedPolicyTypeId, setSelectedPolicyTypeId] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  
  // Vehicle states
  const [selectedMake, setSelectedMake] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("")
  
  // Contact info
  const [policyHolder, setPolicyHolder] = useState({
    username: "",
    phone: "",
    email: ""
  })

  // Form data
  const [policyDetails, setPolicyDetails] = useState({
    description: "Quick auto insurance policy",
    policyEffectiveDate: new Date().toISOString().split('T')[0],
    policyDuration: 12,
  })

  const [vehicleDetails, setVehicleDetails] = useState({
    value: "250000", // Default value
    vin: "",
  })

  // Hooks - SAME as PolicyAdder
  const { policyTypes, loadingTypes: loadingPolicyTypes, fetchPolicyTypes } = usePolicyTypes(selectedPolicyTypeId, setSelectedPolicyTypeId)
  const { products, loadingProducts, fetchProducts } = useProducts(selectedPolicyTypeId, setSelectedProductId)
  const { makes, loading: loadingMakes, fetchMakes } = useVehicleMakes()
  const { models, loading: loadingModels, fetchModels } = useVehicleModels(selectedMake)
  const { categories, loading: loadingCategories, fetchCategories } = useVehicleCategories(selectedMake, selectedModel)
  const { years, loading: loadingYears, fetchYears } = useVehicleYears(selectedMake, selectedModel, selectedCategory)

  // Fetch initial data
  useEffect(() => {
    const initializeData = async () => {
      await fetchPolicyTypes();
      await fetchMakes();
    };
    initializeData();
  }, [fetchPolicyTypes, fetchMakes]);

  // Fetch products when policy type is selected
  useEffect(() => {
    if (selectedPolicyTypeId) {
      fetchProducts();
    } else {
      setSelectedProductId("");
    }
  }, [selectedPolicyTypeId, fetchProducts]);

  // Fetch vehicle models when make is selected
  useEffect(() => {
    if (selectedMake) {
      fetchModels();
    }
  }, [selectedMake, fetchModels]);

  // Fetch years when model is selected
  useEffect(() => {
    if (selectedMake && selectedModel) {
      fetchCategories();
    }
  }, [selectedMake, selectedModel, fetchCategories]);

  useEffect(() => {
    if (selectedMake && selectedModel && selectedCategory) {
      fetchYears();
    }
  }, [selectedMake, selectedModel, selectedCategory, fetchYears]);

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].id || categories[0].name || "");
    }
  }, [categories, selectedCategory]);

  const currentStep = steps[currentStepIndex]

  // Progress bar
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100

  // Step validation
  const validateStep = useCallback((stepIndex: number) => {
    switch(steps[stepIndex].id) {
      case 'policy':
        if (!selectedPolicyTypeId) {
          setError("Please select a policy type");
          return false;
        }
        if (!selectedProductId) {
          setError("Please select a product");
          return false;
        }
        if (!selectedMake) {
          setError("Please select a vehicle make");
          return false;
        }
        if (!selectedModel) {
          setError("Please select a vehicle model");
          return false;
        }
        if (!selectedCategory) {
          setError("Please select a vehicle category");
          return false;
        }
        if (!selectedYear) {
          setError("Please select a vehicle year");
          return false;
        }
        return true;
        
      case 'details':
        if (!vehicleDetails.value || Number(vehicleDetails.value) < 10000) {
          setError("Please enter a valid vehicle value (minimum 10,000 ETB)");
          return false;
        }
        return true;
        
      case 'contact':
        if (!policyHolder.username.trim()) {
          setError("Please enter your full name");
          return false;
        }
        if (!policyHolder.phone.trim() || policyHolder.phone.length < 9) {
          setError("Please enter a valid phone number");
          return false;
        }
        // Basic email validation
        if (policyHolder.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(policyHolder.email)) {
            setError("Please enter a valid email address");
            return false;
          }
        }
        return true;
        
      default:
        return true;
    }
  }, [
    selectedPolicyTypeId, 
    selectedProductId, 
    selectedMake, 
    selectedModel,
    selectedCategory,
    selectedYear,
    vehicleDetails,
    policyHolder
  ]);

  const goNext = () => {
    if (!validateStep(currentStepIndex)) {
      return;
    }
    
    setCompletedSteps((prev) => (prev.includes(currentStepIndex) ? prev : [...prev, currentStepIndex]));
    setCurrentStepIndex((i) => Math.min(i + 1, steps.length - 1));
    setError("");
  };

  const goBack = () => {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
    setError("");
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStepIndex || completedSteps.includes(stepIndex)) {
      setCurrentStepIndex(stepIndex);
      setError("");
    }
  };

  const handlePolicyHolderChange = useCallback((field: string | object, value?: any) => {
    if (typeof field === "object") {
      setPolicyHolder((prev) => ({ ...prev, ...(field as any) }));
    } else {
      setPolicyHolder((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleVehicleDetailsChange = useCallback((field: string | object, value?: any) => {
    if (typeof field === "object") {
      setVehicleDetails((prev) => ({ ...prev, ...(field as any) }));
    } else {
      setVehicleDetails((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Final validation
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setIsSubmitting(false);
      return;
    }

    // Find vehicle asset type
    let vehicleAssetTypeId = "";
    try {
      const token = localStorage.getItem(IN_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/asset/types/product/${selectedProductId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (res.ok) {
        const assetTypes = await res.json();
        const vehicleAssetType = assetTypes.find((asset: any) => 
          asset.name?.toUpperCase() === "MOTOR" || 
          asset.name?.toLowerCase().includes("vehicle") ||
          asset.name?.toLowerCase().includes("auto")
        );
        vehicleAssetTypeId = vehicleAssetType?.id || assetTypes[0]?.id;
      }
    } catch (error) {
      console.error("Error fetching asset types:", error);
    }

    // Build the request body - SAME as PolicyAdder
    const baseBody: any = {
      description: policyDetails.description,
      policyTypeId: selectedPolicyTypeId,
      assets: [
        {
          assetType: vehicleAssetTypeId || "motor", // fallback
          asset: {
            name: `${selectedMake} ${selectedModel}`.trim(),
            value: Number(vehicleDetails.value),
            vin: vehicleDetails.vin || "",
            make: selectedMake,
            model: selectedModel,
            year: Number(selectedYear),
            category: selectedCategory || ""
          },
          selectedProducts: [selectedProductId],
          selectedCoverageOptions: [], // Empty for quick policy
        },
      ],
      policyDetails: {
        policyEffectiveDate: policyDetails.policyEffectiveDate,
        policyDuration: policyDetails.policyDuration,
      },
      policyHolder: {
        username: policyHolder.username,
        phone: policyHolder.phone,
        email: policyHolder.email || `${policyHolder.username.toLowerCase().replace(/\s+/g, '.')}@example.com`
      },
      source: 'home-quick-policy'
    };

    console.log('Submitting quick policy:', baseBody);

    try {
      const token = localStorage.getItem(IN_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/policies/n/i`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(baseBody),
      });

      if (res.ok) {
        const result = await res.json();
        setSuccess(`Policy created successfully! Your policy ID is ${result.policyId || 'pending'}. Redirecting...`);
        setCompletedSteps((prev) => [...prev, 3]);
        
        // Redirect to policy page after 2 seconds
        setTimeout(() => {
          if (result.policyId) {
            navigate(`/policy/${result.policyId}`);
          } else {
            navigate('/policy/new');
          }
        }, 2000);
      } else {
        const errorText = await res.text();
        console.error('❌ Policy creation error:', errorText);
        setError(`Unable to create policy: ${errorText}`);
      }
    } catch (err: any) {
      console.error('❌ Network error:', err);
      setError(`Unable to create policy: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimated premium calculation - FIXED: Now properly using useMemo
  const estimatedPremium = useMemo(() => {
    let base = 0;
    // Base price based on policy type
    const policyType = policyTypes.find(pt => pt.id === selectedPolicyTypeId);
    if (policyType?.name?.includes("Auto") || policyType?.name?.includes("Car")) {
      base = 1200;
    } else if (policyType?.name?.includes("Home")) {
      base = 800;
    } else {
      base = 1000; // Default
    }

    // Adjust based on vehicle value
    const numericValue = parseFloat(vehicleDetails.value || '0');
    if (numericValue > 0) {
      const factor = Math.min(numericValue / 500_000, 2);
      base *= 0.7 + factor * 0.3;
    }

    return Math.round(base);
  }, [selectedPolicyTypeId, vehicleDetails.value, policyTypes]);

  return (
    <div className="card sticky top-6">
      <div className="card-body space-y-5">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-700 mb-1">Quick policy ·</p>
          <h2 className="text-lg font-semibold">Create auto policy in minutes</h2>
          <p className="text-xs text-slate-500 mt-1">
            Fast track for car insurance. Basic coverage, instant submission.
          </p>
        </div>

        {/* Stepper */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex
              return (
                <div key={step.id} className="flex-1 flex flex-col items-center">
                  <div
                    className={[
                      'h-6 w-6 rounded-full text-xs flex items-center justify-center border cursor-pointer',
                      isActive
                        ? 'bg-brand text-white border-brand'
                        : isCompleted
                        ? 'bg-brand/10 text-brand-700 border-brand/30'
                        : 'bg-slate-100 text-slate-500 border-slate-200',
                    ].join(' ')}
                    onClick={() => goToStep(index)}
                  >
                    {index + 1}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {currentStep.label} · {currentStep.sub}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
            {success}
          </div>
        )}

        {/* Step content */}
        <div className="space-y-4">
          {/* STEP 1: Policy & Vehicle */}
          {currentStep.id === 'policy' && (
            <div className="space-y-3">
              {/* Policy Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Policy Type</label>
                {loadingPolicyTypes ? (
                  <div className="text-center py-4">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] text-slate-500 mt-2">Loading policy types...</p>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    value={selectedPolicyTypeId}
                    onChange={(e) => setSelectedPolicyTypeId(e.target.value)}
                  >
                    <option value="">Select policy type</option>
                    {policyTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name || `Policy Type ${type.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product */}
              {selectedPolicyTypeId && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
                  {loadingProducts ? (
                    <div className="text-center py-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name || `Product ${product.id}`}
                        </option>
                    ))}
                    </select>
                  )}
                </div>
              )}

              {/* Vehicle Make */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Make</label>
                {loadingMakes ? (
                  <div className="text-center py-2">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                  >
                    <option value="">Select make</option>
                    {makes.map((make) => (
                      <option key={make.id} value={make.id}>
                        {make.name || `Make ${make.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Vehicle Model */}
              {selectedMake && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Model</label>
                  {loadingModels ? (
                    <div className="text-center py-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="">Select model</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name || `Model ${model.id}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Vehicle Year */}
              {selectedMake && selectedModel && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Category</label>
                  {loadingCategories ? (
                    <div className="text-center py-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id || cat.name}>
                          {cat.name || cat.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Vehicle Year */}
              {selectedMake && selectedModel && selectedCategory && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Year</label>
                  {loadingYears ? (
                    <div className="text-center py-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-brand rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="">Select year</option>
                      {years.map((year) => (
                        <option key={year.id} value={year.name || year.id}>
                          {year.name || year.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Details */}
          {currentStep.id === 'details' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Value (ETB)</label>
                <input
                  type="number"
                  min="10000"
                  step="1000"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="e.g. 1,200,000"
                  value={vehicleDetails.value}
                  onChange={(e) => handleVehicleDetailsChange('value', e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">Approximate market value of your vehicle</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">VIN (Optional)</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="Vehicle Identification Number"
                  value={vehicleDetails.vin}
                  onChange={(e) => handleVehicleDetailsChange('vin', e.target.value)}
                />
              </div>

              <div className="p-2 rounded-md bg-slate-50 border border-dashed border-slate-200">
                <p className="text-[11px] text-slate-500">
                  Estimated premium:{' '}
                  <span className="font-semibold text-brand-700">~ {estimatedPremium.toLocaleString()} ETB / month</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Based on your selections. Final premium may vary.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Contact */}
          {currentStep.id === 'contact' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="e.g. Mekdes Abebe"
                  value={policyHolder.username}
                  onChange={(e) => handlePolicyHolderChange('username', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="e.g. 0912345678"
                  value={policyHolder.phone}
                  onChange={(e) => handlePolicyHolderChange('phone', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="For policy documents"
                  value={policyHolder.email}
                  onChange={(e) => handlePolicyHolderChange('email', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep.id === 'review' && (
            <div className="space-y-3 text-xs">
              <div className="p-2 rounded-md bg-slate-50 border border-slate-200">
                <h3 className="font-semibold mb-1 text-slate-800">Policy Summary</h3>
                <p className="text-slate-600">
                  <span className="font-medium">Policy Type:</span>{' '}
                  {policyTypes.find(pt => pt.id === selectedPolicyTypeId)?.name || 'Auto Insurance'}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Vehicle:</span>{' '}
                  {selectedMake} {selectedModel} {selectedCategory ? `(${selectedCategory})` : ""} {selectedYear ? `(${selectedYear})` : ""}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Vehicle Value:</span>{' '}
                  {Number(vehicleDetails.value).toLocaleString()} ETB
                </p>
                <p className="text-slate-600 mt-1">
                  <span className="font-medium">Estimated Premium:</span> ~ {estimatedPremium.toLocaleString()} ETB / month
                </p>
              </div>

              <div className="p-2 rounded-md bg-slate-50 border border-slate-200">
                <h3 className="font-semibold mb-1 text-slate-800">Contact Details</h3>
                <p className="text-slate-600">{policyHolder.username}</p>
                <p className="text-slate-600">{policyHolder.phone}</p>
                {policyHolder.email && <p className="text-slate-600">{policyHolder.email}</p>}
              </div>

              <p className="text-[11px] text-slate-500">
                By submitting, you agree to create a basic auto insurance policy. An advisor will contact you for additional details if needed.
              </p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {currentStep.id !== 'policy' && (
            <Button
              type="button"
              variant="ghost"
              className="text-xs px-3 py-1.5"
              onClick={goBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}

          {currentStep.id !== 'review' ? (
            <Button
              type="button"
              className="text-xs px-4 py-1.5 ml-auto"
              onClick={goNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="text-xs px-4 py-1.5 ml-auto"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Policy'}
            </Button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          This creates a real policy. For more options, use the{' '}
          <Link to="/policy/new" className="text-brand-600 hover:text-brand-800">
            full policy creator
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
