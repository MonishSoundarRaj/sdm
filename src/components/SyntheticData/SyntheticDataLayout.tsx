import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Paper, Text, Group, Box, Flex, Grid, Badge, ActionIcon, Tooltip, Button, Stack, Loader, Center } from '@mantine/core';
import { IconEye, IconDownload, IconChartLine, IconListDetails, IconLayoutList, IconDatabaseOff } from '@tabler/icons-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import classes from './SyntheticDataLayout.module.css';
import { Header } from '../Header/Header';
import { DataPreviewModal } from '../DataPreviewModal/DataPreviewModal';

export function SyntheticDataLayout() {
  const { datasetName } = useParams();
  const [data, setData] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDataSource, setPreviewDataSource] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchSyntheticData = async () => {
      try {
        const response = await fetch(`http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/synthetic-data/${datasetName}`, {
          method: 'GET',
          credentials: 'include',
        });
        const result = await response.json();
        setData(result.syntheticData || []);
      } catch (error) {
        console.error('Error fetching synthetic data:', error);
      }
    };

    fetchSyntheticData();
  }, [datasetName]);

  const handleDownload = async (filePath) => {
    try {
      setIsDownloading(true);
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
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleChartClick = (data) => {
    if (data && data.activePayload) {
      const { syntheticDataName, KL_Divergence, Hellinger_Distance, rows, seed, modelUsed, original_dataset, filePath } = data.activePayload[0].payload;
      setSelectedData({
        file: syntheticDataName,
        Original_Dataset: original_dataset,
        model_Used: modelUsed,
        rowsGenerated: rows,
        seed: seed,
        KL_Divergence,
        Hellinger_Distance,
      });
      setSelectedFilePath(filePath);
    }
  };

  const lastTwoLatestData = data.slice(-2).reverse();

  const handlePreviewClick = (fileName) => {
    const dataSource = `${fileName}`; 
    console.log('Opening preview for:', dataSource);
    setPreviewDataSource(dataSource);
    setIsPreviewOpen(true);
  };

  const handleGenerateAndDownload = () => {
    if (selectedFilePath) {
      setIsDownloading(true);
      handleDownload(selectedFilePath);  
    }
  };

  return (
    <Container size="" className={classes.container}>
      <Header dashboardText="Synthetic Data" />
      <Title order={2} mb="md">
        {datasetName} - Synthetic Datasets
      </Title>

      <Paper shadow="sm" radius="md" p="xl" withBorder className={`${classes.paper} ${classes.latestDataPaper}`}>
        <Title order={4} mb="lg">
          Latest Generated Synthetic Data of {datasetName}
        </Title>
        {lastTwoLatestData.length > 0 ? (
          lastTwoLatestData.map((item, index) => (
            <Paper key={index} shadow="sm" radius="md" p="md" withBorder className={classes.latestDataItem}>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text weight={600} size="lg">
                    {item.syntheticDataName}
                  </Text>
                  <Group spacing="xs" mt="xs">
                    <Badge className={classes.scoreBadge} variant="light">
                      KL DIV: {item.KL_Divergence}
                    </Badge>
                    <Badge className={classes.scoreBadge} variant="light" color="green">
                      HELL DIST: {item.Hellinger_Distance}
                    </Badge>
                  </Group>
                </Box>
                <Group spacing="xs">
                  <Tooltip label="Preview" withArrow position="top">
                    <ActionIcon variant="subtle" className={classes.actionIcon} onClick={() => handlePreviewClick(item.filePath)}>
                      <IconEye size={20} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Download" withArrow position="top">
                    <ActionIcon variant="subtle" className={classes.actionIcon} onClick={() => handleDownload(item.filePath)}>
                      <IconDownload size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Flex>
            </Paper>
          ))
        ) : (
          <Center style={{ height: '200px' }}>
            <Box className={classes.emptyState}>
              <IconDatabaseOff size={50} stroke={1.5} />
              <Text size="xl" weight={500} mt="md">No recent synthetic data</Text>
              <Text size="sm" color="dimmed" mt="sm">Generate some data to see it here</Text>
            </Box>
          </Center>
        )}
      </Paper>

      <Grid gutter="xl" mt="xl">
        <Grid.Col span={8}>
          <Paper shadow="sm" radius="md" p="xl" withBorder className={classes.paper}>
            <Title order={4} mb="lg">
              {datasetName}
            </Title>
            <Box className={classes.chartContainer}>
              {data.length > 0 ? (
                <LineChart width={600} height={400} data={data} onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="KL_Divergence" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="Hellinger_Distance" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              ) : (
                <Box className={classes.emptyChartState}>
                  <IconChartLine size={50} stroke={1.5} />
                  <Text size="xl" weight={500} mt="md">No data available</Text>
                  <Text size="sm" color="dimmed" mt="sm">Generate synthetic data to see the chart</Text>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper shadow="sm" radius="md" p="xl" withBorder className={classes.selectedDataPaper}>
            <Title order={4} mb="lg">
              Selected Synthetic Dataset Details
            </Title>
            {selectedData ? (
              <>
                <Box className={classes.details}>
                  {Object.entries(selectedData).map(([key, value]) => (
                    <Flex key={key} justify="space-between" align="center" className={classes.detailRow}>
                      <Text size="sm" weight={700} transform="capitalize">
                        <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong>
                      </Text>
                      <Text size="sm">{value}</Text>
                    </Flex>
                  ))}
                </Box>
                <Stack spacing="sm" mt="xl" align="stretch">
                  <Button 
                    leftIcon={isDownloading ? <Loader size="sm" /> : <IconDownload size={16} />} 
                    variant="light" 
                    size="md" 
                    fullWidth
                    onClick={handleGenerateAndDownload} 
                    disabled={isDownloading} 
                  >
                    {isDownloading ? 'Downloading...' : 'Generate and Download'}
                  </Button>
                </Stack>
              </>
            ) : (
              <Center style={{ height: '200px' }}>
                <Box className={classes.emptyState}>
                  <IconListDetails size={50} stroke={1.5} />
                  <Text size="xl" weight={500} mt="md">No dataset selected</Text>
                  <Text size="sm" color="dimmed" mt="sm">Click on a point in the chart to see details</Text>
                </Box>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
      <DataPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} dataSource={previewDataSource} />
    </Container>
  );
}