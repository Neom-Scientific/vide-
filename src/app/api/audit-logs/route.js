import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sample_id = searchParams.get('sample_id');
    const internal_id = searchParams.get('internal_id');
    const hospital_name = searchParams.get('hospital_name');
    const response = [];
    try {
        if (!sample_id && !internal_id) {
            response.push({
                message: 'sample_id or internal_id is required',
                status: 400
            });
            return NextResponse.json(response);
        }

        let logs = [];
        if (sample_id) {
            const dataSample = await pool.query('SELECT * FROM audit_logs WHERE sample_id = $1 and hospital_name = $2  ORDER BY id', [sample_id,hospital_name]);
            logs = logs.concat(dataSample.rows);
        }
        if (internal_id) {
            const dataInternal = await pool.query('SELECT * FROM audit_logs WHERE internal_id = $1 AND hospital_name = $2 ORDER BY id', [internal_id, hospital_name]);
            // Avoid duplicate logs if sample_id and internal_id point to the same log
            const existingIds = new Set(logs.map(log => log.id));
            logs = logs.concat(dataInternal.rows.filter(log => !existingIds.has(log.id)));
        }

        if (logs.length > 0) {
            response.push({
                message: 'Audit logs fetched successfully',
                status: 200,
                logs
            });
        } else {
            response.push({
                message: 'No audit logs found for this sample',
                status: 404
            });
        }
        return NextResponse.json(response);
    }
    catch (e) {
        console.log('error', e);
        return NextResponse.json({ error: "Failed to fetch audit logs", status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    const { sample_id, comments, changed_by, changed_at, hospital_name } = body;
    const response = [];
    try {
        if (!sample_id) {
            response.push({
                message: 'sample_id is required',
                status: 400
            });
            return NextResponse.json(response);
        }
        const data = await pool.query(
            'INSERT INTO audit_logs (sample_id, comments, changed_by, changed_at,hospital_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [sample_id, comments, changed_by, changed_at, hospital_name]
        );
        if (data.rows.length > 0) {
            response.push({
                message: 'Audit log added successfully',
                status: 201,
                log: data.rows[0]
            });
        } else {
            response.push({
                message: 'Failed to add audit log',
                status: 500
            });
        }
        return NextResponse.json(response);
    }
    catch (e) {
        console.log('error', e);
        return NextResponse.json({ error: "Failed to add audit log", status: 500 });
    }

}