// src/pages/claims/ClaimStart.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { cn } from "../../lib/cn";
import { ShieldCheck, Calendar, MapPin, FileText, AlertCircle, CheckCircle, DollarSign, Clock, Hash } from "lucide-react";

const API_BASE = "/api";
const IN_TOKEN_KEY = "in-token";

// Types
type PolicyType = { 
  id: string; 
  name?: string;
  description?: string;
};

type PolicyLite = {
  id: string;
  policyType?: { id?: string; name?: string; description?: string };
  policyDetails?: { policyNumber?: string; startDate?: string; endDate?: string };
  policyNumber?: string;
  number?: string;
  policy_no?: string;
  status?: string;
  coverageAmount?: number;
  premiumAmount?: number;
  [key: string]: any;
};

type ClaimTypeValue =
  | "ACCIDENT"
  | "COLLISION"
  | "THEFT"
  | "FIRE"
  | "FLOOD"
  | "BURGLARY"
  | "DAMAGE"
  | "OTHER";

// Constants
const CLAIM_TYPES: { value: ClaimTypeValue; label: string; icon: string; color: string }[] = [
  { value: "ACCIDENT", label: "Accident", icon: "🚗", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "COLLISION", label: "Collision", icon: "💥", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "THEFT", label: "Theft", icon: "👮", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "FIRE", label: "Fire", icon: "🔥", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "FLOOD", label: "Flood / Water", icon: "💧", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "BURGLARY", label: "Burglary", icon: "🏠", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "DAMAGE", label: "Damage", icon: "🔨", color: "bg-slate-50 text-slate-700 border-slate-200" },
  { value: "OTHER", label: "Other", icon: "📝", color: "bg-gray-50 text-gray-700 border-gray-200" },
];

// API utilities (unchanged)
async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text().catch(() => "");
  let json: any = null;
  
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  
  if (!res.ok) {
    const error = new Error(
      json?.error || json?.message || text || `Request failed (${res.status})`
    );
    (error as any).status = res.status;
    throw error;
  }
  
  return json;
}

async function fetchJsonWithFallback(
  primaryUrl: string,
  fallbackUrl: string,
  init?: RequestInit
) {
  try {
    return await fetchJson(primaryUrl, init);
  } catch (error: any) {
    const status = error?.status;
    if (status === 404 || (status >= 500 && String(error?.message || "").toLowerCase().includes("no static resource"))) {
      return await fetchJson(fallbackUrl, init);
    }
    throw error;
  }
}

function extractArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data;
  
  const candidates = [data?.data, data?.content, data?.items, data?.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  
  return [];
}

// Helper functions (unchanged)
function formatCurrency(amount?: number): string {
  if (!amount) return "—";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPolicyNumber(policy: PolicyLite): string {
  return (
    policy?.policyDetails?.policyNumber ??
    policy?.policyNumber ??
    policy?.number ??
    policy?.policy_no ??
    policy?.id?.slice(-8)
  );
}

function getPolicyTypeName(policy: PolicyLite): string {
  return policy?.policyType?.name ?? policy?.policyTypeName ?? policy?.type ?? "General Insurance";
}

function getRequestHeaders(token: string | null): HeadersInit | undefined {
  if (!token) return undefined;
  
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Form field types
interface ClaimFormData {
  policyId: string;
  policyTypeId: string;
  claimType: ClaimTypeValue;
  claimDate: string;
  claimAmount: string;
  policyNumber: string;
  incidentLocation: string;
  incidentDate: string;
  incidentTime: string;
  extraRef: string;
  details: string;
}

// Component
export default function ClaimStart() {
  const navigate = useNavigate();
  const token = localStorage.getItem(IN_TOKEN_KEY);
  
  // State
  const [policies, setPolicies] = useState<PolicyLite[]>([]);
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [loading, setLoading] = useState({
    policies: false,
    types: false,
    submitting: false
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>("");
  const [successData, setSuccessData] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState<ClaimFormData>({
    policyId: "",
    policyTypeId: "",
    claimType: "ACCIDENT",
    claimDate: new Date().toISOString().split('T')[0],
    claimAmount: "",
    policyNumber: "",
    incidentLocation: "",
    incidentDate: "",
    incidentTime: "",
    extraRef: "",
    details: "",
  });
  
  // Update form field
  const updateFormField = <K extends keyof ClaimFormData>(
    field: K,
    value: ClaimFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setError("");
      setSubmitted(false);
      
      if (!token) {
        setError("You must be logged in to submit a claim.");
        navigate('/login');
        return;
      }
      
      const headers = getRequestHeaders(token);
      const init: RequestInit | null = headers ? { headers } : null;
      
      if (!init) return;
      
      // Load policies
      setLoading(prev => ({ ...prev, policies: true }));
      try {
        const data = await fetchJson(`${API_BASE}/customer/policies`, init);
        const policyList = extractArray<PolicyLite>(data);
        setPolicies(policyList);
        
        if (policyList.length > 0) {
          const firstPolicy = policyList[0];
          updateFormField("policyId", firstPolicy.id);
          updateFormField("policyNumber", getPolicyNumber(firstPolicy));
          
          const policyTypeId = firstPolicy?.policyType?.id;
          if (policyTypeId) {
            updateFormField("policyTypeId", policyTypeId);
          }
        }
      } catch (error) {
        console.warn("Failed to load policies:", error);
        setPolicies([]);
      } finally {
        setLoading(prev => ({ ...prev, policies: false }));
      }
      
      // Load policy types
      setLoading(prev => ({ ...prev, types: true }));
      try {
        const data = await fetchJsonWithFallback(
          `${API_BASE}/customer/policyTypes`,
          `${API_BASE}/p/types`,
          init
        );
        
        const typeList = extractArray<PolicyType>(data);
        setPolicyTypes(typeList);
        
        if (typeList.length > 0 && !formData.policyTypeId) {
          updateFormField("policyTypeId", typeList[0].id);
        }
      } catch (error: any) {
        setPolicyTypes([]);
        if (policies.length === 0) {
          setError(error?.message || "Failed to load policy types.");
        }
      } finally {
        setLoading(prev => ({ ...prev, types: false }));
      }
    };
    
    loadInitialData();
  }, [token, navigate]);
  
  // Sync policyTypeId when policy changes
  useEffect(() => {
    if (!formData.policyId || policies.length === 0) return;
    
    const selectedPolicy = policies.find(policy => String(policy.id) === String(formData.policyId));
    if (!selectedPolicy) return;
    
    const policyTypeId = selectedPolicy?.policyType?.id;
    if (policyTypeId) {
      updateFormField("policyTypeId", policyTypeId);
    }
    
    const policyNumber = getPolicyNumber(selectedPolicy);
    if (policyNumber) {
      updateFormField("policyNumber", policyNumber);
    }
  }, [formData.policyId, policies]);
  
  // Build description from form data
  const descriptionPayload = useMemo(() => {
    const lines: string[] = [];
    
    if (formData.policyNumber.trim()) {
      lines.push(`Policy number: ${formData.policyNumber.trim()}`);
    }
    
    if (formData.incidentLocation.trim()) {
      lines.push(`Location: ${formData.incidentLocation.trim()}`);
    }
    
    if (formData.incidentDate) {
      lines.push(`Incident date: ${formData.incidentDate}`);
    }
    
    if (formData.incidentTime) {
      lines.push(`Incident time: ${formData.incidentTime}`);
    }
    
    if (formData.extraRef.trim()) {
      lines.push(`Reference: ${formData.extraRef.trim()}`);
    }
    
    if (lines.length > 0) {
      lines.push(""); // Separator
    }
    
    if (formData.details.trim()) {
      lines.push(formData.details.trim());
    }
    
    return lines.join("\n");
  }, [
    formData.policyNumber,
    formData.incidentLocation,
    formData.incidentDate,
    formData.incidentTime,
    formData.extraRef,
    formData.details,
  ]);
  
  // Get selected policy
  const selectedPolicy = useMemo(() => {
    return policies.find(p => String(p.id) === String(formData.policyId));
  }, [formData.policyId, policies]);
  
  // Get selected claim type
  const selectedClaimType = useMemo(() => {
    return CLAIM_TYPES.find(t => t.value === formData.claimType);
  }, [formData.claimType]);
  
  // Validate form
  const validateForm = (): string | null => {
    if (!token) {
      return "You must be logged in to submit a claim.";
    }
    
    if (!formData.claimDate) {
      return "Please select the claim date.";
    }
    
    if (!formData.policyId && !formData.policyTypeId) {
      return "Please select a policy or at least a policy type.";
    }
    
    if (formData.claimAmount.trim() !== "") {
      const amount = Number(formData.claimAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return "Claim amount must be a valid positive number.";
      }
    }
    
    if (!formData.details.trim()) {
      return "Please provide a detailed description of the incident.";
    }
    
    return null;
  };
  
  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    setError("");
    setLoading(prev => ({ ...prev, submitting: true }));
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(prev => ({ ...prev, submitting: false }));
      return;
    }
    
    try {
      const headers = getRequestHeaders(token);
      if (!headers) {
        throw new Error("Authentication required");
      }
      
      const amount = formData.claimAmount.trim() === "" 
        ? null 
        : Number(formData.claimAmount);
      
      const requestBody: any = {
        claimType: formData.claimType,
        claimDate: formData.claimDate,
        description: descriptionPayload || "—",
        claimAmount: amount,
      };
      
      // Use policyId if available, otherwise fallback to policyTypeId
      if (formData.policyId) {
        requestBody.policyId = formData.policyId;
      } else {
        requestBody.policyTypeId = formData.policyTypeId;
      }
      
      const response = await fetchJson(`${API_BASE}/claims`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });
      
      setSuccessData(response);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      setError(error?.message || "Failed to submit claim. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };
  
  // Success Screen
  const renderSuccessScreen = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Claim Submitted Successfully!</h1>
        <p className="text-slate-600">Your claim has been received and is being processed.</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="border border-emerald-200 rounded-lg p-5 bg-emerald-50">
          <div className="text-sm text-emerald-700 font-medium mb-2">Claim Reference</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {successData?.claimNumber || successData?.id?.slice(-8) || "N/A"}
          </div>
        </div>
        
        <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
          <div className="text-sm text-blue-700 font-medium mb-2">Submitted On</div>
          <div className="text-lg font-semibold text-slate-900">
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <div className="text-sm text-slate-700 font-medium mb-2">Status</div>
          <Badge variant="success" className="animate-pulse">
            UNDER REVIEW
          </Badge>
          <div className="text-xs text-slate-500 mt-2">1-3 business days</div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setFormData({
              policyId: "",
              policyTypeId: "",
              claimType: "ACCIDENT",
              claimDate: new Date().toISOString().split('T')[0],
              claimAmount: "",
              policyNumber: "",
              incidentLocation: "",
              incidentDate: "",
              incidentTime: "",
              extraRef: "",
              details: "",
            });
          }}
          className="flex-1"
        >
          Submit Another Claim
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate('/claims')}
          className="flex-1"
        >
          View All Claims
        </Button>
      </div>
      
      <div className="text-center text-sm text-slate-500 mt-6">
        <p>You will receive an email confirmation shortly.</p>
      </div>
    </div>
  );
  
  // Main render - Single page form
  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="container mx-auto px-4 max-w-7xl">
        {!submitted ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Submit a New Claim
                  </h1>
                  <p className="text-slate-600 text-sm">
                    Complete the form below to report your insurance claim
                  </p>
                </div>
              </div>
            </div>
            
            {/* Error Alert */}
            {error && (
              <Alert type="error" className="mb-4">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Policy Selection - First Section */}
              <Card>
                <CardBody className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900">Select Policy</h3>
                    <p className="text-sm text-slate-600 mt-1">Choose from your active policies</p>
                  </div>
                  
                  {policies.length > 0 ? (
                    <div className="space-y-2">
                      {policies.map(policy => (
                        <div
                          key={policy.id}
                          onClick={() => {
                            updateFormField("policyId", policy.id);
                            const policyTypeId = policy?.policyType?.id;
                            if (policyTypeId) {
                              updateFormField("policyTypeId", policyTypeId);
                            }
                          }}
                          className={cn(
                            "cursor-pointer rounded-lg border p-3 transition-all",
                            formData.policyId === policy.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-slate-900 text-sm">
                                {getPolicyNumber(policy)}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {getPolicyTypeName(policy)}
                              </div>
                            </div>
                            <Badge 
                              size="sm"
                              variant={policy.status === 'ACTIVE' ? "success" : "default"}
                            >
                              {policy.status || 'ACTIVE'}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>Coverage: {formatCurrency(policy.coverageAmount)}</span>
                            <span>Premium: {formatCurrency(policy.premiumAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg p-4 text-center bg-slate-50">
                      <ShieldCheck className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 text-sm">No active policies found</p>
                    </div>
                  )}
                  
                  {/* Insurance Type Fallback */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Insurance Type
                      {!formData.policyId && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <Select
                      value={formData.policyTypeId}
                      onChange={(e) => updateFormField("policyTypeId", e.target.value)}
                      disabled={loading.types}
                      required={!formData.policyId}
                      className="w-full"
                    >
                      {policyTypes.length === 0 ? (
                        <option value="">{loading.types ? "Loading..." : "Select type"}</option>
                      ) : (
                        <>
                          <option value="">Select insurance type</option>
                          {policyTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.name || type.id}
                            </option>
                          ))}
                        </>
                      )}
                    </Select>
                  </div>
                </CardBody>
              </Card>
              
              {/* Claim Type - Moved after policy choice */}
              <Card>
                <CardBody className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900">What type of claim are you filing?</h3>
                    <p className="text-sm text-slate-600 mt-1">Select the category that best matches your incident</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CLAIM_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFormField("claimType", type.value)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:shadow-sm",
                          formData.claimType === type.value
                            ? type.color + " border-current shadow-sm"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span className="text-lg mb-1">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
              
              {/* Main Form Grid - Everything in one view */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Left Column: Claim Details */}
                <div className="space-y-4">
                  {/* Claim Details */}
                  <Card>
                    <CardBody className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900">Claim Details</h3>
                        <p className="text-sm text-slate-600">Basic information about your claim</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Claim Date <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            <Input
                              type="date"
                              value={formData.claimDate}
                              onChange={(e) => updateFormField("claimDate", e.target.value)}
                              required
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Claim Amount (Optional)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              type="number"
                              value={formData.claimAmount}
                              onChange={(e) => updateFormField("claimAmount", e.target.value)}
                              placeholder="Enter amount"
                              min="0"
                              step="0.01"
                              className="w-full pl-10"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Policy Number
                          </label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              value={formData.policyNumber}
                              onChange={(e) => updateFormField("policyNumber", e.target.value)}
                              placeholder="Enter policy number"
                              className="w-full pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
                
                {/* Right Column: Incident Information */}
                <div className="space-y-4">
                  {/* Incident Information */}
                  <Card>
                    <CardBody className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900">Incident Information</h3>
                        <p className="text-sm text-slate-600">Details about when and where it happened</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Location
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              value={formData.incidentLocation}
                              onChange={(e) => updateFormField("incidentLocation", e.target.value)}
                              placeholder="Where did it happen?"
                              className="w-full pl-10"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Incident Date
                            </label>
                            <Input
                              type="date"
                              value={formData.incidentDate}
                              onChange={(e) => updateFormField("incidentDate", e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input
                                type="time"
                                value={formData.incidentTime}
                                onChange={(e) => updateFormField("incidentTime", e.target.value)}
                                className="w-full pl-10"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Reference Information
                          </label>
                          <Input
                            value={formData.extraRef}
                            onChange={(e) => updateFormField("extraRef", e.target.value)}
                            placeholder="Vehicle plate, case number, etc."
                            className="w-full"
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
              
              {/* Detailed Description - Full width */}
              <Card>
                <CardBody className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900">
                      Detailed Description <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-sm text-slate-600">
                      Please describe what happened in detail. This helps us process your claim faster.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      className={cn(
                        "w-full p-3 pl-10 text-sm min-h-[120px] rounded-lg border border-slate-300",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        "transition-colors duration-200"
                      )}
                      value={formData.details}
                      onChange={(e) => updateFormField("details", e.target.value)}
                      placeholder="Describe the incident in detail..."
                      required
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>This becomes the main claim description</span>
                    <span>{formData.details.length}/2000</span>
                  </div>
                </CardBody>
              </Card>
              
              {/* Quick Preview */}
              {descriptionPayload.length > 0 && (
                <Card>
                  <CardBody className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2 text-sm">Quick Preview</h3>
                    <div className="text-sm text-slate-600 bg-slate-50 rounded p-3 max-h-[100px] overflow-y-auto text-xs">
                      {descriptionPayload.length > 150 
                        ? descriptionPayload.substring(0, 150) + "..."
                        : descriptionPayload}
                    </div>
                  </CardBody>
                </Card>
              )}
              
              {/* Submit Section */}
              <Card>
                <CardBody className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Ready to Submit?</h3>
                      <p className="text-xs text-slate-600">
                        Review your information and submit your claim
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/claims')}
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading.submitting}
                        size="sm"
                      >
                        {loading.submitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit Claim
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </form>
          </>
        ) : (
          <Card className="border border-slate-200">
            <CardBody className="p-6">
              {renderSuccessScreen()}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}