'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from "@/components/auth-context"
import Login from "@/components/login"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Building, 
  Bell, 
  Palette, 
  Shield, 
  Clock, 
  FileText,
  HardDrive,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

interface SettingsData {
  _id?: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: BusinessAddress;
  workingHours: WorkingHours;
  currency: string;
  taxRate: number;
  serviceSettings: {
    defaultServiceDuration: number;
    allowOnlineBooking: boolean;
    requireApproval: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

const defaultSettings: SettingsData = {
  businessName: 'Fix My Ride',
  businessPhone: '',
  businessEmail: '',
  businessAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  },
  workingHours: {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '15:00', isOpen: true },
    sunday: { open: '10:00', close: '14:00', isOpen: false }
  },
  currency: 'INR',
  taxRate: 18,
  serviceSettings: {
    defaultServiceDuration: 60,
    allowOnlineBooking: true,
    requireApproval: false
  }
};

function SettingsPageContent() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  const { toast } = useToast();
  const { user, login, isLoading: authLoading, error } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Check if there are any changes
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanges);
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ensure workingHours is properly initialized
        const settingsData = {
          ...defaultSettings,
          ...data.data,
          workingHours: data.data.workingHours || defaultSettings.workingHours
        };
        setSettings(settingsData);
        setOriginalSettings(settingsData);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
        setOriginalSettings(data.data);
        toast({
          title: "Success",
          description: "Settings saved successfully!"
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(originalSettings);
    toast({
      title: "Reset",
      description: "Settings have been reset to last saved values."
    });
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const pathArray = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i] as keyof typeof current] as any;
      }
      
      current[pathArray[pathArray.length - 1] as keyof typeof current] = value;
      return newSettings;
    });
  };

  // Show login page if user is not authenticated
  if (!user) {
    return <Login onLogin={login} isLoading={authLoading} error={error} />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeSection="settings" setActiveSection={() => {}} />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-8 mt-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Settings className="w-8 h-8" />
                  System Settings
                </h1>
                <p className="text-gray-600 mt-1">Manage your CRM system configuration</p>
              </div>
        
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  onClick={resetSettings}
                  disabled={!hasChanges || isSaving}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={saveSettings}
                  disabled={!hasChanges || isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Services
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={settings.businessName}
                    onChange={(e) => updateSettings('businessName', e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input
                    id="businessPhone"
                    value={settings.businessPhone}
                    onChange={(e) => updateSettings('businessPhone', e.target.value)}
                    placeholder="+91 12345 67890"
                  />
                </div>
                <div>
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => updateSettings('businessEmail', e.target.value)}
                    placeholder="contact@business.com"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Business Address</Label>
                <div className="mt-2 space-y-3">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={settings.businessAddress.street}
                      onChange={(e) => updateSettings('businessAddress.street', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={settings.businessAddress.city}
                        onChange={(e) => updateSettings('businessAddress.city', e.target.value)}
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={settings.businessAddress.state}
                        onChange={(e) => updateSettings('businessAddress.state', e.target.value)}
                        placeholder="Maharashtra"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={settings.businessAddress.zipCode}
                        onChange={(e) => updateSettings('businessAddress.zipCode', e.target.value)}
                        placeholder="400001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={settings.businessAddress.country}
                        onChange={(e) => updateSettings('businessAddress.country', e.target.value)}
                        placeholder="India"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Financial Settings</Label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings.currency} onValueChange={(value) => updateSettings('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => updateSettings('taxRate', parseFloat(e.target.value) || 0)}
                      placeholder="18"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {settings.workingHours && Object.entries(settings.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24">
                      <Label className="capitalize">{day}</Label>
                    </div>
                    <Switch
                      checked={hours?.isOpen || false}
                      onCheckedChange={(checked) => updateSettings(`workingHours.${day}.isOpen`, checked)}
                    />
                    {hours?.isOpen && (
                      <>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={hours.open || '09:00'}
                            onChange={(e) => updateSettings(`workingHours.${day}.open`, e.target.value)}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.close || '18:00'}
                            onChange={(e) => updateSettings(`workingHours.${day}.close`, e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                    {!hours?.isOpen && (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Settings */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Service & Appointment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultServiceDuration">Default Service Duration (minutes)</Label>
                <Input
                  id="defaultServiceDuration"
                  type="number"
                  value={settings.serviceSettings.defaultServiceDuration}
                  onChange={(e) => updateSettings('serviceSettings.defaultServiceDuration', parseInt(e.target.value) || 60)}
                  min="15"
                  max="480"
                  step="15"
                  className="w-64"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Online Booking</Label>
                    <p className="text-sm text-gray-600">Allow customers to book appointments online</p>
                  </div>
                  <Switch
                    checked={settings.serviceSettings.allowOnlineBooking}
                    onCheckedChange={(checked) => updateSettings('serviceSettings.allowOnlineBooking', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval</Label>
                    <p className="text-sm text-gray-600">Require admin approval for new appointments</p>
                  </div>
                  <Switch
                    checked={settings.serviceSettings.requireApproval}
                    onCheckedChange={(checked) => updateSettings('serviceSettings.requireApproval', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Save Changes Alert */}
      {hasChanges && (
        <Alert className="mt-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have unsaved changes. Don't forget to save your settings before leaving this page.
          </AlertDescription>
        </Alert>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthProvider>
      <SettingsPageContent />
    </AuthProvider>
  );
}

