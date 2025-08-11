import React from 'react';
import { Grid, NumberInput } from '@mantine/core';

interface CostSharingInputProps {
  companyPercent: number;
  employeePercent: number;
  onCompanyPercentChange: (value: number | string) => void;
  onEmployeePercentChange: (value: number | string) => void;
  disabled?: boolean;
}

export const CostSharingInput: React.FC<CostSharingInputProps> = ({
  companyPercent,
  employeePercent,
  onCompanyPercentChange,
  onEmployeePercentChange,
  disabled = false,
}) => {
  const hasError = companyPercent + employeePercent !== 100;

  return (
    <Grid>
      <Grid.Col span={6}>
        <NumberInput
          label="Company Pays (%)"
          value={companyPercent}
          onChange={onCompanyPercentChange}
          min={0}
          max={100}
          suffix="%"
          error={hasError ? 'Must sum to 100%' : ''}
          disabled={disabled}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Employee Pays (%)"
          value={employeePercent}
          onChange={onEmployeePercentChange}
          min={0}
          max={100}
          suffix="%"
          error={hasError ? 'Must sum to 100%' : ''}
          disabled={disabled}
        />
      </Grid.Col>
    </Grid>
  );
};