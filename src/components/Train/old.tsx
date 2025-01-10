import React, { useState } from 'react';
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
  Progress,
} from '@mantine/core';
import { Header } from '../Header/Header';
import classes from './TrainLayout.module.css';

export function TrainLayout() {
  const [trainingData, setTrainingData] = useState(null);
  const [model, setModel] = useState(null);
  const [numericalColumns, setNumericalColumns] = useState([]);
  const [categoricalColumns, setCategoricalColumns] = useState([]);
  const [epochs, setEpochs] = useState(10);
  const [learningRate, setLearningRate] = useState(0.001);
  const [batchSize, setBatchSize] = useState(32);
  const [shuffleData, setShuffleData] = useState(false);
  const [earlyStopping, setEarlyStopping] = useState(false);

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
                data={['Dataset 1', 'Dataset 2', 'Dataset 3']}
                value={trainingData}
                onChange={setTrainingData}
              />
              <Select
                label="Select Model"
                placeholder="Select Model"
                data={['Model 1', 'Model 2', 'Model 3']}
                value={model}
                onChange={setModel}
              />
              <MultiSelect
                label="Numerical Columns"
                placeholder="Select Numerical Columns"
                data={['column1', 'column2', 'column3']}
                value={numericalColumns}
                onChange={setNumericalColumns}
                searchable
                creatable
                getCreateLabel={(query) => `+ Add ${query}`}
              />
              <MultiSelect
                label="Categorical Columns"
                placeholder="Select Categorical Columns"
                data={['column4', 'column5', 'column6']}
                value={categoricalColumns}
                onChange={setCategoricalColumns}
                searchable
                creatable
                getCreateLabel={(query) => `+ Add ${query}`}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper shadow="sm" radius="md" withBorder className={classes.paper}>
            <Stack>
              <TextInput
                label="Epochs"
                placeholder="10"
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
                placeholder="32"
                type="number"
                value={batchSize}
                onChange={(event) => setBatchSize(parseInt(event.currentTarget.value))}
              />
              <Checkbox
                label="Shuffle Data"
                checked={shuffleData}
                onChange={(event) => setShuffleData(event.currentTarget.checked)}
              />
              <Checkbox
                label="Enable Early Stopping"
                checked={earlyStopping}
                onChange={(event) => setEarlyStopping(event.currentTarget.checked)}
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
                <strong>Shuffle Data:</strong> {shuffleData ? 'Yes' : 'No'}
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
        // onClick={handleStartTraining}
      >
        Start Training
      </Button>

      <Paper shadow="sm" radius="md" withBorder className={classes.paper} mt="lg">
        <Text weight={500} className={classes.sectionTitle}>
          Training Progress
        </Text>
        <Text>Status: Not started</Text>
        <Progress value={0} mt="xs" />
        <Text align="center" mt="sm">
          0% Complete
        </Text>
      </Paper>
    </Container>
  );
}