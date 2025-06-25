require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname))); // Serves index.html, style.css, images etc.

let latestHTML = ''; // Store live invoice content

// Endpoint to receive and store the HTML content
app.post('/cache-html', (req, res) => {
  latestHTML = req.body.html || '';
  res.status(200).send({ message: 'HTML cached successfully' });
});

// Serve the cached invoice with full HTML and styles
app.get('/invoice', (req, res) => {
  res.send(latestHTML);
});

app.post('/send-invoice', async (req, res) => {
  const { email } = req.body;

  try {
    const browser = await puppeteer.launch({
  executablePath: '/opt/render/project/.render/chrome/opt/google/chrome/chrome', // This is Render's path to Chromium
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});


    const page = await browser.newPage();
    await page.goto(`${process.env.PUBLIC_URL}/invoice`, {
      waitUntil: 'networkidle0',
    });

    const pdfPath = path.join(__dirname, 'invoice.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true, // Keep colors, backgrounds, etc.
    });

    await browser.close();

    // Send email with PDF
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: 'IGWE Industries <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Your Invoice PDF',
      text: 'Please find your invoice attached.',
      attachments: [
        {
          filename: 'invoice.pdf',
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    fs.unlinkSync(pdfPath);
    res.status(200).json({ message: '✅ Invoice sent successfully!' });
  } catch (err) {
    console.error('EMAIL ERROR:', err);
    res.status(500).json({ message: '❌ Failed to send invoice.', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at ${process.env.PUBLIC_URL}`);
});
