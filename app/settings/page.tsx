'use client';

import { useState, useEffect } from 'react';
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

interface EmailNotifications {
  newCustomer: boolean;
  serviceCompleted: boolean;
  appointmentReminders: boolean;
  invoiceGenerated: boolean;
  paymentReceived: boolean;
  lowInventory: boolean;
  systemAlerts: boolean;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number;
}

interface SettingsData {
  _id?: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: BusinessAddress;
  businessWebsite: string;
  workingHours: WorkingHours;
  currency: string;
  taxRate: number;
  emailNotifications: EmailNotifications;
  serviceSettings: {
    defaultServiceDuration: number;
    allowOnlineBooking: boolean;
    requireApproval: boolean;
    maxAdvanceBooking: number;
  };
  theme: string;
  dateFormat: string;
  timeFormat: string;
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
  backupSettings: {
    enabled: boolean;
    frequency: string;
    retention: number;
  };
  invoiceSettings: {
    prefix: string;
    startingNumber: number;
    footerText: string;
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
  businessWebsite: '',
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
  emailNotifications: {
    newCustomer: true,
    serviceCompleted: true,
    appointmentReminders: true,
    invoiceGenerated: true,
    paymentReceived: true,
    lowInventory: true,
    systemAlerts: true
  },
  serviceSettings: {
    defaultServiceDuration: 60,
    allowOnlineBooking: true,
    requireApproval: false,
    maxAdvanceBooking: 30
  },
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  sessionTimeout: 30,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    maxAge: 90
  },
  backupSettings: {
    enabled: true,
    frequency: 'daily',
    retention: 30
  },
  invoiceSettings: {
    prefix: 'INV',
    startingNumber: 1000,
    footerText: 'Thank you for your business!'
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check if there are any changes
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanges);
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
        setOriginalSettings(data.data);
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Advanced
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
                <div>
                  <Label htmlFor="businessWebsite">Website</Label>
                  <Input
                    id="businessWebsite"
                    value={settings.businessWebsite}
                    onChange={(e) => updateSettings('businessWebsite', e.target.value)}
                    placeholder="https://example.com"
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
                {Object.entries(settings.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24">
                      <Label className="capitalize">{day}</Label>
                    </div>
                    <Switch
                      checked={hours.isOpen}
                      onCheckedChange={(checked) => updateSettings(`workingHours.${day}.isOpen`, checked)}
                    />
                    {hours.isOpen && (
                      <>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => updateSettings(`workingHours.${day}.open`, e.target.value)}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateSettings(`workingHours.${day}.close`, e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                    {!hours.isOpen && (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings.emailNotifications).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="capitalize cursor-pointer">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {getNotificationDescription(key)}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateSettings(`emailNotifications.${key}`, checked)}
                    />
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
              <div className="grid grid-cols-2 gap-4">
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
                  />
                </div>
                <div>
                  <Label htmlFor="maxAdvanceBooking">Max Advance Booking (days)</Label>
                  <Input
                    id="maxAdvanceBooking"
                    type="number"
                    value={settings.serviceSettings.maxAdvanceBooking}
                    onChange={(e) => updateSettings('serviceSettings.maxAdvanceBooking', parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                  />
                </div>
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

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => updateSettings('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSettings('sessionTimeout', parseInt(e.target.value) || 30)}
                    min="5"
                    max="480"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => updateSettings('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={settings.timeFormat} onValueChange={(value) => updateSettings('timeFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Password Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={settings.passwordPolicy.minLength}
                    onChange={(e) => updateSettings('passwordPolicy.minLength', parseInt(e.target.value) || 8)}
                    min="6"
                    max="32"
                  />
                </div>
                <div>
                  <Label htmlFor="maxAge">Password Expires After (days)</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    value={settings.passwordPolicy.maxAge}
                    onChange={(e) => updateSettings('passwordPolicy.maxAge', parseInt(e.target.value) || 90)}
                    min="30"
                    max="365"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { key: 'requireUppercase', label: 'Require Uppercase Letters' },
                  { key: 'requireLowercase', label: 'Require Lowercase Letters' },
                  { key: 'requireNumbers', label: 'Require Numbers' },
                  { key: 'requireSymbols', label: 'Require Symbols' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch
                      checked={settings.passwordPolicy[key as keyof typeof settings.passwordPolicy] as boolean}
                      onCheckedChange={(checked) => updateSettings(`passwordPolicy.${key}`, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Backup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Automatic Backups</Label>
                  <p className="text-sm text-gray-600">Automatically backup system data</p>
                </div>
                <Switch
                  checked={settings.backupSettings.enabled}
                  onCheckedChange={(checked) => updateSettings('backupSettings.enabled', checked)}
                />
              </div>
              
              {settings.backupSettings.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select 
                      value={settings.backupSettings.frequency} 
                      onValueChange={(value) => updateSettings('backupSettings.frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="backupRetention">Retention Period (days)</Label>
                    <Input
                      id="backupRetention"
                      type="number"
                      value={settings.backupSettings.retention}
                      onChange={(e) => updateSettings('backupSettings.retention', parseInt(e.target.value) || 30)}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.invoiceSettings.prefix}
                    onChange={(e) => updateSettings('invoiceSettings.prefix', e.target.value)}
                    placeholder="INV"
                  />
                </div>
                <div>
                  <Label htmlFor="startingNumber">Starting Number</Label>
                  <Input
                    id="startingNumber"
                    type="number"
                    value={settings.invoiceSettings.startingNumber}
                    onChange={(e) => updateSettings('invoiceSettings.startingNumber', parseInt(e.target.value) || 1000)}
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="footerText">Invoice Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={settings.invoiceSettings.footerText}
                  onChange={(e) => updateSettings('invoiceSettings.footerText', e.target.value)}
                  placeholder="Thank you for your business!"
                  rows={3}
                />
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
  );
}

function getNotificationDescription(key: string): string {
  const descriptions: { [key: string]: string } = {
    newCustomer: 'Notify when a new customer is registered',
    serviceCompleted: 'Notify when a service is marked as completed',
    appointmentReminders: 'Send appointment reminders to customers',
    invoiceGenerated: 'Notify when a new invoice is generated',
    paymentReceived: 'Notify when a payment is received',
    lowInventory: 'Notify when inventory items are running low',
    systemAlerts: 'Notify about system alerts and errors'
  };
  return descriptions[key] || 'Notification setting';
}
