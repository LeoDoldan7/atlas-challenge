import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Activity,
  ArrowRight,
  User,
  Calendar,
  Building,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { HealthcareSubscription } from "../types";

const Subscriptions: React.FC = () => {
  const navigate = useNavigate();
  const { subscriptions, loading, error } = useSubscriptions();
  const handleNewSubscription = () => navigate("/subscriptions/new");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Decorative blobs (uses your animate-blob utilities) */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none absolute -right-28 top-32 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl animate-blob animation-delay-4000" />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mt-8 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
            Healthcare Subscriptions
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Manage, monitor, and analyze your organization’s healthcare benefits from a single, modern dashboard.
          </p>

          <div className="mt-10 flex items-center justify-center">
            <Button
              onClick={handleNewSubscription}
              className="rounded-2xl bg-blue-600 px-8 py-6 text-lg font-semibold text-white shadow-xl hover:bg-blue-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="mr-3 h-6 w-6" />
              Create New Subscription
            </Button>
          </div>       
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center">
            <Card className="w-full max-w-4xl rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
                <span className="text-xl font-medium text-slate-700">Loading subscriptions...</span>
              </CardContent>
            </Card>
          </div>
        ) : error ? (
          <div className="flex justify-center">
            <Card className="w-full max-w-4xl rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm">
              <CardContent className="text-center py-16">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-3 text-slate-900">Failed to load subscriptions</h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {error.message || 'An error occurred while fetching subscriptions'}
                </p>
                <Button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl font-medium">Try Again</Button>
              </CardContent>
            </Card>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex justify-center">
            {/* Empty-state card */}
            <Card className="w-full max-w-4xl rounded-3xl border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
              <CardHeader className="pb-8 pt-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl mb-6">
                  <Activity className="h-10 w-10" />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Ready to get started?</CardTitle>
                <CardDescription className="mt-4 text-lg leading-7 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                  Create your first healthcare subscription and start managing employee benefits with ease.
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-12 pt-0">
                <div className="flex flex-col items-center">               
                  <Button
                    onClick={handleNewSubscription}
                    className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-xl hover:bg-blue-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="h-6 w-6" />
                    Create your first subscription
                    <ArrowRight className="h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>      
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription: HealthcareSubscription) => (
              <Card 
                key={subscription.id} 
                className="rounded-2xl border-slate-200/50 bg-white/95 shadow-lg backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/subscriptions/${subscription.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {subscription.type === 'INDIVIDUAL' ? 'Individual' : 'Family'} Plan
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(subscription.status)} border-0`}>
                        {subscription.status.toLowerCase()}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                  <CardDescription className="text-slate-600">
                    {subscription.plan?.name || 'Healthcare Plan'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {subscription.employee && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <User className="h-4 w-4" />
                      <span>
                        {subscription.employee.demographic.firstName} {subscription.employee.demographic.lastName}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Started {formatDate(subscription.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Building className="h-4 w-4" />
                    <span>ID: {subscription.id}</span>
                  </div>

                  {subscription.endDate && (
                    <div className="flex items-center gap-3 text-sm text-red-600">
                      <Calendar className="h-4 w-4" />
                      <span>Ends {formatDate(subscription.endDate)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Subscriptions;
