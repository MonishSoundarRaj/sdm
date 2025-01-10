import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  SimpleGrid,
  Group,
  Stack,
  Box,
  Button,
  ThemeIcon,
  ActionIcon,
  Loader,
  TextInput,
  Radio,
  ScrollArea,
  Center,
} from '@mantine/core';
import { Flex } from '@mantine/core';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  IconTrash,
  IconRefresh,
  IconPlayerPlay,
  IconRobot,
  IconChartBar,
  IconDatabase,
  IconStack2,
  IconChevronDown,
  IconSearch,
  IconChartLine,
  IconListCheck,
  IconActivity,
  IconTable,
  IconWand,
  IconBrain,
} from '@tabler/icons-react';
import { Header } from '../Header/Header';
import { UploadButton } from '../UploadButton/UploadButton';
import { useNavigate } from 'react-router-dom';
import classes from './DashboardLayout.module.css';

const DatasetSelector = ({ datasets, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]);
  const [filteredDatasets, setFilteredDatasets] = useState(datasets);

  useEffect(() => {
    const filtered = datasets.filter(dataset =>
      dataset.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDatasets(filtered);
  }, [searchQuery, datasets]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (dataset) => {
    setSelectedDataset(dataset);
    onSelect(dataset);
    setIsOpen(false);
  };

  return (
    <Box className={classes.datasetSelector}>
      <Box onClick={handleToggle} className={classes.datasetSelectorToggle}>
        <Text className={classes.truncateText}>{selectedDataset}</Text>
        <IconChevronDown size={20} className={`${classes.chevronIcon} ${isOpen ? classes.chevronIconOpen : ''}`} />
      </Box>
      {isOpen && (
        <Box className={classes.datasetSelectorDropdown}>
          <TextInput
            icon={<IconSearch size={16} />}
            placeholder="Type a dataset"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            className={classes.datasetSearchInput}
          />
          <ScrollArea style={{ height: 200 }} className={classes.datasetList}>
            {filteredDatasets.map((dataset) => (
              <Box key={dataset} onClick={() => handleSelect(dataset)} className={classes.datasetOption}>
                <Radio
                  label={<span className={classes.truncateText}>{dataset}</span>}
                  value={dataset}
                  checked={dataset === selectedDataset}
                  onChange={() => {}}
                  className={classes.datasetRadio}
                />
              </Box>
            ))}
          </ScrollArea>
        </Box>
      )}
    </Box>
  );
};

const DataCard = ({ title, value, icon }) => {
  return (
    <Paper shadow="sm" radius="md" withBorder className={classes.dataCard}>
      {value === '0' ? (
        <div className={classes.emptyState}>
          <ThemeIcon size={40} radius={40} variant="light" color="gray" className={classes.icon}>
            {icon}
          </ThemeIcon>
          <Text className={classes.title}>{title}</Text>
          <Text className={classes.description}>{`No ${title.toLowerCase()} available yet.`}</Text>
        </div>
      ) : (
        <div>
          <Text size="sm" color="dimmed" transform="uppercase" weight={700}>
            {title}
          </Text>
          <Text className={classes.dataValue}>
            {value}
          </Text>
        </div>
      )}
    </Paper>
  );
};

const JobQueueItem = ({ job, index, onDelete }) => {
  return (
    <Group position="apart" className={classes.jobQueueItem} noWrap>
      <Group spacing="sm" noWrap style={{ maxWidth: 'calc(100% - 40px)' }}>
        <IconStack2 stroke={1.5} size={16} />
        <Text size="sm" className={classes.jobTitle}>
          {job.title}
        </Text>
      </Group>
      {index === 0 ? (
        <Loader size="sm" className={classes.actionIconRight} />
      ) : (
        <ActionIcon
          color="red"
          variant="subtle"
          className={classes.actionIconRight}
          onClick={() => onDelete(job._id)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      )}
    </Group>
  );
};

const ActivityItem = ({ icon, text }) => {
  return (
    <Group noWrap spacing="sm" mb="xs">
      <ThemeIcon size="md" radius="xl" color="blue" variant="light">
        {icon}
      </ThemeIcon>
      <Text size="sm">{text}</Text>
    </Group>
  );
};

const EmptyState = ({ icon, title, description }) => (
  <Center style={{ height: '100%', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
    <ThemeIcon size={50} radius={50} variant="light" color="gray">
      {icon}
    </ThemeIcon>
    <Text size="lg" weight={700} mt="md">{title}</Text>
    <Text size="sm" color="dimmed" mt="xs">{description}</Text>
  </Center>
);

export function DashboardLayout() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/dashboard-data', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setDashboardData(data);
      setSelectedDataset(data.datasets[0]?.name || '');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUploadSuccess = () => {
    fetchDashboardData();
  };

  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
  };

  const handleTrainingJobClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/train');
    }, 2000);
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const response = await fetch(`http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/training-job/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        console.error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const formatTooltipValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 3,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { syntheticDataName, KL_Divergence, Hellinger_Distance, modelUsed } = payload[0].payload;
      return (
        <div className={classes.customTooltip}>
          <div className={classes.customTooltipContent}>
            <p><strong>Dataset:</strong> {syntheticDataName}</p>
            <p><strong>Model:</strong> {modelUsed}</p>
            <p className={classes.intro} style={{ backgroundColor: 'rgba(255, 77, 79, 0.7)' }}>
              {`KL Divergence: ${formatTooltipValue(KL_Divergence)}`}
            </p>
            <p className={classes.intro} style={{ backgroundColor: 'rgba(24, 144, 255, 0.5)' }}>
              {`Hellinger Distance: ${formatTooltipValue(Hellinger_Distance)}`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <Loader size="xl" />;
  }

  if (!dashboardData) {
    return <Text>No data available</Text>;
  }

  return (
    <Container size="" className={classes.container}>
      <Header dashboardText="DASHBOARD" />
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="md" radius="md" p="md" withBorder className={`${classes.chartPaper} ${classes.fixedHeight}`}>
            <Flex justify="space-between" align="flex-start" className={classes.headerContainer}>
              <Title order={4}>Quick Score Check</Title>
              {dashboardData.datasets.length > 0 && (
                <Flex justify="flex-end" align="flex-start" style={{ flex: 1 }}>
                  <DatasetSelector datasets={dashboardData.datasets.map(ds => ds.name)} onSelect={handleDatasetSelect} />
                </Flex>
              )}
            </Flex>
            <Box className={classes.chartContent}>
              {dashboardData.datasets.length === 0 ? (
                <EmptyState
                  icon={<IconChartLine size={30} />}
                  title="No Data Available"
                  description="Upload a dataset to view performance metrics over time."
                />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.datasets.find(ds => ds.name === selectedDataset)?.syntheticData || []}>
                    <XAxis dataKey="version" axisLine={false} tick={false} />
                    <YAxis axisLine={false} tick={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="KL_Divergence"
                      stroke="#ff4d4f"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Hellinger_Distance"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="md" radius="md" p="md" withBorder className={`${classes.jobQueuePaper} ${classes.fixedHeight}`}>
            <Group position="apart" mb="md">
              <Title order={4}>Job Queue</Title>
              <ActionIcon variant="subtle" size="lg" className={classes.actionIconRight}>
                <IconRefresh size={20} />
              </ActionIcon>
            </Group>
            <Box className={classes.jobQueueContent}>
              {dashboardData.trainingJobs.length === 0 ? (
                <EmptyState
                  icon={<IconListCheck size={30} />}
                  title="No Jobs in Queue"
                  description="Start a new training job to see it listed here."
                />
              ) : (
                <ScrollArea style={{ height: '100%' }} className={classes.jobQueueList}>
                  {dashboardData.trainingJobs.map((job, index) => (
                    <JobQueueItem key={index} job={job} index={index} onDelete={handleDeleteJob} />
                  ))}
                </ScrollArea>
              )}
            </Box>
          </Paper>
        </Grid.Col>
        <Grid.Col span={12}>
          <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'sm', cols: 1 }]} spacing="sm">
            <DataCard title="Training Data" value={dashboardData.datasets.length.toString()} icon={<IconTable size={30} />} />
            <DataCard title="Synthetic Data" value={dashboardData.recentlyGeneratedData.length.toString()} icon={<IconWand size={30} />} />
            <DataCard title="Models" value={dashboardData.modelsSave.length.toString()} icon={<IconBrain size={30} />} />
          </SimpleGrid>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
  <Paper shadow="md" radius="md" p="md" withBorder className={`${classes.activityPaper} ${classes.recentActivitiesHeight}`}>
    <Title order={4} mb="md">
      Recent Activities
    </Title>
    <Box className={classes.activityContent}>
      {dashboardData.activityLogs.length === 0 ? (
        <EmptyState
          icon={<IconActivity size={30} />}
          title="No Recent Activity"
          description="Your recent actions will be displayed here."
        />
      ) : (
        <Stack spacing="xs">
          {dashboardData.activityLogs.slice(0, 3).map((activity, index) => (
            <ActivityItem key={index} icon={<IconDatabase size={16} />} text={activity.description} />
          ))}
        </Stack>
      )}
    </Box>
  </Paper>
</Grid.Col>
<Grid.Col span={{ base: 12, md: 4 }}>
  <Paper shadow="md" radius="md" p="md" withBorder className={`${classes.actionsPaper} ${classes.quickActionsHeight}`}>
    <Title order={4} mb="md">
      Quick Actions
    </Title>
    <Box className={classes.actionContent}>
      <Stack spacing="sm">
        <UploadButton onUploadSuccess={handleUploadSuccess}/>
        <Button fullWidth size="md" variant="light" color="blue" onClick={handleTrainingJobClick}>
          <Group spacing="md">
            {loading ? <Loader size="sm" /> : <IconPlayerPlay size={20} />}
            <span>{loading ? 'Loading...' : 'Train New Job'}</span>
          </Group>
        </Button>
      </Stack>
    </Box>
  </Paper>
</Grid.Col>
      </Grid>
    </Container>
  );
}