import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);

const app = express();

const __dirname = path.dirname(__filename);
// const __dirname = path.resolve();
app.use(express.static(path.join(__dirname+ '/build')))
app.use(bodyParser.json(),cors());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', {
      useNewUrlParser: true,
    });

    const db = client.db('my-node-react-simple-blog');

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: `Error connecting to db ${error}` });
  }
};

app.get('/api/articles', async (req, res) => {
  const client = await MongoClient.connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
  });

  const db = client.db('my-node-react-simple-blog');
  const articles = await db.collection('articles').find();
  res.status(200).send(articles);
});

app.get('/api/articles/:name', (req, res) => {
  const articleName = req.params.name;
  withDB(async (db) => {
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post('/api/articles/:name/upvote', (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updatedArticleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});
 
app.post('/api/articles/:name/add-comment', (req, res) => {
  const { userName , comment} = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ userName, comment }),
        },
      } ); 

    const updatedArticleInfo = await db
      .collection('articles')
      .findOne({name: articleName });
    res.status(200).send(updatedArticleInfo);
  }, res);
});


app.get('*' , (req , res)=>{
  res.sendFile(path.join(__dirname + '/build/index.html'))
})
app.listen(8000, () => console.log('Server is running'));
