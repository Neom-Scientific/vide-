import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const body= await request.json();
    const { email, otp } = body;
    try{
        let response = [];
        const optData = await pool.query('SELECT * FROM otp_data WHERE email = $1', [email]);
        if (optData.rows.length === 0) {
            response.push({
                status: 400,
                message: 'Invalid OTP',
            });
        } else {
            const { otp: storedOtp, expiry_time } = optData.rows[0];
            const currentTime = new Date();
            if (currentTime > expiry_time) {
                response.push({
                    status: 400,
                    message: 'OTP expired',
                });
            } else if (String(storedOtp) !== String(otp)) {
                response.push({
                    status: 400,
                    message: 'Invalid OTP',
                });
            } else if(storedOtp === otp) {
                // console.log('otp matched');
                response.push({
                    status: 200,
                    message: 'OTP validated successfully',
                });
            }
        }
        // delete otp after validation
        await pool.query('DELETE FROM otp_data WHERE email = $1', [email]);
        response.push({
            status: 200,
            message: 'OTP validated successfully',
        });
        return NextResponse.json(response)
    }
    catch (error) {
        console.error('Error executing query', error);
        return NextResponse.json({error: 'Internal Server Error'}, { status: 500 });
    }
}