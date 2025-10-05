import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sample_id = searchParams.get("sample_id");
    
    try {
        const response = [];
        if (!sample_id) {
            response.push({ status: 400, message: "Sample ID is required" });
            return NextResponse.json(response);
        }

        // Fetch pool data
        const poolData = await pool.query(
            `SELECT sample_id, internal_id , hospital_name FROM pool_info WHERE sample_id = $1 `,
            [sample_id]
        );

        if (poolData.rows.length > 0) {
            response.push({ status: 200, poolData: poolData.rows[0] });
        } else {
            response.push({ status: 404, message: "Pool data not found" });
        }
        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching sample data:", error);
        return NextResponse.json({ status: 500, message: "Internal Server Error" });
    }
}