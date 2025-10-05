import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hospital_name = searchParams.get('hospital_name');
    try {
        const response = [];
        if (id === 'pool_no') {
            let pool_no = 'P_000';
            const poolData = await pool.query('SELECT pool_no FROM pool_info WHERE pool_no IS NOT NULL and hospital_name = $1 ORDER BY pool_no DESC LIMIT 1 FOR UPDATE',[hospital_name]);
            // console.log('poolData:', poolData.rows);
            if (poolData.rows.length > 0) {
                 pool_no = poolData.rows[0].pool_no;
            }
            response.push({
                pool_no: pool_no,
                message: 'Pool number generated successfully.',
                status: 200
            });
    
            return NextResponse.json(response);
        }
        if(id === 'batch_id'){
            let batch_id = 'SBB_0';
            const batchData = await pool.query('SELECT batch_id FROM pool_info WHERE batch_id IS NOT NULL and hospital_name = $1 ORDER BY batch_id DESC LIMIT 1 FOR UPDATE',[hospital_name]);
            // console.log('batchData:', batchData.rows);
            if (batchData.rows.length > 0) {
                // const lastBatchId = batchData.rows[0].batch_id;
                // if (typeof lastBatchId === "string" && lastBatchId.includes("_")) {
                //     const lastNumber = parseInt(lastBatchId.split('_')[1], 10);
                //     const newNumber = lastNumber + 1;
                //     // console.log('lastNumber:', lastNumber, 'newNumber:', newNumber);
                //     batch_id = `SBB_${newNumber.toString().padStart(2, '0')}`;
                // }
                batch_id = batchData.rows[0].batch_id;
            }
            response.push({
                batch_id: batch_id,
                message: 'Batch ID generated successfully.',
                status: 200
            });
            return NextResponse.json(response);
        }
    }
    catch (error) {
        console.error("Error in GET /api/pool-no:", error);
        return NextResponse.json({
            message: 'An error occurred while processing your request.',
            status: 500
        })
    }
}