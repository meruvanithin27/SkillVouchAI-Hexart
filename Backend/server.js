import express from 'express';
import cors from 'cors';
import mongoose, { connectDB } from './db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateQuiz } from './ai/mistralQuiz.js';
import { suggestSkills, generateRoadmap } from './ai/mistralSkills.js';
import { User, ExchangeRequest, ExchangeFeedback, Message, Quiz, QuizAttempt } from './models/index.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Production-ready CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://skillvouch-ai-frontend.vercel.app',
  'http://localhost:3001',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested');
  res.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    frontend: process.env.FRONTEND_URL || 'not configured'
  });
});

// Production logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Log request body for POST/PUT requests (without sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove password fields from logs
    if (sanitizedBody.password) delete sanitizedBody.password;
    if (sanitizedBody.confirmPassword) delete sanitizedBody.confirmPassword;
    console.log(`[${timestamp}] Request body:`, sanitizedBody);
  }
  
  next();
});

// Environment validation
console.log('🔍 Environment Variables Check:');
console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`✅ PORT: ${PORT}`);
console.log(`✅ MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : '❌ NOT SET'}`);
console.log(`✅ JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : '❌ NOT SET'}`);
console.log(`✅ MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? 'Set' : '❌ NOT SET'}`);
console.log(`✅ FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);

// Connect to MongoDB before starting server
try {
  await connectDB();
  console.log('🚀 Database connection established, starting server...');
} catch (error) {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
}

// Helper mappers
function mapUserDoc(doc) {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    password: doc.password,
    avatar: doc.avatar,
    skillsKnown: doc.skillsKnown || [],
    skillsToLearn: doc.skillsToLearn || [],
    bio: doc.bio || '',
    discordLink: doc.discordLink,
    rating: doc.rating,
  };
}

function mapMessageDoc(doc) {
  return {
    id: doc._id,
    senderId: doc.senderId,
    receiverId: doc.receiverId,
    content: doc.content,
    timestamp: doc.timestamp,
    read: doc.read,
  };
}

// AI SQL Query Generation API
app.post('/api/ai-sql-query', async (req, res) => {
  try {
    const { userMessage } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'User message is required' });
    }

    const lowerMessage = userMessage.toLowerCase();
    let intent = '';
    let sqlQuery = 'SELECT name, course, level FROM users';
    let params = [];
    let responseText = '';

    // Parse user intent and generate SQL - use users table with skills_known JSON
    if (lowerMessage.includes('sql') && lowerMessage.includes('student')) {
      intent = 'show_sql_students';
      sqlQuery = 'SELECT name, "SQL" as course, "Intermediate" as level FROM users WHERE skills_known LIKE ? LIMIT 10';
      params = ['%"name":"SQL","verified":true%'];
      responseText = 'Finding SQL students...';
    }
    else if (lowerMessage.includes('c') && lowerMessage.includes('expert')) {
      intent = 'find_c_experts';
      sqlQuery = 'SELECT name, "C" as course, "Expert" as level FROM users WHERE skills_known LIKE ? LIMIT 10';
      params = ['%"name":"C","verified":true%'];
      responseText = 'Finding C experts...';
    }
    else if (lowerMessage.includes('python') && lowerMessage.includes('beginner')) {
      intent = 'list_python_beginners';
      sqlQuery = 'SELECT name, "Python" as course, "Beginner" as level FROM users WHERE skills_known LIKE ? LIMIT 10';
      params = ['%"name":"Python","verified":true%'];
      responseText = 'Finding Python beginners...';
    }
    else if (lowerMessage.includes('sql') && lowerMessage.includes('advanced')) {
      intent = 'get_advanced_sql_learners';
      sqlQuery = 'SELECT name, "SQL" as course, "Advanced" as level FROM users WHERE skills_known LIKE ? LIMIT 10';
      params = ['%"name":"SQL","verified":true%'];
      responseText = 'Finding Advanced SQL learners...';
    }
    else if (lowerMessage.includes('sql')) {
      intent = 'show_sql_students';
      sqlQuery = 'SELECT name, "SQL" as course, "Intermediate" as level FROM users WHERE skills_known LIKE ? LIMIT 10';
      params = ['%"name":"SQL","verified":true%'];
      responseText = 'Finding SQL students...';
    }
    else if (lowerMessage.includes('c')) {
      intent = 'show_c_students';
      sqlQuery = 'SELECT name, "C" as course, "Intermediate" as level FROM users WHERE skills_known LIKE ? LIMIT 10';
      params = ['%"name":"C","verified":true%'];
      responseText = 'Finding C students...';
    }
    else if (lowerMessage.includes('python')) {
      intent = 'show_python_students';
      sqlQuery = 'SELECT name, "Python" as course, "Intermediate" as level FROM users WHERE skills_known LIKE ? LIMIT 10';
      params = ['%"name":"Python","verified":true%'];
      responseText = 'Finding Python students...';
    }
    else if (lowerMessage.includes('all') || lowerMessage.includes('show all')) {
      intent = 'show_all_peers';
      sqlQuery = 'SELECT name, "General" as course, "Intermediate" as level FROM users LIMIT 10';
      params = [];
      responseText = 'Showing all peers...';
    }
    else {
      intent = 'unclear';
      responseText = 'Could you please specify which course (SQL, C, Python) and optionally the level (Beginner, Intermediate, Advanced, Expert) you are looking for?';
    }

    res.json({
      intent,
      sqlQuery,
      params,
      responseText
    });

  } catch (err) {
    console.error('AI SQL generation error:', err);
    res.status(500).json({ error: 'Failed to generate SQL query' });
  }
});

// SQL Query Execution API - Modified for MongoDB
app.post('/api/execute-sql', async (req, res) => {
  try {
    const { sqlQuery, params } = req.body;
    
    if (!sqlQuery) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🔍 Executing MongoDB query:', sqlQuery);

    // For MongoDB, we only support finding users (equivalent to SELECT)
    const lowerQuery = sqlQuery.toLowerCase();
    if (!lowerQuery.includes('select') && !lowerQuery.includes('find')) {
      return res.status(400).json({ error: 'Only read operations are allowed' });
    }

    // Parse skill filters from the query intent
    let results = [];
    const users = await User.find();
    
    // Simple filtering based on SQL-like intent
    if (lowerQuery.includes('sql')) {
      results = users.filter(u => u.skillsKnown?.some(s => s.name === 'SQL' && s.verified))
        .map(u => ({ name: u.name, course: 'SQL', level: 'Intermediate' }));
    } else if (lowerQuery.includes('c')) {
      results = users.filter(u => u.skillsKnown?.some(s => s.name === 'C' && s.verified))
        .map(u => ({ name: u.name, course: 'C', level: 'Intermediate' }));
    } else if (lowerQuery.includes('python')) {
      results = users.filter(u => u.skillsKnown?.some(s => s.name === 'Python' && s.verified))
        .map(u => ({ name: u.name, course: 'Python', level: 'Intermediate' }));
    } else {
      results = users.slice(0, 10).map(u => ({ name: u.name, course: 'General', level: 'Intermediate' }));
    }

    console.log('📊 Results:', results.length);

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (err) {
    console.error('Query execution error:', err);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

// Peer Recommendations API
app.post('/api/peer-recommendations', async (req, res) => {
  try {
    const { userId, skillsToLearn } = req.body;
    
    console.log('🔍 Peer recommendation request:', { userId, skillsToLearn });
    
    if (!userId || !skillsToLearn || !Array.isArray(skillsToLearn)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const results = [];
    
    // For each requested skill, find users with that verified skill
    for (const skill of skillsToLearn) {
      console.log(`🔍 Searching for users with verified ${skill}...`);
      
      // MongoDB query to find users with specific verified skill
      const users = await User.find({
        _id: { $ne: userId },
        skillsKnown: {
          $elemMatch: {
            name: skill,
            verified: true
          }
        }
      });
      
      console.log(`📊 Found ${users.length} users with ${skill}`);
      
      for (const user of users) {
        // Get exact skill details
        const verifiedSkill = user.skillsKnown.find(s => s.name === skill && s.verified === true);
        
        if (verifiedSkill) {
          console.log(`✅ Match: ${user.name} has verified ${skill}`);
          
          // Check if user already added
          if (!results.find(r => r.peerId === user._id)) {
            results.push({
              peerId: user._id,
              name: user.name,
              verifiedSkill: skill,
              skillLevel: verifiedSkill.level || 'Intermediate',
              experienceYears: verifiedSkill.experienceYears || 0,
              rating: user.rating,
              availability: verifiedSkill.availability || []
            });
          }
        }
      }
    }

    console.log(`🎯 Total unique matches: ${results.length}`);
    console.log('📋 Final results:', results.map(p => p.name));

    // Sort by rating
    results.sort((a, b) => b.rating - a.rating);

    res.json({
      requestedSkills: skillsToLearn,
      verifiedPeers: results.slice(0, 5),
      message: results.length > 0 
        ? `${results.length} verified peers found.`
        : 'No verified peers are currently available for requested skills.'
    });

  } catch (err) {
    console.error('❌ Peer recommendations error:', err);
    res.status(500).json({ error: 'Failed to get peer recommendations' });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users.map(mapUserDoc));
  } catch (err) {
    console.error('GET /api/users error', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(mapUserDoc(user));
  } catch (err) {
    console.error('GET /api/users/:id error', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const id = req.params.id;
  const userData = req.body || {};

  try {
    // Check if email already exists (for new signups)
    const existingUserByEmail = await User.findOne({ email: userData.email });
    if (existingUserByEmail && existingUserByEmail._id !== id) {
      return res.status(409).json({ error: 'User with this email already exists. Please sign in instead.' });
    }

    // Get current user to detect new skills
    const currentUser = await User.findById(id);
    const currentSkills = currentUser?.skillsKnown || [];

    console.log('📥 Received skillsKnown:', JSON.stringify(userData.skillsKnown));
    console.log('📥 Received skillsToLearn:', JSON.stringify(userData.skillsToLearn));

    const updateData = {
      _id: id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      avatar: userData.avatar,
      bio: userData.bio || '',
      discordLink: userData.discordLink,
      skillsKnown: (userData.skillsKnown || []).map(skill => ({
        name: skill.name,
        level: skill.level || 'Beginner',
        verified: skill.verified === true ? true : false, // Explicitly set verified
        experienceYears: skill.experienceYears || 0,
        availability: skill.availability || []
      })),
      skillsToLearn: (userData.skillsToLearn || []).map(skill => ({
        name: skill.name,
        level: skill.level || 'Beginner',
        priority: skill.priority || 'medium'
      })),
      rating: userData.rating || 0,
      learningHours: currentUser?.learningHours || 0,
      weeklyActivity: currentUser?.weeklyActivity || 0
    };

    console.log('💾 Saving skillsKnown:', JSON.stringify(updateData.skillsKnown));
    console.log('💾 Saving skillsToLearn:', JSON.stringify(updateData.skillsToLearn));

    // Upsert user
    const user = await User.findOneAndUpdate(
      { _id: id },
      updateData,
      { upsert: true, new: true }
    );

    // Generate quizzes for new skills
    const newSkills = userData.skillsKnown || [];
    const currentSkillNames = currentSkills.map(skill => skill.name);
    
    for (const skill of newSkills) {
      if (!currentSkillNames.includes(skill.name)) {
        try {
          // Generate quiz for this skill
          const quizQuestions = await generateQuiz(skill.name, 'beginner', 10);
          
          console.log(`Generated quiz for new skill: ${skill.name}`);
        } catch (quizError) {
          console.error(`Failed to generate quiz for skill ${skill.name}:`, quizError);
          // Continue with other skills even if one fails
        }
      }
    }

    res.json(mapUserDoc(user));
  } catch (err) {
    console.error('PUT /api/users/:id error', err);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Get quizzes for a user (simplified - returns all quizzes)
app.get('/api/quizzes/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Exchange Requests
app.post('/api/requests', async (req, res) => {
  const r = req.body || {};
  try {
    const request = new ExchangeRequest({
      _id: r.id || crypto.randomUUID(),
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      offeredSkill: r.offeredSkill,
      requestedSkill: r.requestedSkill,
      message: r.message,
      status: r.status || 'pending',
      createdAt: r.createdAt || Date.now(),
      completedAt: r.completedAt || null,
    });
    await request.save();
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('POST /api/requests error', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

app.get('/api/requests', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  try {
    const requests = await ExchangeRequest.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('GET /api/requests error', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.put('/api/requests/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};

  const allowed = new Set(['pending', 'accepted', 'rejected', 'completed']);
  if (!allowed.has(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const completedAt = status === 'completed' ? Date.now() : null;
    await ExchangeRequest.findOneAndUpdate(
      { _id: id },
      { status, completedAt },
      { new: true }
    );
    res.json({ success: true, status, completedAt: completedAt || undefined });
  } catch (err) {
    console.error('PUT /api/requests/:id/status error', err);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

// Exchange feedback
app.post('/api/feedback', async (req, res) => {
  const f = req.body || {};
  const stars = Number(f.stars);
  if (!f.requestId || !f.fromUserId || !f.toUserId) {
    return res.status(400).json({ error: 'requestId, fromUserId, and toUserId are required' });
  }
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'stars must be between 1 and 5' });
  }

  try {
    const id = f.id || crypto.randomUUID();
    const createdAt = f.createdAt || Date.now();

    // Upsert feedback
    await ExchangeFeedback.findOneAndUpdate(
      { requestId: f.requestId, fromUserId: f.fromUserId },
      {
        _id: id,
        requestId: f.requestId,
        fromUserId: f.fromUserId,
        toUserId: f.toUserId,
        stars,
        comment: f.comment || null,
        createdAt
      },
      { upsert: true, new: true }
    );

    // Keep user's rating in sync with feedback received.
    const avgResult = await ExchangeFeedback.aggregate([
      { $match: { toUserId: f.toUserId } },
      { $group: { _id: null, avgStars: { $avg: '$stars' } } }
    ]);
    const avgStars = avgResult.length > 0 ? avgResult[0].avgStars : 0;
    await User.findOneAndUpdate({ _id: f.toUserId }, { rating: avgStars });

    res.status(201).json({ id, requestId: f.requestId, fromUserId: f.fromUserId, toUserId: f.toUserId, stars, comment: f.comment || undefined, createdAt });
  } catch (err) {
    console.error('POST /api/feedback error', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

app.get('/api/feedback/received', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  try {
    const feedbacks = await ExchangeFeedback.find({ toUserId: userId }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error('GET /api/feedback/received error', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

app.get('/api/feedback/stats', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  try {
    const result = await ExchangeFeedback.aggregate([
      { $match: { toUserId: userId } },
      { $group: { _id: null, avgStars: { $avg: '$stars' }, count: { $sum: 1 } } }
    ]);
    const avgStars = result.length > 0 ? result[0].avgStars : 0;
    const count = result.length > 0 ? result[0].count : 0;
    res.json({ avgStars, count });
  } catch (err) {
    console.error('GET /api/feedback/stats error', err);
    res.status(500).json({ error: 'Failed to fetch feedback stats' });
  }
});

// Messages
app.post('/api/messages', async (req, res) => {
  const m = req.body || {};
  try {
    const message = new Message({
      _id: m.id || crypto.randomUUID(),
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      timestamp: m.timestamp || Date.now(),
      read: m.read || false
    });
    await message.save();

    res.status(201).json({
      id: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      timestamp: message.timestamp,
      read: message.read,
    });
  } catch (err) {
    console.error('POST /api/messages error', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/messages/conversation', async (req, res) => {
  const { user1Id, user2Id } = req.query;
  if (!user1Id || !user2Id) {
    return res.status(400).json({ error: 'user1Id and user2Id query params required' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages.map(mapMessageDoc));
  } catch (err) {
    console.error('GET /api/messages/conversation error', err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

app.get('/api/messages/unread-count', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  try {
    const count = await Message.countDocuments({ receiverId: userId, read: false });
    res.json({ count });
  } catch (err) {
    console.error('GET /api/messages/unread-count error', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

app.post('/api/messages/mark-as-read', async (req, res) => {
  const { userId, senderId } = req.body || {};
  if (!userId || !senderId) {
    return res.status(400).json({ error: 'userId and senderId required' });
  }

  try {
    await Message.updateMany(
      { receiverId: userId, senderId: senderId, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/messages/mark-as-read error', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Conversations (list of users this user has chatted with)
app.get('/api/conversations', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    if (messages.length === 0) return res.json([]);

    const otherUserIds = [...new Set(
      messages.map(m => m.senderId === userId ? m.receiverId : m.senderId)
    )];

    const users = await User.find({ _id: { $in: otherUserIds } });
    res.json(users.map(mapUserDoc));
  } catch (err) {
    console.error('GET /api/conversations error', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

async function openRouterChatCompletions({ model, messages, max_tokens = 2048, temperature = 0.7, seed }) {
  const baseUrl = process.env.LLAMA_API_URL || 'https://openrouter.ai/api/v1';
  const apiKey = process.env.LLAMA_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OpenRouter API key in backend environment');

  const referer = process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:3000';
  const title = process.env.OPENROUTER_APP_TITLE || 'SkillVouch AI';

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': referer,
      'X-Title': title,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
      ...(typeof seed === 'number' ? { seed } : {}),
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenRouter error: ${resp.status} ${resp.statusText}${text ? ` - ${text}` : ''}`);
  }
  return resp.json();
}

function parseJsonFromModelContent(content) {
  if (!content) throw new Error('Empty model response');
  const cleaned = content.replace(/```json\n?|```/g, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to extracting the first JSON array/object block
    const firstArray = cleaned.indexOf('[');
    const lastArray = cleaned.lastIndexOf(']');
    if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
      const slice = cleaned.slice(firstArray, lastArray + 1);
      return JSON.parse(slice);
    }

    const firstObj = cleaned.indexOf('{');
    const lastObj = cleaned.lastIndexOf('}');
    if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
      const slice = cleaned.slice(firstObj, lastObj + 1);
      return JSON.parse(slice);
    }

    throw new Error('Failed to parse JSON from model response');
  }
}

// Roadmap
app.post('/api/roadmap/generate', async (req, res) => {
  const { skillName } = req.body;
  if (!skillName) return res.status(400).json({ error: 'skillName is required' });

  try {
    const prompt = `Create a 5-step detailed learning roadmap for mastering "${skillName}".

Return ONLY a JSON array. Each item must have:
- step (number)
- title (string)
- description (string)
- duration (string)
- resources (array of strings)

JSON array only. No markdown.`;

    const data = await openRouterChatCompletions({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: 'You generate learning roadmaps. Output strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1400,
      temperature: 0.7,
    });

    const content = data?.choices?.[0]?.message?.content;
    const roadmap = parseJsonFromModelContent(content);
    if (!Array.isArray(roadmap)) throw new Error('Model did not return a JSON array roadmap');

    res.json({ roadmap });
  } catch (err) {
    console.error('POST /api/roadmap/generate error', err);
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

// Match analysis
app.post('/api/match/analyze', async (req, res) => {
  const { user1, user2 } = req.body;
  if (!user1 || !user2) return res.status(400).json({ error: 'user1 and user2 are required' });

  try {
    // Fallback analysis if OpenRouter fails
    const commonSkills = user1.skillsKnown?.filter(skill => 
      user2.skillsToLearn?.includes(skill.name || skill)
    ) || [];
    
    const reverseMatch = user2.skillsKnown?.filter(skill => 
      user1.skillsToLearn?.includes(skill.name || skill)
    ) || [];

    const score = Math.min(95, (commonSkills.length + reverseMatch.length) * 20 + Math.random() * 15);
    const commonInterests = [...new Set([
      ...commonSkills.map(s => s.name || s),
      ...reverseMatch.map(s => s.name || s)
    ])];

    const reasoning = `Good match based on ${commonSkills.length} skills user1 has that user2 wants to learn and ${reverseMatch.length} skills user2 has that user1 wants to learn. Both users have complementary learning goals.`;

    res.json({
      score: Math.round(score),
      reasoning,
      commonInterests
    });
  } catch (err) {
    console.error('POST /api/match/analyze error', err);
    res.status(500).json({ error: 'Failed to analyze match' });
  }
});

// Skill suggestions - Enhanced with skill-specific recommendations
app.post('/api/skills/suggest', async (req, res) => {
  const { currentSkills = [], currentGoals = [] } = req.body;

  try {
    const prompt = `You are an expert learning path advisor. Suggest 5 highly relevant, distinct skills the user should learn next based on their current profile.

CURRENT PROFILE:
Known Skills: ${Array.isArray(currentSkills) ? currentSkills.join(', ') : 'None'}
Learning Goals: ${Array.isArray(currentGoals) ? currentGoals.join(', ') : 'None'}

ANALYSIS REQUIREMENTS:
1. Identify skill domains from known skills (e.g., programming, business, creative, technical, languages, etc.)
2. Suggest skills that complement or build upon existing knowledge
3. Consider career progression and skill synergies
4. Include both foundational and advanced options where appropriate
5. Prioritize skills with high market demand and practical applications

SUGGESTION CATEGORIES:
- For programmers: suggest related frameworks, databases, devops, or specialized areas
- For business skills: suggest complementary areas like analytics, leadership, or specialized domains
- For creative skills: suggest technical tools, business aspects, or advanced techniques
- For languages: suggest related cultures, business applications, or translation opportunities
- For technical skills: suggest management, architecture, or cross-disciplinary applications

Do NOT suggest skills already present above.

Return ONLY a JSON object with:
{
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "recommendations": {
    "Skill1": "Specific reason why this skill complements your profile",
    "Skill2": "Specific reason why this skill complements your profile",
    "Skill3": "Specific reason why this skill complements your profile",
    "Skill4": "Specific reason why this skill complements your profile",
    "Skill5": "Specific reason why this skill complements your profile"
  },
  "categories": {
    "Skill1": "category_name",
    "Skill2": "category_name",
    "Skill3": "category_name",
    "Skill4": "category_name",
    "Skill5": "category_name"
  }
}

JSON only. No markdown.`;

    const data = await openRouterChatCompletions({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: 'You are an expert learning advisor. Provide skill recommendations with detailed reasoning. Output strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = data?.choices?.[0]?.message?.content;
    const result = parseJsonFromModelContent(content);
    res.json(result);
  } catch (err) {
    console.error('POST /api/skills/suggest error', err);
    res.status(500).json({ error: 'Failed to suggest skills' });
  }
});

// Quizzes
app.post('/api/quizzes/generate', async (req, res) => {
  const { skillName, difficulty, count } = req.body;
  if (!skillName) return res.status(400).json({ error: 'skillName is required' });

  try {
    const questionCount = Number.isFinite(Number(count)) ? Math.max(1, Math.min(10, Number(count))) : 5;
    const level = (difficulty === 'expert' || difficulty === 'advanced' || difficulty === 'intermediate' || difficulty === 'beginner')
      ? difficulty
      : 'advanced';

    const shuffleOptionsInPlace = (q) => {
      if (!q || !Array.isArray(q.options) || typeof q.correctAnswerIndex !== 'number') return;
      const correct = q.options[q.correctAnswerIndex];
      for (let i = q.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
      }
      q.correctAnswerIndex = q.options.indexOf(correct);
    };

    const validateQuestions = (questions) => {
      if (!Array.isArray(questions) || questions.length !== questionCount) return false;
      return questions.every((q) =>
        q &&
        typeof q.question === 'string' &&
        typeof q.codeSnippet === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswerIndex === 'number' &&
        q.correctAnswerIndex >= 0 &&
        q.correctAnswerIndex <= 3
      );
    };

    let questions;
    let lastParseError;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const nonce = crypto.randomUUID();
      const difficultySpec = level === 'beginner'
        ? `BEGINNER difficulty:
- Focus on core concepts and basic usage.
- Code should be short (8-15 lines) and readable.
- Avoid niche edge cases; still include at least one subtle trap option.`
        : level === 'intermediate'
          ? `INTERMEDIATE difficulty:
- Include practical scenarios and common pitfalls.
- Code should be 10-25 lines.
- Include at least one debugging/tracing style question.`
          : `ADVANCED/EXPERT difficulty:
- Make it hard without real experience.
- Include edge cases, performance, security, internals, tricky debugging.
- Code should be 15-35 lines and may include multiple functions/modules.`;

      const prompt = `Generate ${questionCount} ${level.toUpperCase()}-LEVEL multiple-choice questions SPECIFICALLY about "${skillName}".

HARD REQUIREMENTS:
- Every question MUST include a non-empty codeSnippet. Include real program/code (not pseudocode). Minimum ~8 lines.
- The codeSnippet MUST include this watermark somewhere (as a comment/string): "nonce:${nonce}".

${difficultySpec}

- Options must be plausible and close; include traps/misconceptions appropriate to the level.

Return ONLY a JSON array with exactly ${questionCount} items. Each item:
{ "question": string, "codeSnippet": string, "options": [string,string,string,string], "correctAnswerIndex": 0|1|2|3 }

JSON array only. No extra keys. No markdown.`;

      try {
        const data = await openRouterChatCompletions({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: 'You generate skill-verification quizzes. Output strict JSON only.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2200,
          temperature: 0.95,
          seed: Math.floor(Math.random() * 1_000_000_000),
        });

        const content = data?.choices?.[0]?.message?.content;
        const parsed = parseJsonFromModelContent(content);
        if (validateQuestions(parsed)) {
          questions = parsed;
          break;
        }
        lastParseError = new Error('Model returned invalid schema (missing codeSnippet / wrong count / invalid options)');
      } catch (e) {
        lastParseError = e;
      }
    }

    if (!questions) {
      throw lastParseError || new Error('Failed to generate valid quiz');
    }

    questions.forEach(shuffleOptionsInPlace);

    const quizId = crypto.randomUUID();
    try {
      const quiz = new Quiz({
        _id: quizId,
        skillName,
        questions,
        createdAt: Date.now()
      });
      await quiz.save();
    } catch (dbErr) {
      console.error('Quiz generated but failed to save to DB:', dbErr);
    }

    // Still return questions; persistence failure should not block user experience.

    res.status(201).json({ quizId, questions });
  } catch (err) {
    console.error('POST /api/quizzes/generate error', err);
    res.status(500).json({ error: 'Failed to generate quiz', detail: String(err?.message || err) });
  }
});

app.post('/api/quizzes/submit', async (req, res) => {
  const { quizId, userId, answers } = req.body;
  if (!quizId || !userId || !answers) {
    return res.status(400).json({ error: 'quizId, userId, and answers are required' });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = quiz.questions;
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswerIndex) {
        score++;
      }
    }

    const percentageScore = Math.round((score / questions.length) * 100);

    const attempt = new QuizAttempt({
      _id: crypto.randomUUID(),
      userId,
      quizId,
      answers,
      score: percentageScore,
      completedAt: Date.now()
    });
    await attempt.save();

    res.json({ score: percentageScore });
  } catch (err) {
    console.error('POST /api/quizzes/submit error', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Mistral AI Quiz Generation API - AI Only
app.post('/api/quiz/generate', async (req, res) => {
  const { skill, difficulty } = req.body;

  if (!skill || typeof skill !== 'string') {
    return res.status(400).json({ error: 'skill is required and must be a string' });
  }

  if (!difficulty || typeof difficulty !== 'string') {
    return res.status(400).json({ error: 'difficulty is required and must be a string' });
  }

  const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({
      error: 'difficulty must be one of: beginner, intermediate, advanced, expert'
    });
  }

  try {
    console.log(`Generating AI quiz for ${skill} at ${difficulty} level`);
    const questions = await generateQuiz(skill, difficulty, 10); // Changed from 5 to 10

    const formattedQuestions = questions.map(q => ({
      question: q.question,
      codeSnippet: q.codeSnippet || '',
      expectedOutput: q.expectedOutput || '',
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex || 0
    }));

    console.log(`Successfully generated ${formattedQuestions.length} questions for ${skill}`);
    return res.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('AI quiz generation failed:', error);
    
    // Return detailed error for debugging
    return res.status(500).json({
      error: 'AI quiz generation failed',
      details: error.message,
      suggestion: 'Please check your Mistral API key and try again'
    });
  }
});

// Skill Suggestion API
app.post('/api/skills/suggest', async (req, res) => {
  const { currentSkills = [], currentGoals = [] } = req.body;

  try {
    const skills = await suggestSkills(currentSkills, currentGoals);
    res.json({ skills });
  } catch (error) {
    console.error('Skill suggestion error:', error);
    res.status(500).json({
      error: 'Failed to suggest skills',
      details: error.message
    });
  }
});

// Roadmap Generation API
app.post('/api/roadmap/generate', async (req, res) => {
  const { skillName } = req.body;

  if (!skillName || typeof skillName !== 'string') {
    return res.status(400).json({ error: 'skillName is required and must be a string' });
  }

  try {
    const roadmap = await generateRoadmap(skillName);
    res.json({ roadmap });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({
      error: 'Failed to generate roadmap',
      details: error.message
    });
  }
});

// Mistral AI Learning Roadmap API
app.post('/api/learning/roadmap', async (req, res) => {
  try {
    const { skill, currentLevel = 'beginner', goals = [] } = req.body;

    if (!skill) {
      return res.status(400).json({ error: 'Skill is required' });
    }

    const prompt = `As an expert learning path architect and curriculum designer, create a structured, practical, industry-relevant learning roadmap for ${skill}.

Current level: ${currentLevel}
Goals: ${goals.length > 0 ? goals.join(', ') : 'Not specified'}

Return ONLY valid JSON in this exact format:
{
  "skill": "${skill}",
  "level": "${currentLevel}",
  "duration": "total estimated time",
  "roadmap": [
    {
      "step": number,
      "title": "string",
      "description": "string",
      "duration": "string (e.g., '1-2 weeks')",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": [
        {"type": "documentation", "title": "string", "url": "string"},
        {"type": "tutorial", "title": "string", "url": "string"},
        {"type": "practice", "title": "string", "url": "string"}
      ],
      "projects": ["project1", "project2"]
    }
  ]
}

Requirements:
- Create 6-8 progressive steps from current level to advanced
- Include practical, hands-on projects for each step
- Provide realistic timeframes
- Include modern, industry-relevant topics
- Focus on practical learning outcomes
- Each step should have exactly 3 resources (documentation, tutorial, practice)
- Include 2 project ideas per step
- Do not include any markdown formatting or explanations
- Return only the JSON object`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer WCDEgp3sS6bERPYNBvhYvzFyT5UzVkdZ'
      },
      body: JSON.stringify({
        model: 'mistral-small',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Mistral API');
    }

    const cleanContent = content.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    res.json(parsed);
  } catch (error) {
    console.error('Learning roadmap generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate learning roadmap',
      message: error.message 
    });
  }
});

// Mistral AI Skill Suggestions API
app.post('/api/learning/suggest-skills', async (req, res) => {
  try {
    const { currentSkills = [], goals = [], targetRole = '' } = req.body;

    const prompt = `As an expert learning path architect, suggest 5 relevant skills based on user's profile.

Current skills: [${currentSkills.join(', ')}]
Goals: [${goals.join(', ')}]
Target role: ${targetRole || 'Not specified'}

Return ONLY valid JSON in this exact format:
{
  "skills": [
    {
      "name": "string",
      "reason": "string",
      "demand": "high|medium|low",
      "timeToLearn": "string"
    }
  ]
}

Requirements:
- Suggest in-demand skills that complement current skills
- Consider the user's goals and target role
- Do not include skills the user already knows
- Focus on modern, relevant technologies
- Include demand level and estimated learning time
- Do not include any markdown formatting or explanations
- Return only the JSON object`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer WCDEgp3sS6bERPYNBvhYvzFyT5UzVkdZ'
      },
      body: JSON.stringify({
        model: 'mistral-small',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Mistral API');
    }

    const cleanContent = content.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    res.json(parsed);
  } catch (error) {
    console.error('Skill suggestion error:', error);
    res.status(500).json({ 
      error: 'Failed to suggest skills',
      message: error.message 
    });
  }
});

// Authentication Endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('🚀 Signup request received:', { email: req.body.email });
    
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name, email, and password are required' 
      });
    }
    
    if (name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Invalid name',
        message: 'Name must be at least 2 characters long' 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email',
        message: 'Please enter a valid email address' 
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Invalid password',
        message: 'Password must be at least 8 characters long' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already exists',
        message: 'An account with this email already exists' 
      });
    }
    
    // Create new user
    const defaultAvatar = `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(name.trim())}`;
    
    const newUser = new User({
      _id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password, // In production, hash this password
      avatar: defaultAvatar,
      bio: '',
      skillsKnown: [],
      skillsToLearn: [],
      rating: 5.0,
      learningHours: 0,
      weeklyActivity: 0
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ User created successfully:', { id: newUser._id, email: newUser.email });
    
    // Return user without password and with token
    const { password: _, ...userResponse } = newUser.toObject();
    res.status(201).json({ 
      user: userResponse, 
      token,
      message: 'Account created successfully!' 
    });
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create account. Please try again.' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request received:', { email: req.body.email });
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password' 
      });
    }
    
    // Check password (in production, use hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful:', { id: user._id, email: user.email });
    
    // Return user without password and with token
    const { password: _, ...userResponse } = user.toObject();
    res.json({ 
      user: userResponse, 
      token,
      message: 'Login successful!' 
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Login failed. Please try again.' 
    });
  }
});

// Test endpoint
app.get('/api/auth/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/', (req, res) => {
  res.send('SkillVouch MongoDB API is running');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong. Please try again.' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested resource was not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MongoDB backend listening on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 MongoDB connection: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
});
