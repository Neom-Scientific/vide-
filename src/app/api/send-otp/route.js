import { pool } from "@/lib/db";
import { sendMail } from "@/lib/send-mail";
import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();
    const { email } = body;
    try {
        let response = []
        const data = await pool.query('SELECT email FROM request_form')
        const emailExists = data.rows.some(row => row.email === email);
        if (emailExists) {
            response.push({
                status: 400,
                message: 'Email already exists',
            });
        }
        else {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
            // store opt in database
            pool.query('INSERT INTO otp_data (otp,email,expiry_time) VALUES ($1, $2, $3)', [otp, email, expiryTime]);
            
            // delete otp after 10 minutes
            pool.query('DELETE FROM otp_data WHERE email = $1 AND expiry_time < NOW()', [email]);

            await sendMail(
                email,
                'Request Form Submission Confirmation',
                `
                <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #4CAF50;">Thank you for registering with us!</h2>
                        <p>Your One-Time Password (OTP) for completing the registration is:</p>
                        <p style="font-size: 1.5em; font-weight: bold; color: #FF5722;">🔐 OTP: ${otp}</p>
                        <p>This OTP is valid for the next <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
                        <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
                        <br>
                        <p>Best regards,</p>
                        <p><strong>NEOM Scientific Solutions Team</strong></p>
                    </body>
                </html>
            `
            )
            response.push({
                status: 200,
                message: 'OTP sent successfully',
            });
        }
        return NextResponse.json(response)
    }
    catch (error) {
        console.error('Error executing query', error);
        return NextResponse.json({error: 'Internal Server Error'}, { status: 500 });
    }
}