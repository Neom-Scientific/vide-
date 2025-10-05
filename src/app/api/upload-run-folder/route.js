import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import ftp from 'basic-ftp';
import { Readable } from 'stream';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const chunk = formData.get('chunk');
        const fileName = formData.get('fileName');
        const chunkIndex = Number(formData.get('chunkIndex'));
        // const totalChunks = Number(formData.get('totalChunks'));
        const sessionId = formData.get('sessionId');

        const buffer = Buffer.from(await chunk.arrayBuffer());

        const remoteFilePath = path.posix.join('/neofastq', sessionId, 'chunks', fileName, `chunk_${chunkIndex}`);
        await uploadChunkViaFTPBuffer(buffer, remoteFilePath);

        return NextResponse.json({ message: 'Chunk uploaded', status: 200 });
    } catch (err) {
        console.log('error', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function uploadChunkViaFTPBuffer(buffer, remoteFilePath) {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: true,
            secureOptions: { rejectUnauthorized: false },
            passive: true,
        });

        const remoteDir = path.dirname(remoteFilePath);
        await client.ensureDir(remoteDir);

        // Convert buffer to stream for FTP upload
        const stream = Readable.from(buffer);
        await client.uploadFrom(stream, remoteFilePath);

        // console.log(`Uploaded chunk to FTP: ${remoteFilePath}`);
    } catch (err) {
        console.error('FTP upload error:', err);
        throw err;
    } finally {
        client.close();
    }
}