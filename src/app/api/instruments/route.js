import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const { instrument_name, flowcell } = await request.json();
    try {
        const response = [];
        if (!instrument_name || !flowcell) {
            response.push({
                message: 'Something is missing',
                status: 404
            })
            return NextResponse.json({ response });
        }
        const result = await pool.query(`INSERT INTO instruments (
        instrument_type, flowcell
      ) VALUES (
        $1, $2
      ) RETURNING *`, [
            instrument_name, JSON.stringify(flowcell)
        ]);
        if (result.rowCount === 0) {
            response.push({
                message: 'Failed to save instrument',
                status: 500
            })
        }
        response.push({
            message: 'Instrument saved successfully',
            status: 200, data: result.rows
        })
        return NextResponse.json({ response });
    }
    catch (error) {
        console.log('error', error);
        return NextResponse.json({ error: 'Failed to save instrument' }, { status: 500 });
    }
}

export async function GET(request) {
    const searchParams = new URL(request.url).searchParams;
    const instument_type = searchParams.get('instument_type');
    // console.log('instument_type', instument_type);
    try {
        const response = [];
        const result = await pool.query('SELECT * FROM instruments where instrument_type = $1', [instument_type]);
        if (result.rowCount === 0) {
            response.push({
                message: 'No instruments found',
                status: 404
            })
            return NextResponse.json({ response });
        }
        response.push({
            message: 'Instruments fetched successfully',
            status: 200, data: result.rows
        })
        return NextResponse.json({ response });
    }
    catch (error) {
        return NextResponse.json({ error: 'Failed to fetch instruments' }, { status: 500 });
    }
}