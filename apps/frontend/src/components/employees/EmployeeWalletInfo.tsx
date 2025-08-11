import React from 'react';
import { Group, Text, Badge } from '@mantine/core';
import { IconWallet } from '@tabler/icons-react';
import type { Employee } from '../../types';

interface EmployeeWalletInfoProps {
  employee: Employee;
  formatCurrency: (cents: string) => string;
  walletStatus: string;
}

export const EmployeeWalletInfo: React.FC<EmployeeWalletInfoProps> = ({
  employee,
  formatCurrency,
  walletStatus,
}) => {
  return (
    <Group gap="xs">
      <IconWallet size={16} style={{ opacity: 0.6 }} />
      <Text size="sm">
        {employee.wallet ? formatCurrency(employee.wallet.balanceCents) : 'No wallet'}
      </Text>
      {employee.wallet && (
        <Badge 
          color={walletStatus === 'sufficient' ? 'green' : 'red'} 
          variant="light"
          size="xs"
        >
          {walletStatus === 'sufficient' ? 'Sufficient' : 'Low'}
        </Badge>
      )}
    </Group>
  );
};