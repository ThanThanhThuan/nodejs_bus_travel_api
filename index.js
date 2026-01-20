require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer'); // Import Nodemailer
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-travel')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// --- NODEMAILER SETUP ---
// Make sure to add EMAIL_USER and EMAIL_PASS to your .env file
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use an App Password for Gmail
    },
});

// --- ROUTES ---

// 1. POST: Create Booking & Send Email
app.post('/api/book', async (req, res) => {
    try {
        const { name, email, phone, destination } = req.body;

        const newBooking = new Booking({ name, email, phone, destination });
        await newBooking.save();

        // Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email, // Send to the user who booked
            subject: 'Bus Travel - Booking Confirmation',
            text: `Hello ${name},\n\nYour trip to ${destination} has been confirmed!\nWe will contact you at ${phone} shortly.\n\nSafe Travels,\nBusTraveller Team`
        };

        // Note: We don't await this to avoid blocking the response if email is slow
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.status(201).json({ message: 'Trip booked successfully!', booking: newBooking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to book trip' });
    }
});

// 2. GET: Admin - Fetch All Bookings
app.get('/api/bookings', async (req, res) => {
    try {
        // In a real app, you would add middleware here to check for an Admin Token
        const bookings = await Booking.find().sort({ date: -1 }); // Newest first
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));