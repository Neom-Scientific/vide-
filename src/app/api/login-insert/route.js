import { pool } from "@/lib/db";
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
    const { username, password,application_name } = body;
    try {
        let response = [];

        const user = await pool.query('SELECT username from request_form WHERE username = $1', [username]);
        if (user.rowCount === 0) {
            response.push({
                status: 401,
                message: 'Username does not exist',
            });
            return NextResponse.json(response, { headers: corsHeaders });
        }
        const userData = await pool.query('SELECT * FROM request_form WHERE username = $1', [username]);
        const isPasswordValid = userData.rows[0].password === password;
        if (!isPasswordValid) {
            response.push({
                status: 401,
                message: 'Invalid password',
            });
            return NextResponse.json(response, { headers: corsHeaders });
        }
        const userEnable = userData.rows[0].status;
        if (userEnable === 'disable') {
            response.push({
                status: 401,
                message: 'Contact admin to enable your account',
            });
            return NextResponse.json(response, { headers: corsHeaders });
        }

        const result = await pool.query(
            'INSERT INTO login_data (username, password, application_name) VALUES ($1, $2, $3)',
            [username, password, application_name]
        );
        
        const query = 'UPDATE request_form SET user_login = $1 WHERE username = $2';
        await pool.query(query, [userData.rows[0].user_login + 1, username]);
        if (result.rowCount > 0) {
            response.push({
                status: 200,
                data: {
                    username: userData.rows[0].username,
                    email: userData.rows[0].email,
                    hospital_name: userData.rows[0].hospital_name,
                    hospital_id: userData.rows[0].hospital_id,
                    role: userData.rows[0].role,
                    user_login: userData.rows[0].user_login,
                    name : userData.rows[0].name,
                    created_at: userData.rows[0].created_at,
                    enable_management: userData.rows[0].enable_management
                },
                message: 'Login successful',
            });
            return NextResponse.json(response, { headers: corsHeaders });
        } else {
            response.push({
                status: 500,
                message: 'Failed to login',
            });
            return NextResponse.json(response, { headers: corsHeaders });
        }
    }
    catch (error) {
        console.error('Error executing query', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}
