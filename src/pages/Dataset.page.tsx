import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import { DatasetLayout } from '@/components/Dataset/DatasetLayout';
import classes from './Pages.module.css';

export function DatasetPage() {
  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <DatasetLayout />
      </div>
    </div>
  );
}
