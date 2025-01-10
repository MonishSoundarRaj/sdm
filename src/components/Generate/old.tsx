import React, { useState, useEffect } from 'react';
import { Link  } from 'react-router-dom';
import {
  Button,
  Container,
  Group,
  Paper,
  Select,
  Text,
  TextInput,
  Stack,
  Box,
  Flex,
  Badge,
  Tooltip,
  ActionIcon,
  Loader,
} from '@mantine/core';
import { IconPlayerPlay, IconEye, IconDownload } from '@tabler/icons-react';
import { Header } from '../Header/Header';
import { DataPreviewModal } from '../DataPreviewModal/DataPreviewModal';
import classes from './GenerateLayout.module.css';


export function GenerateLayout() {
  const [model, setModel] = useState(null);
  const [seed, setSeed] = useState(''); 
  const [rows, setRows] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDataSource, setPreviewDataSource] = useState('');
  const [models, setModels] = useState([]);
  const [recentData, setRecentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/get-models-and-data', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();
        setModels(data.models || []);
        setRecentData(data.recentlyGeneratedData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleDownload = async (filePath) => {
    try {
      const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filePath }),
      });
  
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(new Blob([blob]));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const fileName = filePath.split('/').pop();
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download the file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePreviewClick = (fileName) => {
    const dataSource = `${fileName}`;
    console.log('Opening preview for:', dataSource);
    setPreviewDataSource(dataSource);
    setIsPreviewOpen(true);
  };

  const handleStartGeneration = async () => {
    if (!model || !rows || !seed) {
      alert('Please select a model, enter a seed, and specify the number of rows to generate.');
      return;
    }

  setIsLoading(true); 

    try {
      const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/generate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          model,
          seed: seed,
          rows: parseInt(rows, 10),
        }),
      });

      if (response.ok) {
        console.log('Data generation started successfully');
        // Optionally, fetch the latest data here to update the UI
      } else {
        console.error('Error starting data generation:', response.statusText);
      }
    } catch (error) {
      console.error('Error starting data generation:', error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

 
  const lastTwoRecentData = recentData.slice(-2).reverse();
  return (
    <Container size="" className={classes.container}>
      <Header dashboardText="GENERATE" />
      <Text className={classes.title}>Generate Synthetic Data</Text>
      <Text className={classes.subtitle}>
        Configure your model and parameters to generate synthetic data
      </Text>

      <Paper shadow="sm" radius="md" withBorder className={classes.paper}>
        <Stack spacing="md">
          <Select
            label="Select a model"
            placeholder="Select a model"
            data={models}
            value={model}
            onChange={setModel}
          />
          <TextInput
            label="Seed"
            placeholder="Seed"
            value={seed}
            onChange={(event) => setSeed(event.currentTarget.value)} // Seed input
          />
          <TextInput
            label="Rows to Generate"
            placeholder="Rows to Generate"
            value={rows}
            onChange={(event) => setRows(event.currentTarget.value)}
          />
          <Button
            fullWidth
            mt="md"
            size="lg"
            className={classes.startButton}
            onClick={handleStartGeneration}
            disabled={isLoading} 
          >
            <Group spacing="xs">
              {isLoading ? <Loader size="sm" /> : <IconPlayerPlay size={20} />}
              <span>{isLoading ? 'Generating...' : 'Start Generation'}</span>
            </Group>
          </Button>
        </Stack>
      </Paper>

      <Paper shadow="sm" radius="md" withBorder className={classes.paper} mt="lg">
        <Text weight={500} className={classes.sectionTitle}>
          Recently Generated Data
        </Text>
        <Stack spacing="md">
          {lastTwoRecentData.map((data, index) => (
            <Paper key={index} className={classes.generatedItem}>
              <Flex justify="space-between" align="center" className={classes.dataItem}>
                <Box>
                  <Text weight={600} size="lg">
                    {data.syntheticDataName} 
                  </Text>
                  <Group spacing="xs" mt="xs">
                    <Badge className={classes.scoreBadge} variant="light">
                      KL DIV: {data.KL_Divergence}
                    </Badge>
                    <Badge className={classes.scoreBadge} variant="light" color="green">
                      HELL DIST: {data.Hellinger_Distance}
                    </Badge>
                  </Group>
                </Box>
                <Group spacing="xs">
                  <Tooltip label="Preview" withArrow position="top">
                    <ActionIcon
                      variant="subtle"
                      className={classes.actionIcon}
                      onClick={() => handlePreviewClick(data.filePath)}
                    >
                      <IconEye size={20} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Download" withArrow position="top">
                    <ActionIcon 
                    variant="subtle" 
                    className={classes.actionIcon} 
                    onClick={() => handleDownload(data.filePath)}
                    >
                      <IconDownload size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Flex>
            </Paper>
          ))}
        </Stack>
        <Link to="/dataset" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            mt="md"
            size="lg"
            className={classes.viewMoreButton}
          >
            <Group spacing="xs">
              <span>View More Data</span>
            </Group>
          </Button>
        </Link>
      </Paper>

      <DataPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        dataSource={previewDataSource}
      />
    </Container>
  );
}
