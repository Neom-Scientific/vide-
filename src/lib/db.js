const { Pool } = require("pg");

export const pool = new Pool({
    // user: process.env.DB_USER,
    // host: process.env.DB_HOST,
    // database: process.env.DB_NAME,
    // password: process.env.DB_PASSWORD,
    // port: process.env.DB_PORT,
    connectionString: process.env.CONNECTION_STRING,
    ssl: {
        rejectUnauthorized: false
    }
})
pool.connect()
.then(()=>{
    console.log("Connected to the database");
})
.catch((err) => {
    console.error("Error connecting to the database", err);
});

