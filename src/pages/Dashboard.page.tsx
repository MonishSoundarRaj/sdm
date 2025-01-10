import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import classes from './Pages.module.css';

export function DashboardPage() {
  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <DashboardLayout />
      </div>
    </div>
  );
}
