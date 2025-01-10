require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserData = require('./schema/UserData'); 
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const http = require('http');
const { Server } = require('socket.io');

const s3 = new AWS.S3({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-2",
});

let isJobRunning = false;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "http://ec2-3-230-142-41.compute-1.amazonaws.com:5173", 
      methods: ["GET", "POST"],
      credentials: true
    }
  });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = '';

const MONGO_URI = '';

mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use(cors({
  origin: 'http://ec2-3-230-142-41.compute-1.amazonaws.com:5173',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('dev'));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

async function removeJobFromQueue(jobQueueItem) {
  try {
      const result = await UserData.updateOne(
          { 'jobQueue._id': jobQueueItem._id },
          { $pull: { jobQueue: { _id: jobQueueItem._id } } }
      );
      // console.log("Job removed. Current jobQueue after removal:", result);
  } catch (error) {
      console.error('Error removing job from queue:', error);
  }
}

async function monitorTrainingJobs() {
  if (isJobRunning) {
      console.log("A job is already running. Waiting for it to complete.");
      return;
  }

  try {
      const userData = await UserData.findOne({
          'trainingJobs.status': 'Not started'
      }).sort({ 'trainingJobs.createdAt': 1 }).exec();

      if (userData) {
          const jobToStart = userData.trainingJobs.find(job => job.status === 'Not started');

          if (jobToStart) {
              // console.log(`Starting job: ${jobToStart.title}`);
              isJobRunning = true; 
              await startTraining(jobToStart); 
          }
      } else {
          console.log("No pending jobs found.");
      }
  } catch (error) {
      console.error("Error in monitorTrainingJobs:", error);
  }
}

async function startTraining(job) {
  console.log("startTraining called for job:", job.title);

  const { datasetName, model, title: modelName, parameters } = job;
  const modelFileName = `${modelName}.pkl`;
  const pythonScriptPath = path.join(__dirname, 'pythonScripts', 'train.py');
  const tempDir = path.join(__dirname, 'temp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const userData = await UserData.findOne({ 'datasets.name': datasetName });

  if (!userData) {
    throw new Error(`Dataset ${datasetName} not found`);
  }

  const dataset = userData.datasets.find(d => d.name === datasetName);
  const datasetFilePath = dataset.filePath;

  const s3Url = new URL(datasetFilePath);
  const bucketName = s3Url.hostname.split('.')[0];
  const fileKey = s3Url.pathname.slice(1);

  const localDatasetPath = path.join(tempDir, path.basename(fileKey));

  const downloadParams = {
    Bucket: bucketName,
    Key: fileKey,
  };

  // console.log(`Downloading file from S3: ${bucketName}/${fileKey}`);
  // console.log(`Local dataset path: ${localDatasetPath}`);

  const fileStream = fs.createWriteStream(localDatasetPath);
  s3.getObject(downloadParams).createReadStream().pipe(fileStream);

  fileStream.on('error', (error) => {
    console.error(`Error writing to file: ${error}`);
  });

  fileStream.on('close', async () => {
    // console.log(`File download complete. File size: ${fs.statSync(localDatasetPath).size} bytes`);

    await UserData.updateOne(
      { 'trainingJobs._id': job._id },
      {
        $set: {
          'trainingJobs.$.status': 'In Progress',
        }
      }
    );

    const modelPath = path.join(tempDir, modelFileName);

    // console.log(`Starting Python process with args:`, [
    //   pythonScriptPath,
    //   localDatasetPath,
    //   model,
    //   JSON.stringify(parameters),
    //   modelPath,
    //   modelFileName,
    //   job._id.toString(),
    //   `http://localhost:${PORT}`
    // ]);

    const pythonProcess = spawn(PYTHON_PATH, [
      pythonScriptPath,
      localDatasetPath,
      model,
      JSON.stringify(parameters),
      modelPath,
      modelFileName,
      job._id.toString(),
      `http://ec2-3-230-142-41.compute-1.amazonaws.com:5000`
    ]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
      // console.log(`Python process exited with code ${code}`);

      try {
        if (code === 0) {
          // console.log("Training completed successfully");

          const modelUploadParams = {
            Bucket: "dataset-bucket-gendm",
            Key: `models/${modelFileName}`,
            Body: fs.createReadStream(modelPath),
          };

          const modelUploadResult = await s3.upload(modelUploadParams).promise();
          const modelFileUrl = modelUploadResult.Location;

          const modelSave = {
            name: modelName,
            description: `${model} model for ${datasetName}`,
            datasetName: datasetName,
            parameters,
            filePath: modelFileUrl,
            modelName: model,
          };

          const notification = {
            title: 'Training Completed',
            message: `Training of ${modelName} has successfully completed.`,
            time: new Date(),
          };

          await UserData.updateOne(
            { 'trainingJobs._id': job._id },
            {
              $set: {
                'trainingJobs.$.status': 'Completed',
                'trainingJobs.$.progress': 100,
              },
              $push: { modelsSave: modelSave, notifications: notification },
            }
          );

          io.emit('trainingComplete', { jobId: job._id.toString() });
          // console.log(`Emitted trainingComplete event for job ${job._id}`);
        } else {
          console.error(`Training failed with exit code ${code}`);
          const notification = {
            title: 'Training Failed',
            message: `Training for ${modelName} on dataset ${datasetName} has Failed.`,
            time: new Date(),
          };

          await UserData.updateOne(
            { 'trainingJobs._id': job._id },
            {
              $set: {
                'trainingJobs.$.status': 'Failed',
                'trainingJobs.$.progress': 0,
              },
              $push: { notifications: notification },
            }
          );

          io.emit('trainingFailed', { jobId: job._id.toString(), error: `Process exited with code ${code}` });
        }
      } catch (error) {
        console.error('Error in job completion handling:', error);
      } finally {
        try {
          if (fs.existsSync(localDatasetPath)) {
            fs.unlinkSync(localDatasetPath);
            // console.log(`Deleted temporary dataset file: ${localDatasetPath}`);
          }
        } catch (error) {
          console.error('Error deleting local dataset:', error);
        }

        try {
          if (fs.existsSync(modelPath)) {
            fs.unlinkSync(modelPath);
            // console.log(`Deleted temporary model file: ${modelPath}`);
          }
        } catch (error) {
          console.error('Error deleting model file:', error);
        }

        isJobRunning = false;
        // console.log("Set isJobRunning to false. Scheduling next job check.");
        setTimeout(monitorTrainingJobs, 1000);
      }
    });
  });
}

app.delete('/api/training-job/:jobId', authenticateJWT, async (req, res) => {
  const { jobId } = req.params;

  try {
    const userData = await UserData.findOne({ email: req.user.email });
    
    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    const jobIndex = userData.trainingJobs.findIndex(job => job._id.toString() === jobId);

    if (jobIndex === -1) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (jobIndex === 0) {
      return res.status(400).json({ message: 'Cannot delete the first job in the queue' });
    }

    userData.trainingJobs.splice(jobIndex, 1);
    await userData.save();

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job', error });
  }
});

app.post('/api/start-training', authenticateJWT, async (req, res) => {
  const { datasetName, model, numericalColumns, categoricalColumns, epochs, learningRate, batchSize, enforceMinMax, enforceRounding } = req.body;

  try {
    const userData = await UserData.findOne({ email: req.user.email });
    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    const jobName = generateJobName(model, datasetName);
    
    const newJob = {
      title: jobName,  
      datasetName,
      model,
      status: 'Not started',
      progress: 0,
      numericalColumns,
      categoricalColumns,
      parameters: {
        epochs,
        learningRate,
        batchSize,
        enforceMinMax,
        enforceRounding,
      },
      logs: [],
      code: '',
    };
    
    userData.trainingJobs.push(newJob);

    await userData.save();

    // console.log("New training job added:", newJob);

    const activityLogs = {
      activityType: 'Training Started',
      description: `Started training: ${model} with ${datasetName} dataset.`,
      timestamp: new Date(),
    };

    await UserData.updateOne(
      { email: req.user.email },
      {
        $push: { activityLogs: activityLogs },
      }
    );

    res.status(201).json({ message: 'Training job created successfully', job: newJob });

    monitorTrainingJobs();
  } catch (error) {
    console.error('Error starting training job:', error);
    res.status(500).json({ message: 'Error starting training job', error });
  }
});


setInterval(() => {
  if (!isJobRunning) {
    monitorTrainingJobs();
  }
}, 30 * 1000);

monitorTrainingJobs();


function generateJobName(model, datasetName) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  return `${model}_${datasetName}_${timestamp}`;
}

app.get('/api/get-models-and-data', authenticateJWT, async (req, res) => {
  try {
    const userData = await UserData.findOne({ email: req.user.email });

    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }
    // console.log('User Data:', userData);

    // console.log('Models Save:', userData.modelsSave);

    const models = userData.modelsSave.map(model => model.name);
    // console.log('Mapped Models:', models);

    const recentlyGeneratedData = userData.recentlyGeneratedData;

    res.status(200).json({ models, recentlyGeneratedData });
  } catch (error) {
    console.error('Error fetching models and data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/api/notifications', authenticateJWT, async (req, res) => {
  try {
    const userData = await UserData.findOne({ email: req.user.email });

    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    const notifications = userData.notifications.slice(-10).reverse(); 
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.post('/api/generate-data', authenticateJWT, async (req, res) => {
  const { model, seed, rows } = req.body;

  try {
    const userData = await UserData.findOne({ email: req.user.email });

    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    const modelData = userData.modelsSave.find(m => m.name === model);

    if (!modelData) {
      return res.status(404).json({ message: 'Model not found' });
    }

    const datasetName = modelData.datasetName;
    const dataset = userData.datasets.find(d => d.name === datasetName);

    if (!dataset) {
      // console.log("Dataset not found");
      return res.status(404).json({ message: 'Original dataset not found' });
    }

    const activityLogs = {
      activityType: 'Generation Started',
      description: `Started generating synthetic data: with ${model} for ${rows} rows.`,
      timestamp: new Date(),
    };

    await UserData.updateOne(
      { email: req.user.email },
      {
        $push: { activityLogs: activityLogs },
      }
    );

    const versionNumber = dataset.syntheticDataVersionNumber || 0;
    const syntheticDataName = `syn_${dataset.name}_${versionNumber + 1}`;
    const datasetFilePath = dataset.filePath;
    const s3Url = new URL(datasetFilePath);
    const bucketName = s3Url.hostname.split('.')[0];
    const fileKey = s3Url.pathname.slice(1);

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const localDatasetPath = path.join(tempDir, path.basename(fileKey));
    const modelPath = path.join(tempDir, path.basename(modelData.filePath));
    const outputPath = path.join(tempDir, `${syntheticDataName}.csv`);
    const modelName = modelData.modelName;

    const downloadParamsDataset = {
      Bucket: bucketName,
      Key: fileKey,
    };

    const downloadParamsModel = {
      Bucket: "dataset-bucket-gendm",
      Key: `models/${modelData.filePath.split('/').pop()}`,
    };

    const fileStreamDataset = fs.createWriteStream(localDatasetPath);
    s3.getObject(downloadParamsDataset).createReadStream().pipe(fileStreamDataset);

    fileStreamDataset.on('error', (error) => {
      console.error(`Error writing dataset to file: ${error}`);
      return res.status(500).json({ message: 'Error downloading dataset' });
    });

    fileStreamDataset.on('close', async () => {
      // console.log(`Dataset download complete. File size: ${fs.statSync(localDatasetPath).size} bytes`);

      const fileStreamModel = fs.createWriteStream(modelPath);
      s3.getObject(downloadParamsModel).createReadStream().pipe(fileStreamModel);

      fileStreamModel.on('error', (error) => {
        console.error(`Error writing model to file: ${error}`);
        return res.status(500).json({ message: 'Error downloading model' });
      });

      fileStreamModel.on('close', async () => {
        // console.log(`Model download complete. File size: ${fs.statSync(modelPath).size} bytes`);

        const pythonScriptPath = path.join(__dirname, 'pythonScripts', 'generate.py');

        const pythonProcess = spawn(PYTHON_PATH, [
          pythonScriptPath,
          localDatasetPath,
          modelPath,
          rows,
          outputPath,
          modelName
        ]);

        let responseSent = false;

        pythonProcess.stdout.on('data', async (data) => {
          if (responseSent) return;

          try {
            const generatedData = JSON.parse(data.toString());

            const fileContent = fs.readFileSync(outputPath);
            const s3UploadParams = {
              Bucket: "dataset-bucket-gendm",
              Key: `synthetic-data/${syntheticDataName}.csv`,
              Body: fileContent
            };

            const s3UploadResult = await s3.upload(s3UploadParams).promise();
            const s3FilePath = s3UploadResult.Location;

            const newGeneratedData = {
              original_dataset: dataset.name,
              syntheticDataName: syntheticDataName,
              modelUsed: model,
              filePath: s3FilePath,
              KL_Divergence: generatedData.KL_Divergence,
              Hellinger_Distance: generatedData.Hellinger_Distance,
              seed: seed,
              rows: rows,
            };

            const notification = {
              title: 'Generation Completed',
              message: `Generated ${syntheticDataName} with ${rows} is successfully completed.`,
              time: new Date(),
            };
            
            await UserData.updateOne(
              { 'datasets._id': dataset._id },
              {
                $push: { 'datasets.$.syntheticData': newGeneratedData, 'datasets.$.recentlyGeneratedLocalData': newGeneratedData, notifications: notification },
                $inc: { 'datasets.$.syntheticDataVersionNumber': 1 },
              }
            );

            await UserData.updateOne(
              { email: req.user.email },
              {
                $push: { recentlyGeneratedData: newGeneratedData },
              }
            );

            res.status(200).json({ message: 'Data generation completed', newGeneratedData });
            responseSent = true;
          } catch (error) {
            console.error('Error processing generated data:', error);
            res.status(500).json({ message: 'Error processing generated data' });
            responseSent = true;
          }
        });

        pythonProcess.stderr.on('data', (data) => {
          if (responseSent) return;

          console.error('Error from Python script:', data.toString());
          res.status(500).json({ message: 'Error during data generation' });
          responseSent = true;
        });

        pythonProcess.on('close', async () => {
          try {
            if (fs.existsSync(localDatasetPath)) {
              fs.unlinkSync(localDatasetPath);
              // console.log(`Deleted temporary dataset file: ${localDatasetPath}`);
            }
            if (fs.existsSync(modelPath)) {
              fs.unlinkSync(modelPath);
              // console.log(`Deleted temporary model file: ${modelPath}`);
            }
          } catch (error) {
            console.error('Error cleaning up temporary files:', error);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error starting data generation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/api/register', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const user = new User({ email, username, password });
    await user.save();

    const userData = new UserData({ email });
    await userData.save();

    const token = generateToken({ email: user.email, id: user._id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.status(201).json({ message: 'User registered and logged in successfully' });
  } catch (error) {
    if (error.code === 11000) { 
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error registering user', error });
    }
  }
});

app.post('/api/download', authenticateJWT, async (req, res) => {
  const { filePath } = req.body;

  try {
    const s3Url = new URL(filePath);
    const bucketName = s3Url.hostname.split('.')[0];
    const fileKey = s3Url.pathname.slice(1);

    const downloadParams = {
      Bucket: bucketName,
      Key: fileKey,
    };

    const fileStream = s3.getObject(downloadParams).createReadStream();

    res.setHeader('Content-Disposition', `attachment; filename="${fileKey.split('/').pop()}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    fileStream.pipe(res);
  } catch (error) {
    console.error('Error processing download request:', error);
    res.status(500).json({ message: 'Error processing download request' });
  }
});


app.get('/api/download/:datasetName', authenticateJWT, async (req, res) => {
    try {
      const { datasetName } = req.params;
      const userData = await UserData.findOne({ email: req.user.email });
      const dataset = userData.datasets.find(d => d.name === datasetName);
  
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }
  
      const fileUrl = dataset.filePath;
      
      https.get(fileUrl, (fileRes) => {
        res.setHeader('Content-Disposition', `attachment; filename="${datasetName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        fileRes.pipe(res);
      }).on('error', (err) => {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Error downloading file', error: err.message });
      });
    } catch (error) {
      console.error('Error processing download request:', error);
      res.status(500).json({ message: 'Error processing download request', error: error.message });
    }
  });
  
  app.delete('/api/datasets/:datasetName', authenticateJWT, async (req, res) => {
    try {
      const { datasetName } = req.params;
      const userData = await UserData.findOne({ email: req.user.email });
      const datasetIndex = userData.datasets.findIndex(d => d.name === datasetName);
  
      if (datasetIndex === -1) {
        return res.status(404).json({ message: 'Dataset not found' });
      }
  
      const dataset = userData.datasets[datasetIndex];
      const fileKey = dataset.filePath.split('/').slice(-2).join('/'); 
  
      await s3.deleteObject({
        Bucket: "dataset-bucket-gendm",
        Key: fileKey
      }).promise();
  
      userData.datasets.splice(datasetIndex, 1);
      await userData.save();
  
      res.json({ message: 'Dataset deleted successfully' });
    } catch (error) {
      console.error('Error deleting dataset:', error);
      res.status(500).json({ message: 'Error deleting dataset', error: error.message });
    }
  });

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ email: user.email, id: user._id });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({ message: 'Authenticated' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'This is protected data', user: req.user });
});

app.post('/api/training-update', async (req, res) => {
  const { jobId, message, timestamp } = req.body;

  try {
    const updatedJob = await UserData.findOneAndUpdate(
      { 'trainingJobs._id': jobId },
      {
        $push: {
          'trainingJobs.$.logs': {
            timestamp: new Date(timestamp * 1000),
            message: message
          }
        }
      },
      { new: true }
    );

    if (updatedJob) {
      const job = updatedJob.trainingJobs.find(job => job._id.toString() === jobId);
      io.emit('trainingUpdate', { jobId, message, timestamp });
      res.status(200).json({ message: 'Update received and processed' });
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    console.error('Error processing training update:', error);
    res.status(500).json({ message: 'Error processing update', error: error.message });
  }
});

app.get('/api/training-jobs', authenticateJWT, async (req, res) => {
    try {
        const userData = await UserData.findOne({ email: req.user.email });
        if (!userData) {
            return res.status(404).json({ message: 'User data not found' });
        }

        res.json({ jobs: userData.trainingJobs });
    } catch (error) {
        console.error('Error fetching training jobs:', error);
        res.status(500).json({ message: 'Error fetching training jobs', error });
    }
});

app.get('/api/training-options', authenticateJWT, async (req, res) => {
    try {
        const userData = await UserData.findOne({ email: req.user.email });
        if (!userData) {
            return res.status(404).json({ message: 'User data not found' });
        }

        const datasets = userData.datasets.map(dataset => ({
            name: dataset.name,
            columns: dataset.metadata.columnNames,
        }));

        res.json({ datasets });
    } catch (error) {
        console.error('Error fetching training options:', error);
        res.status(500).json({ message: 'Error fetching training options', error });
    }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

app.get('/api/dashboard-data', authenticateJWT, async (req, res) => {
  try {
      const userData = await UserData.findOne({ email: req.user.email });

      if (!userData) {
          return res.status(404).json({ message: 'User data not found' });
      }

     
      const trainingJobs = Array.isArray(userData.trainingJobs) ? userData.trainingJobs : [];

      
      // console.log('Retrieved training jobs:', trainingJobs);

     
      const filteredTrainingJobs = trainingJobs.filter(job =>
          job.status === 'In Progress' || job.status === 'Not started'
      );


      const dashboardData = {
          datasets: userData.datasets.map(dataset => ({
              name: dataset.name,
              syntheticData: dataset.syntheticData.map(sData => ({
                  syntheticDataName: sData.syntheticDataName,
                  KL_Divergence: sData.KL_Divergence,
                  Hellinger_Distance: sData.Hellinger_Distance,
                  modelUsed: sData.modelUsed,
              })),
              recentlyGeneratedData: dataset.recentlyGeneratedData,
          })),
          trainingJobs: filteredTrainingJobs,  
          notifications: userData.notifications,
          activityLogs: userData.activityLogs.slice(-3).reverse(),
          modelsSave: userData.modelsSave,
          recentlyGeneratedData: userData.recentlyGeneratedData,
      };

      res.json(dashboardData);
  } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Error fetching dashboard data', error });
  }
});


  app.post('/api/upload', authenticateJWT, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userData = await UserData.findOne({ email: req.user.email });
        const fileExists = userData.datasets.some(dataset => dataset.name === file.originalname);

        if (fileExists) {
            return res.status(409).json({ message: 'File already exists' });
        }

        const columnNames = await extractColumnNames(file.buffer);
        // console.log(columnNames);

        const uploadParams = {
            Bucket: "dataset-bucket-gendm", 
            Key: `uploads/${Date.now()}_${file.originalname}`, 
            Body: file.buffer,
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        const fileUrl = uploadResult.Location;

        const updatedUserData = await UserData.findOneAndUpdate(
            { email: req.user.email },
            {
                $push: {
                    datasets: {
                        name: file.originalname,
                        description: 'Uploaded dataset',
                        uploadedAt: new Date(),
                        filePath: fileUrl,
                        metadata: {
                            rows: 0,  
                            columns: columnNames.length,
                            dataTypes: [],  
                            columnNames: columnNames,
                        },
                        syntheticData: [],
                        recentlyGeneratedData: [],
                    },
                    activityLogs: {
                        activityType: 'Upload',
                        description: `Uploaded file: ${file.originalname}`,
                        timestamp: new Date(),
                    },
                },
            },
            { new: true, upsert: true }
        );

        res.json({ message: 'File uploaded successfully', fileUrl, userData: updatedUserData });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});


const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';

async function extractColumnNames(fileBuffer) {
    return new Promise((resolve, reject) => {
        const tempFilePath = path.join(__dirname, 'temp.csv');
        
        fs.writeFileSync(tempFilePath, fileBuffer);

        const pythonScriptPath = path.join(__dirname, 'pythonScripts', 'extract_columns.py');
        
        const pythonProcess = spawn(PYTHON_PATH, [pythonScriptPath, tempFilePath]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            reject(data.toString());
        });

        pythonProcess.on('close', (code) => {
            fs.unlinkSync(tempFilePath); 
            if (code === 0) {
                resolve(output.trim().split(','));
            } else {
                reject(`Process exited with code ${code}`);
            }
        });
    });
}

app.get('/api/userdata', authenticateJWT, async (req, res) => {
    try {
      const userData = await UserData.findOne({ email: req.user.email });
      if (!userData) {
        return res.status(404).json({ message: 'User data not found' });
      }
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user data', error });
    }
  });

app.get('/api/datasets', authenticateJWT, async (req, res) => {
try {
    const userData = await UserData.findOne({ email: req.user.email });

    if (!userData) {
    return res.status(404).json({ message: 'User data not found' });
    }

    res.json({
    datasets: userData.datasets.map(dataset => ({
        name: dataset.name,
        date: dataset.uploadedAt,
        filePath: dataset.filePath,
    })),
    });
} catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ message: 'Error fetching datasets', error });
}
});



app.get('/api/synthetic-data/:datasetName', authenticateJWT, async (req, res) => {
    const { datasetName } = req.params;
    try {
      const userData = await UserData.findOne({ email: req.user.email });
      if (!userData) {
        return res.status(404).json({ message: 'User data not found' });
      }
  
      const dataset = userData.datasets.find(d => d.name === datasetName);
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }
  
      const { syntheticData, recentlyGeneratedLocalData } = dataset;
  
      res.json({ syntheticData, recentlyGeneratedLocalData });
    } catch (error) {
      console.error('Error fetching synthetic data:', error);
      res.status(500).json({ message: 'Error fetching synthetic data', error });
    }
  });
  

app.post('/api/userdata/datasets', authenticateJWT, async (req, res) => {
const { dataset } = req.body;

try {
    const userData = await UserData.findOneAndUpdate(
    { email: req.user.email },
    { $push: { datasets: dataset } },
    { new: true, upsert: true }
    );
    res.json(userData);
} catch (error) {
    res.status(500).json({ message: 'Error updating user data', error });
}
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');
});

db.once('open', () => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
