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
      <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Healthcare Subscriptions
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Manage, monitor, and analyze your organization’s healthcare benefits from a single, modern dashboard.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              onClick={handleNewSubscription}
              className="rounded-xl bg-blue-600 px-5 py-5 text-base text-white shadow-lg hover:bg-blue-700 hover:shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Subscription
            </Button>
          </div>       
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Empty-state / hero card */}
          <Card className="lg:col-span-2 rounded-3xl border-slate-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <CardHeader className="pb-0 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Activity className="h-7 w-7" />
              </div>
              <CardTitle className="mt-4 text-2xl">Ready to get started?</CardTitle>
              <CardDescription className="mt-1">
                Create your first healthcare subscription and start managing employee benefits with ease.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="flex flex-col items-center">               
                <Button
                  onClick={handleNewSubscription}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  Create your first subscription
                  <ArrowRight className="h-5 w-5" />
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
