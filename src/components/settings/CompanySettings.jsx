import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";

export default function CompanySettings() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const profiles = await CompanyProfile.list();
        if (profiles.length > 0) {
          setProfile(profiles[0]);
          setFormData(profiles[0]);
        }
      } catch (error) {
        console.error("Error fetching company profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanyProfile();
  }, []);
  
  const handleChange = (e) => {
    const fieldMap = {
      'company-name': 'company_name',
      'company-address': 'address',
      'company-phone': 'phone',
      'company-email': 'email'
    };
    const field = fieldMap[e.target.id] || e.target.id;
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (profile) {
        await CompanyProfile.update(profile.id, formData);
      } else {
        const newProfile = await CompanyProfile.create(formData);
        setProfile(newProfile);
      }
      toast.success("Company profile updated!");
    } catch (error) {
      console.error("Error saving company profile:", error);
      toast.error("Failed to save company profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
        <CardDescription>Manage your company's information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input id="company-name" value={formData.company_name} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-address">Address</Label>
          <Input id="company-address" value={formData.address} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-phone">Phone</Label>
          <Input id="company-phone" value={formData.phone} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-email">Email</Label>
          <Input id="company-email" type="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}