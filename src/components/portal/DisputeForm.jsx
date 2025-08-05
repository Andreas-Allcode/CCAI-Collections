import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dispute } from '@/api/entities';
import { UploadFile } from '@/api/integrations';

export default function DisputeForm({ caseData }) {
  const [disputeType, setDisputeType] = useState('');
  const [description, setDescription] = useState('');
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const disputeTypes = [
    { value: 'not_mine', label: 'This debt is not mine' },
    { value: 'incorrect_amount', label: 'The amount is incorrect' },
    { value: 'already_paid', label: 'I already paid this debt' },
    { value: 'identity_theft', label: 'Identity theft' },
    { value: 'bankruptcy', label: 'Included in bankruptcy' },
    { value: 'other', label: 'Other reason' }
  ];

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return {
          name: file.name,
          url: file_url,
          size: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setSupportingFiles(prev => [...prev, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!disputeType || !description.trim()) {
      toast.error('Please select a dispute type and provide a description.');
      return;
    }

    setIsSubmitting(true);

    try {
      const disputeData = {
        case_id: caseData.id,
        dispute_type: disputeType,
        description: description.trim(),
        supporting_documents: supportingFiles.map(file => file.url),
        submitted_by_debtor: true
      };

      await Dispute.create(disputeData);

      toast.success('Dispute submitted successfully! We will review your request and respond within 5-10 business days.');
      
      // Reset form
      setDisputeType('');
      setDescription('');
      setSupportingFiles([]);

    } catch (error) {
      console.error('Error submitting dispute:', error);
      toast.error('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Submit a Dispute
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-800 font-semibold">Important Notice</p>
              <p className="text-amber-700">
                By submitting this dispute, we will cease all collection activities on this account until the dispute is resolved.
                Please provide as much detail and supporting documentation as possible.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="disputeType">Type of Dispute *</Label>
            <Select value={disputeType} onValueChange={setDisputeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select dispute reason" />
              </SelectTrigger>
              <SelectContent>
                {disputeTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide a detailed explanation of your dispute..."
              className="min-h-32"
              required
            />
            <p className="text-xs text-gray-600">
              Please include dates, amounts, and any other relevant information.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportingFiles">Supporting Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                Upload supporting documents (receipts, statements, etc.)
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => document.getElementById('file-upload').click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
            </div>

            {supportingFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files:</p>
                {supportingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-700" 
            size="lg"
            disabled={isSubmitting || !disputeType || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Dispute...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Submit Dispute
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}