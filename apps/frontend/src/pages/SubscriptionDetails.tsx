import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useSubscriptions } from '../hooks/useSubscriptions';

const SubscriptionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscriptions, loading, error } = useSubscriptions();

  const subscription = subscriptions.find(sub => sub.id === id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
              <span className="text-xl font-medium text-slate-700">Loading subscription details...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="text-center py-16">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-3 text-slate-900">Subscription Not Found</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                The subscription you're looking for doesn't exist or couldn't be loaded.
              </p>
              <Button 
                onClick={() => navigate('/subscriptions')} 
                className="px-6 py-3 rounded-xl font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Subscriptions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Breadcrumbs */}
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/subscriptions" className="text-slate-600 hover:text-slate-900">
                  Subscriptions
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Subscription Details
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} healthcare subscription
              </p>
            </div>
            <Button 
              onClick={() => navigate('/subscriptions')} 
              variant="outline" 
              className="px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Overview Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Overview</CardTitle>
                <Badge className={`${getStatusColor(subscription.status)} border`}>
                  {subscription.status.toLowerCase().replace(/_/g, ' ')}
                </Badge>
              </div>
              <CardDescription>
                Subscription ID: {subscription.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Start Date</p>
                  <p className="text-lg text-slate-900">{formatDate(subscription.startDate)}</p>
                </div>
                
                {subscription.endDate && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">End Date</p>
                    <p className="text-lg text-red-600">{formatDate(subscription.endDate)}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-slate-700">Billing Anchor</p>
                  <p className="text-lg text-slate-900">{subscription.billingAnchor} of each month</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-700">Type</p>
                  <p className="text-lg text-slate-900 capitalize">{subscription.type.toLowerCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;