import React from 'react';
import { Breadcrumbs, Anchor, Text } from '@mantine/core';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({ items }) => {
  return (
    <Breadcrumbs>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isActive = item.isActive ?? isLast;
        
        if (isActive || !item.href) {
          return (
            <Text key={index} fw={500} c={isActive ? 'dimmed' : undefined}>
              {item.label}
            </Text>
          );
        }
        
        return (
          <Anchor key={index} href={item.href} c="blue">
            {item.label}
          </Anchor>
        );
      })}
    </Breadcrumbs>
  );
};