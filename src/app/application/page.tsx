"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  User,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  FileText,
} from "lucide-react";

type BusinessCategory =
  | "restaurant"
  | "hotel"
  | "mall"
  | "attraction"
  | "fitness"
  | "school";

interface FormData {
  // Business Info
  businessName: string;
  category: BusinessCategory | "";
  website: string;
  googleMapsUrl: string;

  // Location
  address: string;
  area: string;
  governorate: string;

  // Contact
  phone: string;
  email: string;
  instagram: string;

  // Submitter Info
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  relationship: string;

  // Additional
  description: string;
  whyBest: string;
}

const initialFormData: FormData = {
  businessName: "",
  category: "",
  website: "",
  googleMapsUrl: "",
  address: "",
  area: "",
  governorate: "",
  phone: "",
  email: "",
  instagram: "",
  submitterName: "",
  submitterEmail: "",
  submitterPhone: "",
  relationship: "",
  description: "",
  whyBest: "",
};

const categories: { value: BusinessCategory; label: string; icon: string }[] = [
  { value: "restaurant", label: "Restaurant / Cafe", icon: "ðŸ½ï¸" },
  { value: "hotel", label: "Hotel / Resort", icon: "ðŸ¨" },
  { value: "mall", label: "Mall / Shopping Center", icon: "ðŸ›ï¸" },
  { value: "attraction", label: "Attraction / Entertainment", icon: "ðŸŽ¡" },
  { value: "fitness", label: "Gym / Fitness Center", icon: "ðŸ’ª" },
  { value: "school", label: "School / University", icon: "ðŸŽ“" },
];

const governorates = [
  "Al Ahmadi",
  "Al Asimah (Goa City)",
  "Al Farwaniyah",
  "Al Jahra",
  "Hawalli",
  "Mubarak Al-Kabeer",
];

const relationships = [
  "I am the owner",
  "I am an employee",
  "I am a customer/visitor",
  "I am a friend/family of the owner",
  "Other",
];

export default function ApplicationPage() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill submitter info for logged-in users
  useEffect(() => {
    if (user && profile) {
      setFormData((prev) => ({
        ...prev,
        submitterName: profile.preferred_name || profile.full_name || prev.submitterName,
        submitterEmail: profile.email || user.email || prev.submitterEmail,
      }));
    }
  }, [user, profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit application");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <main className="container mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto text-center">
              <CardHeader className="pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">
                  Application Submitted!
                </CardTitle>
                <CardDescription className="text-base">
                  Thank you for submitting{" "}
                  <span className="font-semibold">{formData.businessName}</span>{" "}
                  to Best of Goa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-600 dark:text-slate-300">
                  Our team will review your submission and get back to you
                  within 3-5 business days. We&apos;ll contact you at{" "}
                  <span className="font-semibold">{formData.submitterEmail}</span>{" "}
                  with updates.
                </p>
                {user && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      You can track the status of your submissions anytime on your{" "}
                      <Link href="/submissions" className="font-semibold underline">
                        submissions page
                      </Link>
                      .
                    </AlertDescription>
                  </Alert>
                )}
                <Separator />
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {user ? (
                    <Button asChild>
                      <Link href="/submissions">View My Submissions</Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/">Return to Homepage</Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData(initialFormData);
                    }}
                  >
                    Submit Another Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <main className="container mx-auto px-4 py-8">
          {/* Back Link */}
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Building2 className="w-3 h-3 mr-1" />
              Business Application
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Submit Your Business to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Best of Goa
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Know a great place in Goa? Help us showcase the best
              restaurants, hotels, malls, attractions, gyms, and schools in the
              country.
            </p>
            {user && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/submissions">
                    <FileText className="w-4 h-4 mr-2" />
                    View My Submissions
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Form */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Please fill out as much information as you can. Fields marked
                with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Business Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Details
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        placeholder="e.g., The Avenues Mall"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleSelectChange("category", value)
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="website"
                          name="website"
                          type="text"
                          placeholder="https://example.com"
                          className="pl-10"
                          value={formData.website}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleMapsUrl">Google Maps Link</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="googleMapsUrl"
                          name="googleMapsUrl"
                          type="text"
                          placeholder="https://maps.google.com/..."
                          className="pl-10"
                          value={formData.googleMapsUrl}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Street address, building name, etc."
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="area">Area / District</Label>
                      <Input
                        id="area"
                        name="area"
                        placeholder="e.g., Salmiya, Al Rai"
                        value={formData.area}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="governorate">Governorate *</Label>
                      <Select
                        value={formData.governorate}
                        onValueChange={(value) =>
                          handleSelectChange("governorate", value)
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select governorate" />
                        </SelectTrigger>
                        <SelectContent>
                          {governorates.map((gov) => (
                            <SelectItem key={gov} value={gov}>
                              {gov}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Business Contact (Optional)
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+965 XXXX XXXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contact@business.com"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        placeholder="@username"
                        value={formData.instagram}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Submitter Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Information
                  </h3>
                  <p className="text-sm text-slate-500">
                    We&apos;ll use this to contact you about your submission.
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="submitterName">Your Name *</Label>
                      <Input
                        id="submitterName"
                        name="submitterName"
                        placeholder="Your full name"
                        value={formData.submitterName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationship">
                        Your Relationship to Business *
                      </Label>
                      <Select
                        value={formData.relationship}
                        onValueChange={(value) =>
                          handleSelectChange("relationship", value)
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationships.map((rel) => (
                            <SelectItem key={rel} value={rel}>
                              {rel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="submitterEmail">Your Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="submitterEmail"
                          name="submitterEmail"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          value={formData.submitterEmail}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submitterPhone">Your Phone</Label>
                      <Input
                        id="submitterPhone"
                        name="submitterPhone"
                        type="tel"
                        placeholder="+965 XXXX XXXX"
                        value={formData.submitterPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Details</h3>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Tell us about this business - what do they offer, what makes them special?"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whyBest">
                      Why should this be on Best of Goa?
                    </Label>
                    <Textarea
                      id="whyBest"
                      name="whyBest"
                      placeholder="What makes this place stand out? Why do you recommend it?"
                      rows={3}
                      value={formData.whyBest}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="max-w-3xl mx-auto mt-8 text-center text-sm text-slate-500">
            <p>
              By submitting this form, you confirm that the information provided
              is accurate to the best of your knowledge. We review all
              submissions and may contact you for additional details.
            </p>
          </div>
        </main>
      </div>
  );
}
