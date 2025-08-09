import React from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useHealthcarePlans } from '../hooks/useHealthcarePlans';
import type { Employee, HealthcarePlan } from '../types';

const NewSubscription: React.FC = () => {
  // Fetch employees for company #1
  const { employees, loading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useEmployees('1');
  
  // Fetch all healthcare plans
  const { plans, loading: plansLoading, error: plansError, refetch: refetchPlans } = useHealthcarePlans();

  const isLoading = employeesLoading || plansLoading;
  const hasError = employeesError || plansError;

  const formatCurrency = (cents: string) => {
    const amount = parseInt(cents, 10) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPercentage = (percentage: string) => {
    const pct = parseFloat(percentage);
    return `${pct}%`;
  };

  const handleRetry = async () => {
    await Promise.all([refetchEmployees(), refetchPlans()]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading subscription data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Failed to load data</h2>
              <p className="text-gray-600 mb-4">
                {employeesError?.message || plansError?.message || 'An error occurred while fetching data'}
              </p>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Subscription</h1>
          <p className="mt-2 text-gray-600">Create a new healthcare subscription by selecting an employee and plan.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Employees Section */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Company Employees</h2>
              <p className="text-sm text-gray-600 mt-1">{employees.length} employees found</p>
            </div>
            <div className="p-6">
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No employees found for this company.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {employees.map((employee: Employee) => (
                    <div
                      key={employee.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{employee.email}</h3>
                          <p className="text-sm text-gray-600 mt-1">ID: {employee.id}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {employee.maritalStatus}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Born: {formatDate(employee.birthDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Healthcare Plans Section */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Healthcare Plans</h2>
              <p className="text-sm text-gray-600 mt-1">{plans.length} plans available</p>
            </div>
            <div className="p-6">
              {plans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No healthcare plans available.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {plans.map((plan: HealthcarePlan) => (
                    <div
                      key={plan.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 mb-3">{plan.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium text-gray-700">Employee:</span>
                            <div className="text-gray-600">
                              Cost: {formatCurrency(plan.costEmployeeCents)}
                            </div>
                            <div className="text-gray-600">
                              Company pays: {formatPercentage(plan.pctEmployeePaidByCompany)}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Spouse:</span>
                            <div className="text-gray-600">
                              Cost: {formatCurrency(plan.costSpouseCents)}
                            </div>
                            <div className="text-gray-600">
                              Company pays: {formatPercentage(plan.pctSpousePaidByCompany)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Child:</span>
                          <span className="text-gray-600 ml-2">
                            {formatCurrency(plan.costChildCents)} (Company pays: {formatPercentage(plan.pctChildPaidByCompany)})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">{employees.length}</span> employees loaded from Company #1
              </span>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">{plans.length}</span> healthcare plans available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSubscription;