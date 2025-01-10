import React, { useState, useEffect, forwardRef } from 'react';
import { Group, Text, Box, Menu, Avatar, UnstyledButton, MantineProvider, Loader } from '@mantine/core';
import { IconBell, IconFileText, IconCheck } from '@tabler/icons-react';
import classes from './Header.module.css';

interface DashboardProps {
  dashboardText?: string;
}

interface Notification {
  title: string;
  message: string;
  time: string;
}

const RingLoader = forwardRef<SVGSVGElement, React.ComponentPropsWithoutRef<'svg'>>(({ style, ...others }, ref) => (
  <svg
    {...others}
    ref={ref}
    style={{
      width: 'var(--loader-size)',
      height: 'var(--loader-size)',
      stroke: 'var(--loader-color)',
      ...style,
    }}
    viewBox="0 0 45 45"
    xmlns="http://www.w3.org/2000/svg"
    stroke="#fff"
  >
    <g fill="none" fillRule="evenodd" transform="translate(1 1)" strokeWidth="2">
      <circle cx="22" cy="22" r="6" strokeOpacity="0">
        <animate
          attributeName="r"
          begin="1.5s"
          dur="3s"
          values="6;22"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-opacity"
          begin="1.5s"
          dur="3s"
          values="1;0"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-width"
          begin="1.5s"
          dur="3s"
          values="2;0"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="22" cy="22" r="6" strokeOpacity="0">
        <animate
          attributeName="r"
          begin="3s"
          dur="3s"
          values="6;22"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-opacity"
          begin="3s"
          dur="3s"
          values="1;0"
          calcMode="linear"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-width"
          begin="3s"
          dur="3s"
          values="2;0"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="22" cy="22" r="8">
        <animate
          attributeName="r"
          begin="0s"
          dur="1.5s"
          values="6;1;2;3;4;5;6"
          calcMode="linear"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  </svg>
));

export function Header({ dashboardText = 'DASHBOARD' }: DashboardProps) {
  const [opened, setOpened] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/notifications', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (opened) {
      fetchNotifications();
    }
  }, [opened]);

  return (
    <MantineProvider
      theme={{
        components: {
          Loader: Loader.extend({
            defaultProps: {
              loaders: { ...Loader.defaultLoaders, ring: RingLoader },
              type: 'ring',
            },
          }),
        },
      }}
    >
      <div className={classes.headerWrapper}>
        <Box className={classes.dashboardBox}>
          <Text className={classes.dashboardTitle}>{dashboardText}</Text>
        </Box>
        <Group position="apart" className={classes.headerContent}>
          <Box className={classes.trainingBox}>
            <Text size="sm" className={classes.trainingText}>
              <Loader size="sm" />
              Training in Progress
            </Text>
          </Box>
          <Group spacing="xs" className={classes.iconGroup}>
            <Menu
              opened={opened}
              onChange={setOpened}
              transition="pop-top-right"
              position="bottom-end"
              radius="md"
              shadow="md"
            >
              <Menu.Target>
                <UnstyledButton className={classes.iconWrapper}>
                  <IconBell size={20} stroke={1.5} className={classes.icon} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown className={classes.dropdown}>
                <Menu.Label className={classes.stickyHeader}>Notifications</Menu.Label>
                <div className={classes.notificationsContainer}>
                  {loadingNotifications ? (
                    <Loader size="sm" />
                  ) : (
                    notifications.map((notification, index) => (
                      <Menu.Item key={index} className={classes.notificationItem}>
                        <Group noWrap align="flex-start">
                          <Avatar color="gray.1" radius="xl">
                            <IconCheck size={18} stroke={1.5} color="var(--mantine-color-gray-7)" />
                          </Avatar>
                          <div className={classes.notificationContent}>
                            <Text weight={500} size="sm" color="gray.8">{notification.title}</Text>
                            <Text size="xs" color="gray.6" className={classes.notificationMessage}>{notification.message}</Text>
                            <Text size="xs" color="gray.5">{notification.time}</Text>
                          </div>
                        </Group>
                      </Menu.Item>
                    ))
                  )}
                </div>
              </Menu.Dropdown>
            </Menu>
            <UnstyledButton className={classes.iconWrapper}>
              <IconFileText size={20} stroke={1.5} className={classes.icon} />
            </UnstyledButton>
          </Group>
        </Group>
      </div>
    </MantineProvider>
  );
}
