import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Subscriptions: React.FC = () => {
  const navigate = useNavigate();

  const handleNewSubscription = () => {
    navigate('/subscriptions/new');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Subscriptions</h1>
            <p className="mt-2 text-muted-foreground">
              Manage healthcare subscriptions for your organization
            </p>
          </div>
          <Button onClick={handleNewSubscription}>
            <Plus className="h-4 w-4 mr-2" />
            New Subscription
          </Button>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Healthcare Subscriptions</CardTitle>
            <CardDescription>
              View and manage all active healthcare subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <Plus className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">No subscriptions yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first healthcare subscription.
              </p>
              <Button onClick={handleNewSubscription}>
                Create New Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscriptions;