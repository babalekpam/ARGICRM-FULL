import express from 'express';
import axios from 'axios';
import { classifyReplyForNodeCRM } from '../ai/classify.js';
const router = express.Router();

// In-memory storage for emotions when MongoDB is not available
let emotionStorage = [];
let emotionIdCounter = 1;

router.get('/', async (req, res) => {
  const pool = req.app.locals.pgPool;
  try {
    const result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pgPool;
  const { name, email, phone, company } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO contacts (name, email, phone, company) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone || null, company || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    if (err.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pgPool;
  const { id } = req.params;
  const { name, email, phone, company } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE contacts SET name = $1, email = $2, phone = $3, company = $4 WHERE id = $5 RETURNING *',
      [name, email, phone || null, company || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pgPool;
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Analyze emotion for a contact's message
router.post('/:id/analyze', async (req, res) => {
  const { message } = req.body;
  const contactId = req.params.id;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Check if contact exists
    const pool = req.app.locals.pgPool;
    const contactResult = await pool.query('SELECT * FROM contacts WHERE id = $1', [contactId]);
    
    if (contactResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    let sentiment;
    let qwenClassification;
    
    try {
      // Try to call Python Flask API for sentiment analysis
      const response = await axios.post('http://localhost:5000/api/emotion/text', 
        { text: message },
        { timeout: 5000 }
      );
      sentiment = response.data;
    } catch (apiError) {
      // Fallback to simple sentiment analysis
      sentiment = performSimpleSentimentAnalysis(message);
    }

    // Add Qwen AI reply classification
    try {
      qwenClassification = await classifyReplyForNodeCRM(message);
    } catch (qwenError) {
      qwenClassification = {
        classification: 'negative',
        score: 20,
        summary: 'AI classification failed',
        next_action: 'add_to_nurture'
      };
    }
    
    // Store emotion log
    const emotionLog = {
      id: emotionIdCounter++,
      contactId: parseInt(contactId),
      message,
      sentiment: sentiment.sentiment || sentiment.label,
      score: sentiment.score ? Math.round(sentiment.score * 100) : 75,
      timestamp: new Date(),
    };
    
    const mongoDb = req.app.locals.mongoDb;
    if (mongoDb) {
      try {
        await mongoDb.collection('emotion_logs').insertOne(emotionLog);
      } catch (mongoError) {
        emotionStorage.push(emotionLog);
      }
    } else {
      emotionStorage.push(emotionLog);
    }
    
    res.json({
      sentiment: sentiment.sentiment || sentiment.label,
      score: sentiment.score ? Math.round(sentiment.score * 100) : 75,
      analysis: emotionLog,
      qwenAI: qwenClassification
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get emotion logs for a contact
router.get('/:id/emotions', async (req, res) => {
  const contactId = parseInt(req.params.id);
  
  try {
    const mongoDb = req.app.locals.mongoDb;
    let emotions = [];
    
    if (mongoDb) {
      try {
        emotions = await mongoDb.collection('emotion_logs')
          .find({ contactId })
          .sort({ timestamp: -1 })
          .toArray();
      } catch (mongoError) {
        emotions = emotionStorage.filter(e => e.contactId === contactId);
      }
    } else {
      emotions = emotionStorage.filter(e => e.contactId === contactId);
    }
    
    res.json(emotions);
  } catch (err) {
    console.error('Get emotions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Simple built-in sentiment analysis fallback
function performSimpleSentimentAnalysis(text) {
  const positiveWords = ['excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'outstanding', 'brilliant', 'superb', 'happy', 'satisfied', 'pleased', 'thank'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'pathetic', 'useless', 'disappointing', 'frustrated', 'angry', 'upset', 'problem', 'issue', 'broken', 'failed', 'bad'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  let sentiment, score;
  if (positiveScore > negativeScore) {
    sentiment = 'POSITIVE';
    score = 0.7 + (positiveScore * 0.1);
  } else if (negativeScore > positiveScore) {
    sentiment = 'NEGATIVE';
    score = 0.7 + (negativeScore * 0.1);
  } else {
    sentiment = 'NEUTRAL';
    score = 0.5;
  }
  
  return {
    sentiment,
    score: Math.min(score, 0.95)
  };
}

export default router;