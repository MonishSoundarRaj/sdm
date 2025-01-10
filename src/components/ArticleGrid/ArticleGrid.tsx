import React from 'react';
import { Container, SimpleGrid } from '@mantine/core';
import { ArticleCard } from '../ArticleCard/ArticleCard';
import classes from './ArticleGrid.module.css';
import { Header } from '../Header/Header';

const articles = [
  {
    id: '1',
    title: 'GAN Architecture Explained',
    image: 'https://www.researchgate.net/publication/340458845/figure/fig1/AS:879437700669440@1586685695381/The-architecture-of-vanilla-GANs.ppm',
    description: 'Generative Adversarial Networks (GANs) are AI models where two neural networks compete to generate realistic data, with one network creating fake samples and the other trying to distinguish them from real ones.',
    author: 'Monish',
  },
];

export function ArticleGrid() {
  return (
    <Container size="" className={classes.container}>
      <Header dashboardText="ARTICLES" />
      <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        {articles.map((article) => (
          <ArticleCard key={article.id} {...article} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
