import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import { GenerateLayout } from '@/components/Generate/GenerateLayout';
import classes from './Pages.module.css';

export function GeneratePage() {
  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <GenerateLayout />
      </div>
    </div>
  );
}
