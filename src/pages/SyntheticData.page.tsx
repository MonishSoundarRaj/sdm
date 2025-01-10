import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import { SyntheticDataLayout } from '@/components/SyntheticData/SyntheticDataLayout';
import classes from './Pages.module.css';

export function SyntheticDataPage() {
  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <SyntheticDataLayout />
      </div>
    </div>
  );
}
