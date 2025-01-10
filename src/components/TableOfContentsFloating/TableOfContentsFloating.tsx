import React, { useEffect, useRef } from 'react';
import cx from 'clsx';
import { Box, Text, Group, rem } from '@mantine/core';
import { IconListSearch } from '@tabler/icons-react';
import classes from './TableOfContentsFloating.module.css';

const links = [
  { label: 'Usage', link: '#usage', order: 1 },
  { label: 'Position and placement', link: '#position', order: 1 },
  { label: 'With other overlays', link: '#overlays', order: 1 },
  { label: 'Manage focus', link: '#focus', order: 1 },
  { label: 'Examples', link: '#examples', order: 1 },
];

export function TableOfContentsFloating({ activeSection, onLinkClick }) {
  const linkRefs = useRef([]);

  useEffect(() => {
    const activeIndex = links.findIndex(link => link.link.slice(1) === activeSection);
    if (activeIndex !== -1 && linkRefs.current[activeIndex]) {
      linkRefs.current[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeSection]);

  const items = links.map((item, index) => (
    <Box<'a'>
      component="a"
      href={item.link}
      onClick={(event) => {
        event.preventDefault();
        onLinkClick(item.link.slice(1));
      }}
      key={item.label}
      ref={el => linkRefs.current[index] = el}
      className={cx(classes.link, { [classes.linkActive]: activeSection === item.link.slice(1) })}
      style={{ paddingLeft: `calc(${item.order} * var(--mantine-spacing-md))` }}
    >
      {item.label}
    </Box>
  ));

  return (
    <div className={classes.root}>
      <Group mb="md">
        <IconListSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
        <Text>Table of contents</Text>
      </Group>
      <div className={classes.links}>
        <div
          className={classes.indicator}
          style={{
            transform: `translateY(calc(${links.findIndex(link => link.link.slice(1) === activeSection)} * var(--link-height) + var(--indicator-offset)))`,
          }}
        />
        {items}
      </div>
    </div>
  );
}
