# 🗄️ MongoDB Atlas Setup Guide

## Prerequisites
- MongoDB Atlas account (free tier is sufficient)
- Vercel account for deployment

## Step 1: Create MongoDB Atlas Cluster

### 1.1 Sign Up/Create Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign up or log in
3. Click "Build a Database"

### 1.2 Cluster Configuration
- **Cloud Provider**: AWS
- **Region**: Choose nearest to your users (e.g., us-east-1)
- **Cluster Tier**: M0 Sandbox (Free)
- **Cluster Name**: `skillvouch-cluster`

### 1.3 Create Database User
1. Go to "Database Access" → "Add New Database User"
2. **Authentication Method**: Password
3. **Username**: `skillvouch-user`
4. **Password**: Generate a strong password
5. **Database User Privileges**: Read and write to any database

### 1.4 Configure Network Access
1. Go to "Network Access" → "Add IP Address"
2. Select **ALLOW ACCESS FROM ANYWHERE** (0.0.0.0/0)
3. Click "Confirm"

## Step 2: Get Connection String

### 2.1 Connect to Cluster
1. Go to "Clusters" → "Connect" for your cluster
2. Select **Drivers**
3. Copy the connection string

### 2.2 Update Connection String
Replace the template:
```
mongodb+srv://<username>:<password>@skillvouch-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

With your credentials:
```
mongodb+srv://skillvouch-user:YOUR_PASSWORD@skillvouch-cluster.xxxxx.mongodb.net/skillvouch?retryWrites=true&w=majority
```

**Important**: 
- Replace `YOUR_PASSWORD` with the actual password
- URL encode special characters: `@` → `%40`, `:` → `%3A`, `#` → `%23`
- Add `/skillvouch` at the end for database name

## Step 3: Configure in Vercel

### 3.1 Add Environment Variable
1. Go to Vercel → Project → Settings → Environment Variables
2. Add variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your complete connection string
   - **Environments**: Production, Preview, Development

### 3.2 Test Connection
Deploy your application and check logs for:
```
✅ MongoDB connected successfully
📍 Database: skillvouch
```

## Step 4: Database Schema Setup

The application will automatically create these collections:

### Users Collection
```javascript
{
  _id: String,
  name: String,
  email: String,
  password: String, // Will be hashed in production
  avatar: String,
  bio: String,
  discordLink: String,
  skillsKnown: [{
    name: String,
    level: String,
    verified: Boolean,
    experienceYears: Number,
    availability: [String]
  }],
  skillsToLearn: [{
    name: String,
    level: String,
    priority: String
  }],
  rating: Number,
  learningHours: Number,
  weeklyActivity: Number
}
```

### Other Collections
- `exchangerequests` - Skill exchange requests
- `exchangefeedbacks` - User feedback
- `messages` - Chat messages
- `quizzes` - Skill verification quizzes
- `quizattempts` - Quiz attempts

## Step 5: Security Best Practices

### 5.1 Password Security
- Use strong, unique passwords
- Consider using MongoDB's SCRAM-SHA-256 authentication
- Store password securely (don't commit to git)

### 5.2 Network Security
- The free tier requires 0.0.0.0/0 for Vercel
- For production, consider VPC peering or specific IP ranges

### 5.3 Backup Strategy
- Enable automated backups in Atlas
- Set retention period (recommended: 30 days)
- Test restore process periodically

## Step 6: Monitoring & Optimization

### 6.1 Performance Metrics
Monitor in Atlas Dashboard:
- Connection count
- Query performance
- Index usage
- Disk space

### 6.2 Index Optimization
The application will create necessary indexes automatically:
- Email uniqueness index
- Skill-related indexes for queries

### 6.3 Cost Management
- M0 Sandbox: 512MB storage, free forever
- Monitor usage to avoid unexpected charges
- Upgrade only when necessary

## Troubleshooting

### Common Issues

#### "Authentication failed"
- Check username/password in connection string
- Ensure database user has correct permissions
- Verify password is URL-encoded

#### "Connection timeout"
- Check network access (0.0.0.0/0)
- Verify cluster is running
- Check firewall settings

#### "Database not found"
- Ensure database name is in connection string
- Check if database needs to be created (it will be auto-created)

### Testing Connection
```bash
# Test with MongoDB Compass
# Use your connection string in Compass GUI

# Test with mongosh
mongosh "mongodb+srv://skillvouch-user:PASSWORD@skillvouch-cluster.xxxxx.mongodb.net/skillvouch"
```

## Production Checklist

- [ ] Cluster created and running
- [ ] Database user configured with strong password
- [ ] Network access allows 0.0.0.0/0
- [ ] Connection string obtained and URL-encoded
- [ ] MONGODB_URI set in Vercel environment variables
- [ ] Application deployed and connecting successfully
- [ ] Backups enabled
- [ ] Monitoring configured

## Support Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Connection String Examples](https://docs.mongodb.com/manual/reference/connection-string/)
