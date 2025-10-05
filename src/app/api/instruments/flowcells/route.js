import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const searchParams = new URL(request.url).searchParams;
    const instument_type = searchParams.get('instument_type');
    const flowcell = searchParams.get('flowcell');
    try {
        const response = [];
        if (!instument_type || !flowcell) {
            response.push({
                message: 'Something is missing',
                status: 404
            })
            return NextResponse.json({ response });
        }
        const result = await pool.query('SELECT * FROM instruments where instrument_type = $1', [instument_type]);
        if (result.rowCount === 0) {
            response.push({
                message: 'No instruments found',
                status: 404
            })
            return NextResponse.json({ response });
        }
        const instrument = result.rows[0];
        // console.log('instrument', instrument);
        const flowcells = instrument.flowcell || {};
        const flowcellData = flowcells[flowcell];
        if (!flowcellData) {
            response.push({
                message: 'Flowcell not found',
                status: 404
            });
            return NextResponse.json({ response });
        }
        response.push({
            message: 'Flowcell fetched successfully',
            status: 200, data: flowcellData
        });
        return NextResponse.json({ response });
    }
    catch (error) {
        console.log('error', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}