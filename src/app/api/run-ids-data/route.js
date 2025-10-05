import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const hospital_name = searchParams.get('hospital_name');
    try{
        const response = [];
        if(!hospital_name){
            response.push({
                message: 'Hospital name is required',
                status: 404
            });
            return NextResponse.json(response);
        }
        const {rows} = await pool.query(`SELECT sample_id,internal_id,test_name,run_id FROM master_sheet WHERE hospital_name = $1 and run_id = $2;`, [hospital_name,runId]);
        if(rows.length === 0){
            response.push({
                message: 'No data found for the provided runId and hospital_name',
                status: 404
            });
            return NextResponse.json(response);
        }
        else{
            response.push({
                message: 'Data retrieved successfully',
                status: 200,
                data: rows
            });
        }
        return NextResponse.json(response);
    }
    catch (error){
        console.log('error', error);
        return NextResponse.json({
            error:' An error occurred while processing your request.',
            message: error.message,
            status: 500
        })
    }
    
}