import React, { useState, useEffect } from 'react';
import {
  Button,
  TextInput,
  Paper,
  Title,
  Text,
  Group,
  Box,
  Stack,
  Container,
  ActionIcon,
  Tooltip,
  Transition,
  Autocomplete,
  Space,
  Center
} from '@mantine/core';
import {
  IconEye,
  IconDownload,
  IconGitMerge,
  IconTrash,
  IconUpload,
  IconSearch,
  IconDatabaseOff
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Header } from '../Header/Header';
import { DataPreviewModal } from '../DataPreviewModal/DataPreviewModal';
import classes from './DatasetLayout.module.css';
import { UploadButton } from '../UploadButton/UploadButton';

export function DatasetLayout() {
  const [datasets, setDatasets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [autocompleteData, setAutocompleteData] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDataSource, setPreviewDataSource] = useState('');

  const fetchDatasets = async () => {
    try {
      const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/datasets', {
        method: 'GET',
        credentials: 'include',
      });
      const result = await response.json();
      setDatasets(result.datasets);
      setFilteredDatasets(result.datasets);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    const filtered = datasets.filter(dataset =>
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDatasets(filtered);

    if (searchQuery.trim() !== '') {
      const suggestions = datasets
        .map(dataset => dataset.name)
        .filter(name => name.toLowerCase().startsWith(searchQuery.toLowerCase()));
      setAutocompleteData(suggestions);
    } else {
      setAutocompleteData([]);
    }
  }, [searchQuery, datasets]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  const handlePreviewClick = (filePath) => {
    console.log('Opening preview for:', filePath);
    setPreviewDataSource(filePath);
    setIsPreviewOpen(true);
  };

  const handleUploadSuccess = () => {
    fetchDatasets();
  };

  const handleDownload = async (datasetName) => {
    try {
      const response = await fetch(`http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/download/${datasetName}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = datasetName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Error downloading file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async (datasetName) => {
    try {
      const response = await fetch(`http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/datasets/${datasetName}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        setDatasets(prevDatasets => prevDatasets.filter(dataset => dataset.name !== datasetName));
        setFilteredDatasets(prevFiltered => prevFiltered.filter(dataset => dataset.name !== datasetName));
      } else {
        console.error('Error deleting dataset');
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  return (
    <Container size="" className={classes.container}>
      <Header dashboardText="DATASET" />
      <Group position="apart" align="center" className={classes.header}>
        <div>
          <Title order={2}>Uploaded Datasets</Title>
          <Text color="dimmed" size="sm">
            Displaying the latest 5 uploaded datasets.
          </Text>
        </div>
        <div>
          <UploadButton onUploadSuccess={handleUploadSuccess} />
        </div>
      </Group>

      <Paper shadow="sm" radius="md" withBorder className={classes.contentBox}>
        <div className={classes.stickySearch}>
          <Autocomplete
            placeholder="Search"
            icon={<IconSearch size={16} />}
            data={autocompleteData}
            value={searchQuery}
            onChange={handleSearchChange}
            className={classes.searchInput}
            limit={3}
            styles={(theme) => ({
              dropdown: {
                backgroundColor: theme.colors.gray[1],
                borderColor: theme.colors.gray[4],
                maxHeight: '120px',
                overflowY: 'auto'
              },
              item: {
                '&[data-selected]': {
                  '&, &:hover': {
                    backgroundColor: theme.colors.blue[1],
                    color: theme.colors.blue[9],
                  },
                },
              },
            })}
          />
        </div>

        <Stack spacing="md" className={classes.datasetList}>
          {filteredDatasets.length > 0 ? (
            filteredDatasets.map((dataset, index) => {
              const isVisible = filteredDatasets.includes(dataset);
              return (
                <Transition
                  key={index}
                  transition={{
                    in: { opacity: 1, transform: 'translateY(0)' },
                    out: { opacity: 0, transform: 'translateY(-20px)' },
                    transitionProperty: 'opacity, transform',
                  }}
                  duration={400}
                  mounted={isVisible}
                >
                  {(styles) => (
                    <Paper
                      shadow="sm"
                      radius="md"
                      withBorder
                      className={classes.datasetItem}
                      style={{
                        ...styles,
                        display: isVisible ? 'block' : 'none',
                      }}
                    >
                      <Group position="apart" noWrap className={classes.datasetItemContent}>
                        <Box className={classes.datasetInfo}>
                          <Text weight={500}>{dataset.name}</Text>
                          <Space h="xs" />
                          <Text size="xs" color="dimmed">
                            {new Date(dataset.date).toLocaleString()}
                          </Text>
                        </Box>
                        <Group spacing="xs" className={classes.actions}>
                          <Tooltip label="View" withArrow position="top">
                            <ActionIcon
                              variant="subtle"
                              className={classes.actionIcon}
                              onClick={() => handlePreviewClick(dataset.filePath)}
                            >
                              <IconEye size={19} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Download" withArrow position="top">
                            <ActionIcon 
                              variant="subtle" 
                              className={classes.actionIcon}
                              onClick={() => handleDownload(dataset.name)}
                            >
                              <IconDownload size={19} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="View Associated Synthetic Data" withArrow position="top">
                            <ActionIcon
                              variant="subtle"
                              className={classes.actionIcon}
                              component={Link}
                              to={`/synthetic-data/${dataset.name}`}
                            >
                              <IconGitMerge size={19} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete" withArrow position="top">
                            <ActionIcon 
                              variant="subtle" 
                              className={classes.actionIcon}
                              onClick={() => handleDelete(dataset.name)}
                            >
                              <IconTrash size={19} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Paper>
                  )}
                </Transition>
              );
            })
          ) : (
            <Center style={{ height: '100%' }}>
              <Box className={classes.emptyState}>
                <IconDatabaseOff size={50} stroke={1.5} />
                <Text size="xl" weight={500} mt="md">No datasets found</Text>
                <Text size="sm" color="dimmed" mt="sm">Upload a dataset to get started</Text>
              </Box>
            </Center>
          )}
        </Stack>
      </Paper>

      <DataPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        dataSource={previewDataSource}
      />
    </Container>
  );
}