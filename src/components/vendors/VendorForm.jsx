
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Vendor } from '@/api/entities';
import { CalendarIcon, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VendorForm({ vendor, onSave }) {
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    type: vendor?.type || 'other',
    contact_person: vendor?.contact_person || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    website: vendor?.website || '',
    status: vendor?.status || 'active',
    contract_start_date: vendor?.contract_start_date ? new Date(vendor.contract_start_date) : null,
    contract_end_date: vendor?.contract_end_date ? new Date(vendor.contract_end_date) : null,
    services: vendor?.services || '',
    notes: vendor?.notes || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (id, date) => {
    setFormData(prev => ({ ...prev, [id]: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        contract_start_date: formData.contract_start_date ? formData.contract_start_date.toISOString().split('T')[0] : null,
        contract_end_date: formData.contract_end_date ? formData.contract_end_date.toISOString().split('T')[0] : null
      };

      if (vendor) {
        await Vendor.update(vendor.id, dataToSave);
        toast.success('Vendor updated successfully!');
      } else {
        await Vendor.create(dataToSave);
        toast.success('Vendor created successfully!');
      }
      onSave();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error('Failed to save vendor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input id="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="law_firm">Law Firm</SelectItem>
                <SelectItem value="collection_agency">Collection Agency</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="debt_buyer">Debt Buyer</SelectItem>
                <SelectItem value="debt_seller">Debt Seller</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input id="contact_person" value={formData.contact_person} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={formData.website} onChange={handleChange} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={formData.address} onChange={handleChange} />
        </div>
      </div>

      {/* Contract Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Contract Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract_start_date">Contract Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.contract_start_date ? format(formData.contract_start_date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.contract_start_date}
                  onSelect={(date) => handleDateChange('contract_start_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contract_end_date">Contract End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.contract_end_date ? format(formData.contract_end_date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.contract_end_date}
                  onSelect={(date) => handleDateChange('contract_end_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Additional Information</h3>
        <div className="space-y-2">
          <Label htmlFor="services">Services Provided</Label>
          <Textarea id="services" value={formData.services} onChange={handleChange} rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={formData.notes} onChange={handleChange} rows={3} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {vendor ? 'Update Vendor' : 'Save Vendor'}
        </Button>
      </div>
    </form>
  );
}
