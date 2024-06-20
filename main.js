const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// MongoDB URI
const uri = 'mongodb+srv://demo1:mN4vGFPB8froOqfp@cluster0.yr2typg.mongodb.net/demoStorage';

// MongoDB Client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Function to connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('MongoDB connected');
    return client.db('demoStorage').collection('developerDatabase');
  } catch (error) {
    console.error(error);
  }
}

// Route to get all developers
app.get('/developers', async (req, res) => {
  const collection = await connectToDatabase();
  try {
    const developers = await collection.find({}, { projection: { username: 1, email: 1 } }).toArray();
    res.json(developers);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Function to compare version strings
function isVersionGreaterOrEqual(v1, v2) {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    for (let i = 0; i < v1Parts.length; ++i) {
      if (v1Parts[i] > v2Parts[i]) return true;
      if (v1Parts[i] < v2Parts[i]) return false;
    }
    return true;
  }
  
  // Route to get a specific developer's apps and transform the response
  app.get('/developers/:email', async (req, res) => {
    const collection = await connectToDatabase();
    if (!collection) {
      return res.status(500).send('Failed to connect to the database');
    }
  
    try {
      const developer = await collection.findOne({ email: req.params.email });
      if (!developer) {
        return res.status(404).send('Developer not found');
      }
  
      const transformedResponse = {};
      developer.userapp.forEach(app => {
        transformedResponse[app.appname] = {};
        app.ver
          .filter(version => version.v && isVersionGreaterOrEqual(version.v, '1.0.0'))
          .forEach(version => {
            transformedResponse[app.appname][`version${version.v}`] = {
              githubLink: version.githublink || null,
              dockerLink: version.dockerhublink || null,
              appDescription: version.appdescription || null,
              approvedStatus:version.approvedStatus || null
            };
          });
      });
  
      res.json(transformedResponse);
    } catch (error) {
      console.error('Error fetching developer:', error);
      res.status(500).send(error);
    }
  });
  

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));