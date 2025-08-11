import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconChartBar, IconFileText, IconPlus, IconUsers } from '@tabler/icons-react';
import { Container, Group, Title, Anchor } from '@mantine/core';

const Navbar: React.FC = () => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: IconChartBar,
    },
    {
      to: '/employees',
      label: 'Employees',
      icon: IconUsers,
    },
    {
      to: '/subscriptions',
      label: 'Subscriptions',
      icon: IconFileText,
    },
    {
      to: '/subscriptions/new',
      label: 'New Subscription',
      icon: IconPlus,
    },
  ];

  return (
    <nav
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Container size="xl">
        <Group justify="apart" h={64}>
          <Title order={3} fw={700}>
            Atlas Healthcare
          </Title>

          <Group gap="xs" visibleFrom="md">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} end={item.to === '/subscriptions'} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <Anchor
                      component="div"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 'var(--mantine-radius-md)',
                        fontSize: 'var(--mantine-font-size-sm)',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        backgroundColor: isActive ? 'var(--mantine-color-blue-1)' : 'transparent',
                        color: isActive ? 'var(--mantine-color-blue-7)' : 'var(--mantine-color-gray-7)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                          e.currentTarget.style.color = 'var(--mantine-color-dark-9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--mantine-color-gray-7)';
                        }
                      }}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Anchor>
                  )}
                </NavLink>
              );
            })}
          </Group>

          <Group gap={4} hiddenFrom="md">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} end={item.to === '/subscriptions'} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <Anchor
                      component="div"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 'var(--mantine-radius-md)',
                        fontSize: 'var(--mantine-font-size-xs)',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        backgroundColor: isActive ? 'var(--mantine-color-blue-1)' : 'transparent',
                        color: isActive ? 'var(--mantine-color-blue-7)' : 'var(--mantine-color-gray-7)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                          e.currentTarget.style.color = 'var(--mantine-color-dark-9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--mantine-color-gray-7)';
                        }
                      }}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Anchor>
                  )}
                </NavLink>
              );
            })}
          </Group>
        </Group>
      </Container>
    </nav>
  );
};

export default Navbar;