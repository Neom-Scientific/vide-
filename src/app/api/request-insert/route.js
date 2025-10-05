import { pool } from "@/lib/db";
import { sendMail } from "@/lib/send-mail";
import { NextResponse } from "next/server";

export async function OPTIONS(request) {
    return NextResponse.json({}, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*", // Use your frontend domain in production
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}

export async function POST(request) {

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*", // Use your frontend domain in production
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    const body = await request.json();
    const { name, hospital_name, email, password, phone_no } = body.data;
    try {
        let response = [];
        let hospital_id = '101';
        const today = new Date().toISOString().slice(0, 10);
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM request_form WHERE to_char(now(), 'YYYY-MM-DD') = $1",
            [today]
        );
        const todayCount = parseInt(countResult.rows[0].count, 10);
        let username = getUsername(todayCount + 1);

        // Check if email exists
        const emailRows = await pool.query('SELECT * FROM request_form WHERE email = $1', [email]);
        if (emailRows.rows.length > 0) {
            response.push({
                status: 400,
                message: 'Email already exists',
            });
            return NextResponse.json(response, { headers: corsHeaders });
        }

        // Check required fields
        if (!name || !hospital_name || !email || !phone_no || !password) {
            response.push({
                status: 400,
                message: 'All fields are required',
            });
            return NextResponse.json(response, { headers: corsHeaders });
        }

        // Check if hospital_name exists and assign hospital_id
        const existingHospitalRows = await pool.query('SELECT hospital_id FROM request_form WHERE hospital_name = $1', [hospital_name]);
        if (existingHospitalRows.rows.length > 0) {
            hospital_id = existingHospitalRows.rows[0].hospital_id;
        } else {
            // Get the max hospital_id and increment it
            const maxIdRows = await pool.query('SELECT MAX(CAST(hospital_id AS INTEGER)) as max_id FROM request_form');
            const maxId = maxIdRows.rows[0].max_id || 100;
            hospital_id = (parseInt(maxId) + 1).toString();
        }

        const result = await pool.query(
            'INSERT INTO request_form (name, hospital_name, hospital_id, username, password, phone_no, email, status, role, user_login, created_at, vide_counters , neovar_counters, pedigree_counters) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, $13)',
            [name, hospital_name, hospital_id, username, password, phone_no, email, "disable", "NormalUser", 0, 10, 10, 10]
        );


        if (result.rowCount > 0) {
            response.push({
                status: 200,
                message: 'Request submitted successfully',
            });

            await sendMail(
                process.env.ADMIN_EMAIL, // Send to admin email
                `Registration Request from ${hospital_name}`,
                `
                <html>
                    <body>
                        <p>A new registration request has been submitted, following are the details:</p>
                        <ul>
                            <li><strong>Name:</strong> ${name}</li>
                            <li><strong>Organization Name:</strong> ${hospital_name}</li>
                            <li><strong>Email:</strong> ${email}</li>
                        </ul>
                        <p>Please review the request and take appropriate action.</p>
                        <p>Best regards,</p>
                        <p>NEOM Scientific Solutions Team</p>
                    </body>
                </html>
                `,
            )


            await sendMail(
                email,
                'Registration Request Submitted',
                `
                <html>
                  <body>
                    <p>Dear ${name},</p>
                    <p>Your registration request has been submitted successfully.</p>
                    <p><strong>Username:</strong> ${username}</p>
                    <p><strong>Password:</strong> ${password}</p>
                    <p>Please keep this information safe and do not share it with anyone.</p>
                    <p>Please wait for the admin to review your request.</p>
                    <p>Thank you,</p>
                    <p>NEOM Scientific Solutions Team</p>
                  </body>
                </html>
                `
            );

        } else {
            response.push({
                status: 500,
                message: 'Failed to submit request',
            });

        }
        return NextResponse.json(response, { headers: corsHeaders });
    }
    catch (error) {
        console.error('Error executing query', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const username = searchParams.get('username');
    try {
        let response = [];
        if (role === 'SuperAdmin') {
            const data = await pool.query('SELECT * FROM request_form');
            if (data.rows.length === 0) {
                response.push({
                    status: 404,
                    message: 'No data found',
                });
            } else {
                response.push({
                    status: 200,
                    data: data.rows,
                });
            }
        }
        else {
            const data = await pool.query('SELECT * FROM request_form WHERE username = $1', [username]);
            if (data.rows.length === 0) {
                response.push({
                    status: 404,
                    message: 'No data found for the given username',
                });
            } else {
                response.push({
                    status: 200,
                    data: data.rows,
                });
            }
        }
        return NextResponse.json(response,);
    }
    catch (error) {
        console.error('Error executing query', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    const body = await request.json();
    const { username, status, role,enable_management } = body; // Accept both status and role
    try {
        let response = [];

        // Validate the input
        if (!username) {
            response.push({
                status: 400,
                message: 'username is required',
            });
            return NextResponse.json(response);
        }

        // Handle status update
        if (status) {
            if (status === 'disable') {
                await pool.query('UPDATE request_form SET status = $1 WHERE username = $2', ['enable', username]);
                const email = await pool.query('SELECT email FROM request_form WHERE username = $1', [username]);
                await sendMail(
                    email.rows[0].email,
                    'SignUp Successfully',
                    ` <html>
                        <body>
                            <p>Dear User,</p>
                            <p>Your account has been updated successfully.So you can now login with your credentials.</p>
                            <p><strong>Username:</strong> ${username}</p>
                            <p>Please keep this information safe and do not share it with anyone.</p>
                            <p>If you have any questions, please contact the admin.</p>
                            <p>Best regards,</p>
                            <p>NEOM Scientific Solutions Team</p>
                        </body>
                    </html>
                    `
                );
                response.push({
                    status: 200,
                    message: 'Status updated successfully',
                });
            } else if (status === 'enable') {
                await pool.query('UPDATE request_form SET status = $1 WHERE username = $2', ['disable', username]);
                response.push({
                    status: 200,
                    message: 'Status updated successfully',
                });
            } else {
                response.push({
                    status: 400,
                    message: 'Invalid status value',
                });
            }
        }

        // Handle role update
        if (role) {
            await pool.query('UPDATE request_form SET role = $1 WHERE username = $2', [role, username]);
            response.push({
                status: 200,
                message: 'Role updated successfully',
            });
        }

        if(enable_management){
            await pool.query('UPDATE request_form SET enable_management = $1 WHERE username = $2', [enable_management, username]);
            response.push({
                status: 200,
                message: 'Management status updated successfully',
            });
        }

        // Return response
        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating status or role', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function getUsername(count) {
    const date = new Date();
    if (count === 0) {
        count = 1; // Start with 1 if no previous entries
    }
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, ''); // "20250616"
    const countStr = count.toString().padStart(2, '0'); // "01", "02", etc.
    return `${yyyymmdd}${countStr}`; // "2025061601"
}
