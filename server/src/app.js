require('dotenv').config();
const express=require('express'); const cors=require('cors'); const helmet=require('helmet'); const db=require('./config/db');
const app=express();
// CLIENT_URL may be a single origin or a comma-separated list (e.g. an
// apex + www domain, or a Render preview URL alongside production).
// Falls back to the local Vite dev server when unset.
const allowedOrigins=(process.env.CLIENT_URL||'http://localhost:5173').split(',').map(s=>s.trim()).filter(Boolean);
app.use(helmet()); app.use(cors({origin:(origin,cb)=>{ if(!origin||allowedOrigins.includes(origin)) return cb(null,true); return cb(new Error('Not allowed by CORS')); }})); app.use(express.json({limit:'1mb'}));
// Single health-check implementation, exposed at both paths for backward
// compatibility (the Render deployment checks /api/health; the frontend
// api.js client checks /api/health/db) — was two copy-pasted handlers.
async function healthCheck(req,res){try{await db.query('SELECT 1');res.json({status:'ok',database:'connected'});}catch(e){res.status(503).json({status:'degraded',database:'unavailable'});}}
app.get('/api/health',healthCheck);
app.get('/api/health/db',healthCheck);
app.use('/api/auth',require('./routes/authRoutes')); app.use('/api/payments',require('./routes/paymentRoutes')); app.use('/api/orders',require('./routes/orderRoutes')); app.use('/api/admin',require('./routes/adminRoutes')); app.use('/api/addresses',require('./routes/addressRoutes')); app.use('/api/notifications',require('./routes/notificationRoutes'));
app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({message:err.status?err.message:'Internal server error'});});
module.exports=app;
