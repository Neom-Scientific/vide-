import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();
    const { username, password ,confirm_password} = body;
    // console.log('username and password', username, password);
    try{
        let response = [];
        
        // Check if the user exists
        const user = await pool.query('SELECT username FROM request_form WHERE username = $1', [username]);
        if (user.rowCount === 0) {
            response.push({
                status: 401,
                message: 'Username does not exist',
            });
            return NextResponse.json(response);
        }

        // Fetch user data
        const userData = await pool.query('SELECT * FROM request_form WHERE username = $1', [username]);
        // console.log('password', userData.rows[0].password)
        const isPasswordValid = userData.rows[0].password === password;
        if (!isPasswordValid) {
            response.push({
                status: 401,
                message: 'Invalid password',
            });
        }

        else {
            const query = 'UPDATE request_form SET password = $1 WHERE username = $2';
            await pool.query(query, [confirm_password, username]);
            response.push({
                status:200,
                message: 'Password reset successful',
            })
        }

        
        return NextResponse.json(response);
    }
    catch (error) {
        console.error('Error executing query', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}