import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const { hospital_name, value,type } = await request.json();
    const response = []
    try {
        if (!hospital_name || !type) {
            response.push({
                message: 'hospital_name and type are required',
                status: 400
            })
            return NextResponse.json(response)
        }
        const data = await pool.query('INSERT INTO default_values VALUES ($1, $2 , $3)', [type, hospital_name, value]);
        if (data.rowCount > 0) {
            response.push({
                message: 'Sample type added successfully',
                status: 200
            })
        } else {
            response.push({
                message: 'Failed to add sample type',
                status: 400
            })
        }
        return NextResponse.json(response);
    }
    catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to add sample", status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const hospital_name = searchParams.get('hospital_name') || 'default';
    const type = searchParams.get('type');
    const response = [];
    try {
        const data = await pool.query(
            'SELECT * FROM default_values WHERE type = $1 AND (hospital_name = $2 OR hospital_name = $3)',
            [type, hospital_name, 'default']
        );
        if (data.rows.length > 0) {
            response.push({
                message: 'Sample types fetched successfully',
                status: 200,
                values: data.rows.map(row => row.value)
            });
        } else {
            response.push({
                message: 'No sample types found for this hospital',
                status: 404
            });
        }
        return NextResponse.json(response);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch sample types", status: 500 });
    }
}