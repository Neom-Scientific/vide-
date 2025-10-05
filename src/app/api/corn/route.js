import { main } from "@/lib/sendRegistrationMail";

export async function GET() {
    try {
      await main(); // this will run your email logic
      return new Response('Email sent successfully', { status: 200 });
    } catch (error) {
      console.error('Error sending email:', error);
      return new Response('Error occurred', { status: 500 });
    }
  }