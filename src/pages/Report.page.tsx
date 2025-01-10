import React from 'react';
import { ReportLayout } from '@/components/Report/ReportLayout';
import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import classes from './Pages.module.css';

export function ReportPage() {
  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <ReportLayout />
      </div>
    </div>
  );
}
