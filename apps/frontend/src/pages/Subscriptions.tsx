import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Activity,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Subscriptions: React.FC = () => {
  const navigate = useNavigate();
  const handleNewSubscription = () => navigate("/subscriptions/new");

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
        <div className="flex justify-center">
          {/* Empty-state / hero card */}
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
      </section>
    </div>
  );
};

export default Subscriptions;
