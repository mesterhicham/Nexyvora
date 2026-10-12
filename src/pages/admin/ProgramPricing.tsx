import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProgramPricing, useUpsertProgramPricing, usePrograms } from '@/hooks/usePaymentFlow';
import { DollarSign, Save, GraduationCap, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = [
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

interface PriceEdit {
  [programId: string]: {
    price: string;
    currency: string;
    is_active: boolean;
    hasChanges: boolean;
  };
}

export default function ProgramPricing() {
  const { t } = useTranslation();
  const { data: pricing, isLoading: pricingLoading, refetch } = useProgramPricing();
  const { data: programs, isLoading: programsLoading } = usePrograms();
  const upsertPricing = useUpsertProgramPricing();
  
  const [priceEdits, setPriceEdits] = useState<PriceEdit>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const isLoading = pricingLoading || programsLoading;

  // Get price info for a program
  const getPricingInfo = (programId: string) => {
    const pricingRecord = pricing?.find(p => p.program_id === programId);
    return {
      price: pricingRecord?.price ?? 0,
      is_active: pricingRecord?.is_active ?? true,
      currency: pricingRecord?.currency ?? 'USD',
    };
  };

  // Get edit state or fall back to DB state
  const getEditState = (programId: string) => {
    if (priceEdits[programId]) {
      return priceEdits[programId];
    }
    const info = getPricingInfo(programId);
    return {
      price: info.price.toString(),
      currency: info.currency,
      is_active: info.is_active,
      hasChanges: false,
    };
  };

  const handlePriceChange = (programId: string, value: string) => {
    const info = getPricingInfo(programId);
    const currentEdit = getEditState(programId);
    setPriceEdits({
      ...priceEdits,
      [programId]: {
        ...currentEdit,
        price: value,
        hasChanges: value !== info.price.toString() || currentEdit.is_active !== info.is_active || currentEdit.currency !== info.currency,
      },
    });
  };

  const handleCurrencyChange = (programId: string, value: string) => {
    const info = getPricingInfo(programId);
    const currentEdit = getEditState(programId);
    setPriceEdits({
      ...priceEdits,
      [programId]: {
        ...currentEdit,
        currency: value,
        hasChanges: currentEdit.price !== info.price.toString() || currentEdit.is_active !== info.is_active || value !== info.currency,
      },
    });
  };

  const handleActiveToggle = (programId: string, value: boolean) => {
    const info = getPricingInfo(programId);
    const currentEdit = getEditState(programId);
    setPriceEdits({
      ...priceEdits,
      [programId]: {
        ...currentEdit,
        is_active: value,
        hasChanges: currentEdit.price !== info.price.toString() || value !== info.is_active || currentEdit.currency !== info.currency,
      },
    });
  };

  const handleSave = async (programId: string) => {
    const editState = getEditState(programId);
    const price = parseFloat(editState.price) || 0;
    
    if (price < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    setSavingId(programId);
    try {
      await upsertPricing.mutateAsync({
        program_id: programId,
        price,
        currency: editState.currency,
        is_active: editState.is_active,
      });
      
      // Clear edit state after save
      const newEdits = { ...priceEdits };
      delete newEdits[programId];
      setPriceEdits(newEdits);
    } finally {
      setSavingId(null);
    }
  };

  const handleCancelEdit = (programId: string) => {
    const newEdits = { ...priceEdits };
    delete newEdits[programId];
    setPriceEdits(newEdits);
  };

  const activePrograms = programs?.filter(p => {
    const info = getPricingInfo(p.id);
    const editState = priceEdits[p.id];
    return editState ? editState.is_active : info.is_active;
  }).length || 0;

  const totalPrograms = programs?.length || 0;

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Program Pricing"
        description="Manage program prices and enable/disable programs for enrollment"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/admin' },
          { label: 'Program Pricing' },
        ]}
        actions={
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Programs</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : totalPrograms}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active for Enrollment</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : activePrograms}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <X className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disabled</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : totalPrograms - activePrograms}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programs Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : programs?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No programs found. Create programs first in the Programs section.</p>
          </div>
        ) : (
          programs?.map((program) => {
            const editState = getEditState(program.id);
            const originalInfo = getPricingInfo(program.id);
            const isSaving = savingId === program.id;
            
            return (
              <Card key={program.id} className={editState.hasChanges ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {program.name}
                      </CardTitle>
                      {program.duration && (
                        <CardDescription>{program.duration}</CardDescription>
                      )}
                    </div>
                    <Badge variant={editState.is_active ? 'default' : 'secondary'}>
                      {editState.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  {program.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {program.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price and Currency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editState.price}
                        onChange={(e) => handlePriceChange(program.id, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Currency</label>
                      <Select
                        value={editState.currency}
                        onValueChange={(value) => handleCurrencyChange(program.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{curr.code}</span>
                                <span className="text-muted-foreground">({curr.symbol})</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Available for Enrollment</p>
                      <p className="text-xs text-muted-foreground">
                        {editState.is_active ? 'Students can enroll' : 'Hidden from students'}
                      </p>
                    </div>
                    <Switch
                      checked={editState.is_active}
                      onCheckedChange={(value) => handleActiveToggle(program.id, value)}
                    />
                  </div>

                  {/* Save/Cancel Buttons */}
                  {editState.hasChanges && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleSave(program.id)} 
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleCancelEdit(program.id)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Current Price Display */}
                  {!editState.hasChanges && Number(originalInfo.price) > 0 && (
                    <div className="text-center py-2 bg-primary/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Current Price</p>
                      <p className="text-xl font-bold text-primary">
                        {CURRENCIES.find(c => c.code === originalInfo.currency)?.symbol || originalInfo.currency}{' '}
                        {Number(originalInfo.price).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
