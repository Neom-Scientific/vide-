import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const hospital_name = searchParams.get('hospital_name');
    console.log('hospital_name', hospital_name);
    const response = [];
    try {
        const data = await pool.query('SELECT * FROM audit_logs where hospital_name = $1 ORDER BY id',[hospital_name]);
        if (data.rows.length > 0) {
            response.push({
                message: 'All audit logs fetched successfully',
                status: 200,
                logs: data.rows
            });
        } else {
            response.push({
                message: 'No audit logs found',
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