import React from 'react';
// import { Container } from '@mantine/core';
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid';
import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import classes from './Pages.module.css';

export function ArticleGridPage() {
  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <ArticleGrid />
      </div>
    </div>
  );
}
