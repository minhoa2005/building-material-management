// Deliberately local-only. Never runs seeds or changes a shared connection.
import 'dotenv/config';
import mongoose from 'mongoose';
import express from 'express';

const uri='mongodb://127.0.0.1:27018/wmsd_hieudt_local_20261111?replicaSet=hieudt-test';
process.env.MONGODB_URI=uri;
await mongoose.connect(uri,{autoCreate:false,autoIndex:false,serverSelectionTimeoutMS:5000});
const {default:app}=await import('../src/app.js');
const review=express();
review.use((_req,res,next)=>{res.setHeader('X-WMSD-Review-Database',mongoose.connection.name);next();});
review.use(app);
review.listen(3001,'127.0.0.1',()=>console.info('HieuDT local review: http://127.0.0.1:3001 — DB wmsd_hieudt_local_20261111'));
