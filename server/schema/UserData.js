const mongoose = require('mongoose');

const syntheticDataSchema = new mongoose.Schema({
  original_dataset: String,
  syntheticDataName: String,
  modelUsed: String,
  filePath: String,
  KL_Divergence: Number,
  Hellinger_Distance: Number,
  seed: Number,
  rows: Number,
});

const recentlyGeneratedDataSchema = new mongoose.Schema({
  original_dataset: String,
  syntheticDataName: String,
  modelUsed: String,
  filePath: String,
  KL_Divergence: Number,
  Hellinger_Distance: Number,
  seed: Number,
  rows: Number,
});

const recentlyGeneratedLocalDataSchema = new mongoose.Schema({
  original_dataset: String,
  syntheticDataName: String,
  modelUsed: String,
  filePath: String,
  KL_Divergence: Number,
  Hellinger_Distance: Number,
  seed: Number,
  rows: Number,
});

const datasetSchema = new mongoose.Schema({
  name: String,
  description: String,
  uploadedAt: { type: Date, default: Date.now },
  filePath: String,
  metadata: {
    rows: Number,
    columns: Number,
    dataTypes: [String],
    columnNames: [String],
  },
  syntheticDataVersionNumber: Number,
  syntheticData: [syntheticDataSchema],
  recentlyGeneratedLocalData: [recentlyGeneratedLocalDataSchema],
});

const trainingJobSchema = new mongoose.Schema({
    title: String, 
    datasetName: String,
    model: String,
    status: String,
    progress: Number,
    numericalColumns: [String],
    categoricalColumns: [String],
    parameters: {
    epochs: Number,
    learningRate: Number,
    batchSize: Number,
    enforceMinMax: Boolean,
    enforceRounding: Boolean,
    },
  logs: [
    {
      timestamp: { type: Date, default: Date.now },
      message: String,
    },
  ],
  code: String,
});

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  time: { type: Date, default: Date.now },
});

const activityLogSchema = new mongoose.Schema({
  activityType: String,
  description: String,
  timestamp: { type: Date, default: Date.now },
});

const jobQueueSchema = new mongoose.Schema({
  jobId: String, 
  status: String,
  queuedAt: { type: Date, default: Date.now },
});

const modelSaveSchema = new mongoose.Schema({
  name: String,
  description: String,
  filePath: String,
  datasetName: String,
  modelName: String, 
  parameters: {
    epochs: Number,
    learningRate: Number,
    batchSize: Number,
    enforceMinMaxValues: Boolean,
    enforceRounding: Boolean,
  },
});

const userDataSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  datasets: [datasetSchema],
  trainingJobs: [trainingJobSchema],
  notifications: [notificationSchema],
  activityLogs: [activityLogSchema],
  jobQueue: [jobQueueSchema],
  modelsSave: [modelSaveSchema],
  recentlyGeneratedData: [recentlyGeneratedDataSchema],
});

const UserData = mongoose.model('UserData', userDataSchema);

module.exports = UserData;