import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DebtorPortalSession } from '@/api/entities';

export default function CommunicationPreferences({ session, onUpdate }) {
  const [preferences, setPreferences] = useState(
    session.communication_preferences || {
      email_notifications: true,
      sms_notifications: true,
      call_notifications: true,
      preferred_contact_time: 'afternoon',
      do_not_call: false
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedSession = await DebtorPortalSession.update(session.id, {
        communication_preferences: preferences
      });

      onUpdate(updatedSession);
      toast.success('Communication preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Communication Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive updates and reminders via email</p>
              </div>
              <Switch
                id="email_notifications"
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms_notifications">SMS Notifications</Label>
                <p className="text-sm text-gray-600">Receive text message updates</p>
              </div>
              <Switch
                id="sms_notifications"
                checked={preferences.sms_notifications}
                onCheckedChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="call_notifications">Phone Calls</Label>
                <p className="text-sm text-gray-600">Allow phone calls for account matters</p>
              </div>
              <Switch
                id="call_notifications"
                checked={preferences.call_notifications}
                onCheckedChange={(checked) => handlePreferenceChange('call_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="do_not_call">Do Not Call</Label>
                <p className="text-sm text-gray-600">Restrict all phone communications</p>
              </div>
              <Switch
                id="do_not_call"
                checked={preferences.do_not_call}
                onCheckedChange={(checked) => handlePreferenceChange('do_not_call', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_contact_time">Preferred Contact Time</Label>
            <Select
              value={preferences.preferred_contact_time}
              onValueChange={(value) => handlePreferenceChange('preferred_contact_time', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            size="lg"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Preferences...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}