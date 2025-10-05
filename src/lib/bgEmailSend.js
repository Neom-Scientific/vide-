// import cron from 'node-cron';
// import { main } from './sendRegistrationMail.js';

// function scheduleDailyEmail() {
//     const intervalMs = 60 * 60 * 1000; // check every 1 hour
//     let lastRunDate = null;

//     const timer = setInterval(async () => {
//         const now = new Date();
//         const currentHour = now.getHours();
//         const todayStr = now.toISOString().split('T')[0];

//         if (currentHour === 18 && lastRunDate !== todayStr) {
//             console.log(`[${now.toISOString()}] Running daily registration email job...`);
//             try {
//                 await main();
//                 lastRunDate = todayStr;
//             } catch (err) {
//                 console.error('Error during daily email job:', err);
//             }
//         }
//     }, intervalMs);
// }

// cron.schedule('0 18 * * *', async () => {
//     console.log(`[${new Date().toISOString()}] Running 6PM registration mail`);
//     await main();
// });

// scheduleDailyEmail();
// bgEmailSend.js
import cron from 'node-cron';
import { main } from './sendRegistrationMail.js';

// Schedule to run every day at 6 PM (18:00)
cron.schedule('0 18 * * *', async () => {
    const now = new Date().toISOString();
    console.log(`[${now}] Running 6PM registration email job...`);
    try {
        await main();
        console.log(`[${now}] Email job completed.`);
    } catch (err) {
        console.error(`[${now}] Error during daily email job:`, err);
    }
});
