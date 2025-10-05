import nodemailer from 'nodemailer';

export async function sendMail(email, subject, html) {
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });

    // console.log('admin_email', process.env.ADMIN_EMAIL);

    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: email || process.env.ADMIN_EMAIL, // Default to admin email if no email is provided
        subject: subject,
        html: html,
    };
    let info = {};
    try {
        info = await transporter.sendMail(mailOptions);
        // console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
    return info;
}