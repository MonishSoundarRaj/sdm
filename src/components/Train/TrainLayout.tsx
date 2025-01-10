import React, { useState, useEffect } from 'react';
import {
  Button,
  Checkbox,
  Container,
  Grid,
  Paper,
  Select,
  MultiSelect,
  Text,
  TextInput,
  Stack,
  Accordion,
  Group,
  Code,
  Box,
  ScrollArea,
  Loader,
  Center
} from '@mantine/core';
import { IconPlayerPlay, IconReportAnalytics } from '@tabler/icons-react';
import { Header } from '../Header/Header';
import classes from './TrainLayout.module.css';
import { io } from 'socket.io-client';

export function TrainLayout() {
  const [jobs, setJobs] = useState([]);
  const [trainingData, setTrainingData] = useState(null);
  const [model, setModel] = useState(null);
  const [numericalColumns, setNumericalColumns] = useState([]);
  const [categoricalColumns, setCategoricalColumns] = useState([]);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.001);
  const [batchSize, setBatchSize] = useState(100);
  const [enforceMinMax, setEnforceMinMax] = useState(true);
  const [enforceRounding, setEnforceRounding] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [availableNumericalColumns, setAvailableNumericalColumns] = useState([]);
  const [availableCategoricalColumns, setAvailableCategoricalColumns] = useState([]);
  const [openAccordions, setOpenAccordions] = useState([]);

  useEffect(() => {
    const fetchTrainingOptions = async () => {
      try {
        const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/training-options', {
          method: 'GET',
          credentials: 'include',
        });
        const result = await response.json();
        setDatasets(result.datasets);
      } catch (error) {
        console.error('Error fetching training options:', error);
      }
    };

    fetchTrainingOptions();
  }, []);

  useEffect(() => {
    if (trainingData) {
      const selectedDataset = datasets.find(dataset => dataset.name === trainingData);
      if (selectedDataset) {
        setAvailableNumericalColumns(selectedDataset.columns);
        setAvailableCategoricalColumns(selectedDataset.columns);
      }
    }
  }, [trainingData, datasets]);

  const handleNumericalColumnsChange = (selected) => {
    setNumericalColumns(selected);
    setAvailableCategoricalColumns(availableNumericalColumns.filter(col => !selected.includes(col)));
  };

  const handleCategoricalColumnsChange = (selected) => {
    setCategoricalColumns(selected);
    setAvailableNumericalColumns(availableCategoricalColumns.filter(col => !selected.includes(col)));
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/training-jobs', {
          method: 'GET',
          credentials: 'include',
        });
        const result = await response.json();
        setJobs(result.jobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };
  
    fetchJobs();
  
    const socket = io('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000', {
      withCredentials: true
    });
  
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });
  
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });
  
    socket.on('trainingUpdate', ({ jobId, message, timestamp, status }) => {
      console.log('Received training update:', { jobId, message, timestamp, status });
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job._id === jobId
            ? {
                ...job,
                logs: [...job.logs, { timestamp: new Date(timestamp * 1000), message }],
                status: status || job.status,
              }
            : job
        )
      );
    });
    
    socket.on('trainingComplete', ({ jobId }) => {
      console.log('Training completed for job:', jobId);
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job._id === jobId
            ? { ...job, status: 'Completed', progress: 100 }
            : job
        )
      );
    });
    
    socket.on('trainingFailed', ({ jobId, error }) => {
      console.log('Training failed for job:', jobId, error);
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId 
            ? { 
                ...job, 
                status: 'Failed', 
                progress: 0,
                logs: [...job.logs, { timestamp: new Date(), message: `Training failed: ${error}` }] 
              } 
            : job
        )
      );
    });
  
    return () => {
      socket.off('trainingUpdate');
      socket.off('trainingComplete');
      socket.off('trainingFailed');
      socket.disconnect();
    };
  }, []);
  
  const handleStartTraining = async () => {
    const newJob = {
        datasetName: trainingData,
        model,
        numericalColumns,
        categoricalColumns,
        epochs,
        learningRate,
        batchSize,
        enforceMinMax,
        enforceRounding
    };

    try {
        console.log('Submitting new job:', newJob);
        const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/start-training', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(newJob)
        });

        if (response.ok) {
            const result = await response.json();
            // Optimistically update the UI, assume it will be "Not started"
            setJobs(prevJobs => [...prevJobs, { ...result.job, status: 'Not started' }]);
        } else {
            console.error('Error starting training job');
        }
    } catch (error) {
        console.error('Error starting training job:', error);
    }
};

  return (
    <Container size="" className={classes.container}>
      <Header dashboardText="TRAIN" />
      <Text className={classes.title}>Configure Training Job</Text>
      <Text className={classes.subtitle}>
        Select your dataset, model, and configure training parameters below.
      </Text>

      <Grid gutter="lg">
        <Grid.Col span={6}>
          <Paper shadow="sm" radius="md" withBorder className={classes.paper}>
            <Stack>
              <Select
                label="Select Training Data"
                placeholder="Select Training Data"
                data={datasets.map(dataset => dataset.name)}
                value={trainingData}
                onChange={setTrainingData}
              />
              <Select
                label="Select Model"
                placeholder="Select Model"
                // Put model names here
                data={['MODEL1', 'MODEL2', 'MODEL3']}
                value={model}
                onChange={setModel}
              />
              <MultiSelect
                label="Numerical Columns"
                placeholder="Select Numerical Columns"
                data={availableNumericalColumns.map(col => ({ value: col, label: col }))}
                value={numericalColumns}
                onChange={handleNumericalColumnsChange}
                searchable
                clearable
              />
              <MultiSelect
                label="Categorical Columns"
                placeholder="Select Categorical Columns"
                data={availableCategoricalColumns.map(col => ({ value: col, label: col }))}
                value={categoricalColumns}
                onChange={handleCategoricalColumnsChange}
                searchable
                clearable
              />
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper shadow="sm" radius="md" withBorder className={classes.paper}>
            <Stack>
              <TextInput
                label="Epochs"
                placeholder="100"
                type="number"
                value={epochs}
                onChange={(event) => setEpochs(parseInt(event.currentTarget.value))}
              />
              <TextInput
                label="Learning Rate"
                placeholder="0.001"
                type="number"
                step="0.0001"
                value={learningRate}
                onChange={(event) => setLearningRate(parseFloat(event.currentTarget.value))}
              />
              <TextInput
                label="Batch Size"
                placeholder="100"
                type="number"
                value={batchSize}
                onChange={(event) => setBatchSize(parseInt(event.currentTarget.value))}
              />
              <Checkbox
                label="Enforce Min Max Values"
                checked={enforceMinMax}
                onChange={(event) => setEnforceMinMax(event.currentTarget.checked)}
              />
              <Checkbox
                label="Enforce Rounding"
                checked={enforceRounding}
                onChange={(event) => setEnforceRounding(event.currentTarget.checked)}
              />
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Paper shadow="sm" radius="md" withBorder className={classes.paper} mt="lg">
        <Text weight={500} className={classes.sectionTitle}>
          Configuration Summary
        </Text>
        <Grid columns={24}>
          <Grid.Col span={12}>
            <Stack spacing="xs">
              <Text>
                <strong>Training Data:</strong> {trainingData || 'Not selected'}
              </Text>
              <Text>
                <strong>Model:</strong> {model || 'Not selected'}
              </Text>
              <Text>
                <strong>Numerical Columns:</strong>{' '}
                {numericalColumns.length > 0 ? numericalColumns.join(', ') : 'None selected'}
              </Text>
              <Text>
                <strong>Categorical Columns:</strong>{' '}
                {categoricalColumns.length > 0 ? categoricalColumns.join(', ') : 'None selected'}
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={12}>
            <Stack spacing="xs">
              <Text>
                <strong>Epochs:</strong> {epochs}
              </Text>
              <Text>
                <strong>Learning Rate:</strong> {learningRate}
              </Text>
              <Text>
                <strong>Batch Size:</strong> {batchSize}
              </Text>
              <Text>
                <strong>Enforce Min Max Values:</strong> {enforceMinMax ? 'Yes' : 'No'}
              </Text>
              <Text>
                <strong>Enforce Rounding:</strong> {enforceRounding ? 'Yes' : 'No'}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      <Button
        fullWidth
        mt="md"
        size="lg"
        className={classes.startButton}
        onClick={handleStartTraining}
      >
        <Group spacing="xs">
          <IconPlayerPlay size={20} />
          <span>Start Training</span>
        </Group>
      </Button>

      <Paper shadow="sm" radius="md" withBorder className={`${classes.paper} ${classes.trainingProgressPaper}`} mt="lg">
  <Box className={classes.stickyHeader}>
    <Text weight={500} className={classes.sectionTitle}>
      Training Progress
    </Text>
  </Box>
  {jobs.length > 0 ? (
    <Stack spacing="xl">
      {jobs.map((job) => (
        <Paper key={job._id} shadow="xs" radius="md" p="md" withBorder>
          <div>
            <Group position="apart" mb="xs">
              <Text weight={500}>{job.title}</Text>
              <Group>
                {job.status === 'In Progress' && <Loader size="sm" />}
                <Text 
                  color={
                    job.status === 'Completed' ? 'green' : 
                    job.status === 'In Progress' ? 'blue' : 
                    job.status === 'Failed' ? 'red' :
                    'gray'
                  }
                  weight={500}
                >
                  {job.status}
                </Text>
              </Group>
            </Group>
            {job.status !== 'Not started' && (
              <Accordion 
                value={openAccordions}
                onChange={setOpenAccordions}
                multiple
              >
                <Accordion.Item value={`job-${job._id}-log`}>
                  <Accordion.Control>Log Output</Accordion.Control>
                  <Accordion.Panel>
                    <ScrollArea h={200} offsetScrollbars>
                      <Code block>
                        {job.logs.map(log => `${new Date(log.timestamp).toISOString()}: ${log.message}\n`).join('')}
                      </Code>
                    </ScrollArea>
                  </Accordion.Panel>
                </Accordion.Item>
                {job.code && (
                  <Accordion.Item value={`job-${job._id}-code`}>
                    <Accordion.Control>Executed Code</Accordion.Control>
                    <Accordion.Panel>
                      <ScrollArea h={200} offsetScrollbars>
                        <Code block>{job.code}</Code>
                      </ScrollArea>
                    </Accordion.Panel>
                  </Accordion.Item>
                )}
              </Accordion>
            )}
          </div>
        </Paper>
      ))}
    </Stack>
  ) : (
    <Center style={{ height: '200px' }}>
      <Box className={classes.emptyState}>
        <IconReportAnalytics size={50} stroke={1.5} />
        <Text size="xl" weight={500} mt="md">No training jobs yet</Text>
        <Text size="sm" color="dimmed" mt="sm">Start a new training job to see progress here</Text>
      </Box>
    </Center>
  )}
</Paper>
    </Container>
  );
}
