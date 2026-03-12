require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Resend
// Note: To send emails, you must configure RESEND_API_KEY in a .env file or Render environment
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project directory
app.use(express.static(__dirname));

// Initialize PostgreSQL (Supabase) Database connection
// In production, this should be set via environment variable DATABASE_URL
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:BDyLV2x0L1r2iYPD@db.fztctnfuxbtmqgqcmvyq.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Supabase connections
    }
});

// Create table if it doesn't exist on startup
pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        "fullName" VARCHAR(255),
        gender VARCHAR(50),
        "ageRange" VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        campus VARCHAR(255),
        "attendChurch" VARCHAR(10),
        "churchLocation" VARCHAR(255),
        "churchRole" VARCHAR(100),
        "hearAbout" VARCHAR(100),
        "attendingWithOthers" VARCHAR(10),
        "othersCount" INTEGER,
        "busLocation" VARCHAR(100),
        "pickupAvailable" VARCHAR(10),
        "requireAccommodation" VARCHAR(10),
        "accommodationDetails" TEXT,
        "receiveUpdates" VARCHAR(10),
        "updatePreference" TEXT,
        "prayerRequest" TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => {
    console.log('Connected to the Supabase PostgreSQL database.');
}).catch((err) => {
    console.error('Error creating table or connecting to database:', err.message);
});

// Registration API Endpoint
app.post('/api/register', async (req, res) => {
    const data = req.body;
    
    // Normalize array of preferences to a string
    const updatePref = Array.isArray(data.updatePreference) ? data.updatePreference.join(', ') : (data.updatePreference || '');

    const insertQuery = `
        INSERT INTO registrations (
            "fullName", gender, "ageRange", phone, email, city, state, campus,
            "attendChurch", "churchLocation", "churchRole", "hearAbout", "attendingWithOthers",
            "othersCount", "busLocation", "pickupAvailable", "requireAccommodation",
            "accommodationDetails", "receiveUpdates", "updatePreference", "prayerRequest"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id
    `;

    const params = [
        data.fullName, data.gender, data.ageRange, data.phone, data.email, data.city, data.state, data.campus,
        data.attendChurch, data.churchLocation, data.churchRole, data.hearAbout, data.attendingWithOthers,
        data.othersCount ? parseInt(data.othersCount) : null, data.busLocation, data.pickupAvailable, data.requireAccommodation,
        data.accommodationDetails, data.receiveUpdates, updatePref, data.prayerRequest
    ];

    try {
        const result = await pool.query(insertQuery, params);
        const newId = result.rows[0].id;

        // Send Confirmation Email using Resend
        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    // Must be a verified domain in Resend. Adjust 'onboarding@resend.dev' for testing if needed.
                    from: 'All Believers Conference <onboarding@resend.dev>', 
                    to: [data.email],
                    subject: 'All Believers Conference - Registration Confirmed',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #D4AF37;">Registration Confirmed!</h2>
                            <p>Dear ${data.fullName},</p>
                            <p>Thank you for registering for the <strong>All Believers Conference</strong>.</p>
                            <p>We are excited to see you there! Your participation helps us prepare adequately to host you.</p>
                            <br>
                            <p>Blessings,</p>
                            <p><strong>Evangelist Elisha Olorunda</strong><br>Eternity Echoes Global Ministries</p>
                        </div>
                    `
                });
            } catch (emailErr) {
                console.error('Failed to send email:', emailErr);
            }
        } else {
            console.log('Skipping email. No RESEND_API_KEY provided.');
        }

        res.json({ success: true, id: newId });
    } catch (err) {
        console.error('DB Error:', err.message);
        return res.status(500).json({ error: 'Failed to save registration to database.' });
    }
});

// Admin API Endpoint (Get all registrations)
app.get('/api/admin/registrations', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM registrations ORDER BY created_at DESC`);
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`App mapping:`);
    console.log(`Homepage: http://localhost:${port}/index.html`);
    console.log(`Conference form: http://localhost:${port}/conference.html`);
    console.log(`Admin panel: http://localhost:${port}/admin.html`);
});
