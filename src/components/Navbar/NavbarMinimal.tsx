import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Center, Tooltip, UnstyledButton, Stack, rem } from '@mantine/core';
import {
  IconGauge,
  IconLogout,
  IconDatabase,
  IconTrain,
  IconArticle,
  IconWindmill,
  IconSettings,
  IconAssemblyFilled,
} from '@tabler/icons-react';
import classes from './NavbarMinimal.module.css';

interface NavbarLinkProps {
  icon: typeof IconGauge;
  label: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
        <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const mockdata = [
  { icon: IconGauge, label: 'Dashboard', path: '/' },
  { icon: IconDatabase, label: 'Dataset', path: '/dataset' },
  { icon: IconTrain, label: 'Train', path: '/train' },
  { icon: IconWindmill, label: 'Generate', path: '/generate' },
  { icon: IconArticle, label: 'Articles', path: '/articlegrid' },
];

export function NavbarMinimal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const activeIndex = mockdata.findIndex((link) => link.path === location.pathname);
    setActive(activeIndex !== -1 ? activeIndex : null);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/logout', {
        method: 'POST',
        credentials: 'include', // Include credentials to ensure the cookie is sent
      });

      if (response.ok) {
        navigate('/authentication'); // Redirect to login page after successful logout
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const links = mockdata.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => {
        setActive(index);
        navigate(link.path);
      }}
    />
  ));

  return (
    <nav className={classes.navbar}>
      <Center>
        <IconAssemblyFilled type="mark" size={30} />
      </Center>

      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>

      <Stack justify="center" gap={0}>
        <NavbarLink icon={IconLogout} label="Logout" onClick={handleLogout} />
      </Stack>
    </nav>
  );
}
