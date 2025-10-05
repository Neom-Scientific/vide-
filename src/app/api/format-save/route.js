import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // adjust import if needed

function parseId(id) {
    // Match year (4 digits), month (2 digits), sequence (remaining digits)
    const match = id.match(/^(\d{4})(\d{2})(\d+)$/);
    if (match) {
        return {
            year: match[1],
            month: match[2],
            seq: parseInt(match[3], 10),
            pad: match[3].length,
            prefix: '', // No prefix in this format
            separator: '',
            suffix: ''
        };
    }
    // Fallback to generic parser for other formats
    const generic = id.match(/(\d+)/);
    if (!generic) return { prefix: id, separator: '', pad: 0, seq: 0, suffix: '' };
    const seq = parseInt(generic[1], 10);
    const pad = generic[1].length;
    const parts = id.split(generic[1]);
    const prefix = parts[0] || '';
    const suffix = parts[1] || '';
    let separator = '';
    if (prefix && (prefix.slice(-1) === '-' || prefix.slice(-1) === '_')) separator = prefix.slice(-1);
    else if (suffix && (suffix[0] === '-' || suffix[0] === '_')) separator = suffix[0];
    return {
        prefix: prefix.replace(/[-_]$/, ''),
        separator,
        pad,
        seq,
        suffix: suffix.replace(/^[-_]/, '')
    };
}

export async function POST(request) {
    const { internal_id, run_id, hospital_name } = await request.json();
    try {
        const response = [];

        console.log('hospital_name', hospital_name)
        // Parse internal_id and run_id
        const internal = parseId(internal_id);
        const run = parseId(run_id);

        if (internal.pad === 0) {
            response.push({
                message: 'Internal ID must contain a numeric part for auto-increment.',
                status: 400
            })
            return NextResponse.json(response);
        }
        if (run.pad === 0) {
            response.push({
                message: 'Run ID must contain a numeric part for auto-increment.',
                status: 400
            })
            return NextResponse.json(response);
        }

        // Insert into id_format table
        await pool.query(`
            INSERT INTO id_format (
                hospital_name,
                internal_id_prefix,
                internal_id_separator,
                internal_id_pad_length,
                internal_id_last_seq,
                run_id_prefix,
                run_id_pad_length,
                run_id_last_seq,
                internal_id_last_year,
                internal_id_last_month
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (hospital_name) DO UPDATE SET
                internal_id_prefix = EXCLUDED.internal_id_prefix,
                internal_id_separator = EXCLUDED.internal_id_separator,
                internal_id_pad_length = EXCLUDED.internal_id_pad_length,
                internal_id_last_seq = EXCLUDED.internal_id_last_seq,
                run_id_prefix = EXCLUDED.run_id_prefix,
                run_id_pad_length = EXCLUDED.run_id_pad_length,
                run_id_last_seq = EXCLUDED.run_id_last_seq,
                internal_id_last_year = EXCLUDED.internal_id_last_year,
                internal_id_last_month = EXCLUDED.internal_id_last_month
        `, [
            hospital_name,
            internal.prefix,
            internal.separator,
            internal.pad,
            internal.seq,
            run.prefix,
            run.pad,
            run.seq,
            internal.year || null,   // <-- from parseId
            internal.month || null   // <-- from parseId
        ]);

        response.push({ status: 200, message: "Format saved successfully" });
        return NextResponse.json(response);
    } catch (error) {
        console.log('Error saving format:', error);
        return NextResponse.json({ error: 'Failed to save format' }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const hospital_name = searchParams.get('hospital_name');
    try {
        const response = [];
        const result = await pool.query(
            `SELECT hospital_name FROM id_format WHERE hospital_name = $1`,
            [hospital_name]
        );
        if (result.rows.length > 0) {
            response.push({
                message: "format exists",
                status: 400
            })
        } else {
            response.push({
                message: "No format found",
                status: 200
            })
        }
        return NextResponse.json(response);

    }
    catch (error) {
        console.log('Error fetching format:', error);
        return NextResponse.json({ error: 'Failed to fetch format' }, { status: 500 });
    }
}