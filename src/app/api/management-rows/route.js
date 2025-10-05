import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const { year, rows } = await request.json();
    try {
        const response = [];
        if (!year || !rows) {
            response.push({
                message: 'Something is missing',
                status: 404
            })
            return NextResponse.json({ response });
        }
        const result = await pool.query(`INSERT INTO management_rows (
        year, test_code, test_name, test_count, extraction, library, library_qc,
        wet_lab_expense, patient_cost, patient_billing, gb_sample, total_gb,
        cpt, cprt, custom_expenses, hospital_name, email
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      ) RETURNING *`, [
            year, rows.test_code, rows.test_name, rows.test_count, rows.extraction, rows.library, rows.library_qc,
            rows.wet_lab_expense, rows.patient_cost, rows.patient_billing, rows.gb_sample, rows.total_gb,
            rows.cpt, rows.cprt, rows.custom_expenses, rows.hospital_name, rows.email
        ]);
        if (result.rowCount === 0) {
            response.push({
                message: 'Failed to save rows',
                status: 500
            })
        }
        response.push({
            message: 'Rows saved successfully',
            status: 200, data: result.rows
        })
        return NextResponse.json({ response });
    }
    catch (error) {
        return NextResponse.json({ error: 'Failed to save rows' }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || 'current';
    const hospital_name = searchParams.get('hospital_name') || '';
    try {
        const response = [];
        if (!year || !hospital_name) {
            response.push({
                message: 'Something is missing',
                status: 404
            })
            return NextResponse.json({ response });
        }
        const result = await pool.query('SELECT * FROM management_rows WHERE year = $1 AND hospital_name = $2', [year, hospital_name]);
        if (result.rowCount === 0) {
            response.push({
                message: 'No rows found',
                status: 404
            })
            return NextResponse.json({ response });
        }
        response.push({
            data: result.rows,
            status: 200, 
        })
        return NextResponse.json({ response });
    }
    catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 });
    }
}