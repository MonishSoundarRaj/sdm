import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import { TrainLayout } from '@/components/Train/TrainLayout';
import classes from './Pages.module.css';

export function TrainPage() {
  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <TrainLayout />
      </div>
    </div>
  );
}
