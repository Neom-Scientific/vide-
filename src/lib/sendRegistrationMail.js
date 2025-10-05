// import nodemailer from 'nodemailer';
// import { pool } from './db';
// import { Parser } from 'json2csv';

// export async function sendRegistrationMail({ email, subject, html, attachmentName, attachmentFile }) {
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: process.env.ADMIN_EMAIL,
//             pass: process.env.APP_PASSWORD,
//         },
//     });

//     const mailOptions = {
//         from: process.env.ADMIN_EMAIL,
//         to: email || process.env.ADMIN_EMAIL, // Default to admin email if no email is provided
//         subject: subject,
//         html: html,
//         attachments: [
//             {
//                 filename: attachmentName,
//                 content: attachmentFile,
//             },
//         ],
//     };
//     // console.log('email', email);
//     // console.log('subject', subject);
//     let info = {};

//     try {
//         info = await transporter.sendMail(mailOptions);
//         // console.log('Email sent: ' + info.response);
//     } catch (error) {
//         console.error('Error sending email: ', error);
//     }
//     return info;
// }

// export async function main() {
//     const today = new Date();
//     const todayString = today.toISOString().split('T')[0];

//     // const distinctHospital = await pool.query(`SELECT DISTINCT hospital_name, email FROM master_sheet WHERE registration_date::date = $1`, [todayString]);

//     // for(const hospital of distinctHospital.rows) {
//     //     const { hospital_name, email } = hospital;
//     //     if(!email) continue;

//     //     const {rows} = await pool.query(`SELECT * FROM master_sheet WHERE hospital_name = $1 AND registration_date::date = $2`, [hospital_name, todayString]);

//     //     if (rows.length === 0) continue;
//     const distinctHospital = await pool.query(`
//         SELECT DISTINCT hospital_name, email, project_id
//         FROM master_sheet
//         WHERE registration_date::date = $1
//     `, [todayString]);

//     for (const hospital of distinctHospital.rows) {
//         const { hospital_name, email, project_id } = hospital;
//         if (!email) continue;

//         const { rows } = await pool.query(`
//             SELECT sample_id, internal_id, patient_name, age, test_name, doctor_name
//             FROM master_sheet
//             WHERE hospital_name = $1 AND registration_date::date = $2
//         `, [hospital_name, todayString]);

//         if (rows.length === 0) continue;

//         const fields = [
//             "sample_id", "internal_id", "patient_name", "age", "test_name", "doctor_name"
//         ]
//         const parser = new Parser({ fields });
//         const csv = parser.parse(rows);
//         await sendRegistrationMail({
//             email: 'spoc@strivebiocorp.com',
//             subject: `Registration Report for ${hospital_name} on ${todayString}`,
//             html: `<html>
//             <body>
//             <p> Dear ${hospital_name},</p>
//             <p> You have successfully registered the sample with the <b>Project ID: ${hospital.project_id}</b>. <br/> <br/> Please find the attached file to see the details </p>
//             <p> Thank You</p>
//             <p> Neom Scientific Solutions</p>
//             </body>
//             </html>`,
//             attachmentName: `registration_report_${hospital_name}_${todayString}.csv`,
//             attachmentFile: csv
//         })
//     }
// }

// main().catch(error => {
//     console.log('error in main', error);
//     process.exit(1);
// })

import nodemailer from 'nodemailer';
import { pool } from './db';
import { Parser } from 'json2csv';

export async function sendRegistrationMail({ email, subject, html, attachmentName, attachmentFile }) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: email || process.env.ADMIN_EMAIL,
        subject,
        html,
        attachments: [
            {
                filename: attachmentName,
                content: attachmentFile,
            },
        ],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}: ${info.response}`);
        return info;
    } catch (error) {
        console.error('Error sending email: ', error);
        return null;
    }
}

export async function main() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const distinctHospital = await pool.query(`
        SELECT DISTINCT hospital_name, email, project_id
        FROM master_sheet
        WHERE registration_date::date = $1
    `, [todayString]);

    for (const hospital of distinctHospital.rows) {
        const { hospital_name, email, project_id } = hospital;
        // if (!email) continue;

        const { rows } = await pool.query(`
            SELECT sample_id, internal_id, patient_name, age, test_name, doctor_name
            FROM master_sheet
            WHERE hospital_name = $1 AND registration_date::date = $2
        `, [hospital_name, todayString]);

        if (rows.length === 0) continue;

        const fields = ["sample_id", "internal_id", "patient_name", "age", "test_name", "doctor_name"];
        const parser = new Parser({ fields });
        const csv = parser.parse(rows);

        await sendRegistrationMail({
            // email, // ✅ send to hospital's actual email
            email: 'spoc@strivebiocorp.com',
            subject: `Registration Report for ${hospital_name} on ${todayString}`,
            html: `
                <html>
                <body>
                    <p>Dear ${hospital_name},</p>
                    <p>You have successfully registered samples with <b>Project ID: ${project_id}</b>.</p>
                    <p>Please find the attached file for details.</p>
                    <p>Thank You,<br/>Neom Scientific Solutions</p>
                </body>
                </html>
            `,
            attachmentName: `registration_report_${hospital_name}_${todayString}.csv`,
            attachmentFile: csv,
        });
    }
}
