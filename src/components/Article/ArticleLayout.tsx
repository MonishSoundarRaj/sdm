import React, { useState, useEffect } from 'react';
import { Container, Text, Flex, Box } from '@mantine/core';
import { TableOfContentsFloating } from '../TableOfContentsFloating/TableOfContentsFloating';
import { Header } from '../Header/Header';
import classes from './ArticleLayout.module.css';

interface ArticleLayoutProps {
  article: {
    title: string;
    content: string;
    author: string;
  };
}

export function ArticleLayout({ article }: ArticleLayoutProps) {
  const [activeSection, setActiveSection] = useState('usage');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = document.querySelectorAll('h2[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleLinkClick = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Container size="" className={classes.container}>
      <Header dashboardText="Article Read" />
      <div className={classes.articleAreaContainer}>
      <h1 className={classes.title}>{article.title}</h1>
      <Flex direction={{ base: 'column', md: 'row' }} gap="md">
        <Box w={{ base: '100%', md: '25%' }} className={classes.tocwrapper}>
          <div className={classes.toc}>
            <TableOfContentsFloating activeSection={activeSection} onLinkClick={handleLinkClick} />
          </div>
        </Box>
        <Box w={{ base: '100%', md: '75%' }}>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </Box>
      </Flex>
      </div>
    </Container>
  );
}
