import React, { useState, useMemo } from 'react';
import { Container, Title, Text, Paper, Grid, Stack, RingProgress } from '@mantine/core';
import Plot from 'react-plotly.js';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import classes from './ReportLayout.module.css';
import { Header } from '../Header/Header';


const generateHeatmapData = () => {
  const data = [];
  for (let i = 0; i < 10; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push(Math.random());
    }
    data.push(row);
  }
  return data;
};

const generateTableData = () => {
  const data = [];
  for (let i = 0; i < 100; i++) {
    data.push({
      id: i + 1,
      name: `Person ${i + 1}`,
      age: Math.floor(Math.random() * 50) + 20,
      income: Math.floor(Math.random() * 100000) + 30000,
    });
  }
  return data;
};

const syntheticDataInfo = {
  title: 'Customer Purchase Behavior',
  originalDataset: 'retail_transactions.csv',
  model: 'GAN (Generative Adversarial Network)',
  trainingTime: '2 hours 15 minutes',
  klScore: 0.92,
  hellingerScore: 0.88,
};

const generateSyntheticData = (realData) => {
  return realData.map(value => value + (Math.random() * 0.1 * value - 0.05 * value));
};

export function ReportLayout() {
  const [tableData] = useState(generateTableData());

  const columns = useMemo(() => [
    { headerName: 'ID', field: 'id' },
    { headerName: 'Name', field: 'name' },
    { headerName: 'Age', field: 'age' },
    { headerName: 'Income', field: 'income', valueFormatter: params => `$${params.value.toLocaleString()}` },
  ], []);

  const realData = generateHeatmapData();
  const syntheticData = generateHeatmapData();
  const diffData = realData.map((row, i) => row.map((val, j) => val - syntheticData[i][j]));

  const numericColumns = columns.filter(col => col.field !== 'name' && col.field !== 'id').map(col => col.field);
  
  const plotData = numericColumns.map(column => {
    const realValues = tableData.map(d => d[column]);
    const syntheticValues = generateSyntheticData(realValues);
    return { column, realValues, syntheticValues };
  });

  return (
    <Container size="" p="md" className={classes.container}>
      <Header dashboardText="Synthetic Data" />
      <Title order={2} size="h1" mb="lg">Synthetic Data Preview Report</Title>
      
      <Paper shadow="sm" p="xl" mb="xl">
        <Grid>
          <Grid.Col span={6}>
            <Stack>
              <Title order={3} size="h2">{syntheticDataInfo.title}</Title>
              <Text size="lg"><strong>Model:</strong> {syntheticDataInfo.model}</Text>
              <Text size="lg"><strong>Original Dataset:</strong> {syntheticDataInfo.originalDataset}</Text>
              <Text size="lg"><strong>Training Time:</strong> {syntheticDataInfo.trainingTime}</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={3}>
            <Stack align="center" justify="center" h="100%">
              <RingProgress
                size={180}
                thickness={16}
                roundCaps
                sections={[{ value: syntheticDataInfo.klScore * 100, color: 'blue' }]}
                label={
                  <Text size="xl" align="center" weight={700}>
                    {syntheticDataInfo.klScore}
                    <Text size="sm" align="center">KL Score</Text>
                  </Text>
                }
              />
            </Stack>
          </Grid.Col>
          <Grid.Col span={3}>
            <Stack align="center" justify="center" h="100%">
              <RingProgress
                size={180}
                thickness={16}
                roundCaps
                sections={[{ value: syntheticDataInfo.hellingerScore * 100, color: 'green' }]}
                label={
                  <Text size="xl" align="center" weight={700}>
                    {syntheticDataInfo.hellingerScore}
                    <Text size="sm" align="center">Hellinger Score</Text>
                  </Text>
                }
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      <Paper shadow="sm" p="xl" mb="xl">
        <Title order={3} size="h2" mb="md">Data Preview</Title>
        <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
          <AgGridReact
            rowData={tableData}
            columnDefs={columns}
            pagination={true}
            paginationPageSize={10}
          />
        </div>
      </Paper>

      <Paper shadow="sm" p="xl" mb="xl">
        <Title order={3} size="h2" mb="md">Data Heatmaps</Title>
        <Grid>
          <Grid.Col span={4}>
            <Plot
              data={[{ z: realData, type: 'heatmap', colorscale: 'Viridis' }]}
              layout={{ title: 'Real Data', width: 400, height: 400 }}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Plot
              data={[{ z: syntheticData, type: 'heatmap', colorscale: 'Viridis' }]}
              layout={{ title: 'Synthetic Data', width: 400, height: 400 }}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Plot
              data={[{ z: diffData, type: 'heatmap', colorscale: 'RdBu' }]}
              layout={{ title: 'Difference (Real - Synthetic)', width: 400, height: 400 }}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      <Paper shadow="sm" p="xl">
        <Title order={3} size="h2" mb="md">Feature Comparisons</Title>
        <Grid>
          {plotData.map(({ column, realValues, syntheticValues }) => (
            <Grid.Col span={6} key={column}>
              <Plot
                data={[
                  { x: realValues, type: 'histogram', name: 'Real', opacity: 0.7 },
                  { x: syntheticValues, type: 'histogram', name: 'Synthetic', opacity: 0.7 }
                ]}
                layout={{
                  title: `${column.charAt(0).toUpperCase() + column.slice(1)} Distribution`,
                  barmode: 'overlay',
                  width: 500,
                  height: 300,
                }}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
}