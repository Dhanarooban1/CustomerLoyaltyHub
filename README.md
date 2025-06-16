# Customer Loyalty Hub

A robust customer loyalty platform that helps businesses engage with their customers through targeted campaigns and rewards.

## Environment Setup

1. Copy `.env.example` to `.env` and fill in your own values.
2. Make sure you have a Postgres database set up (like Neon DB).
3. Set up Twilio credentials for SMS and WhatsApp messaging.

## Running the Application

### On Windows:
To start the development server on Windows, use one of these methods:
1. Run the batch file: `.\start-dev.bat`
2. Use npm script: `npm run dev`

### On Mac/Linux:
Use the npm script: `npm run dev`

## New Feature: WhatsApp Messaging

The platform now supports sending messages to customers via WhatsApp using the Twilio WhatsApp API. This feature offers improved international delivery rates compared to standard SMS.

### Setup Instructions

1. Sign up for a Twilio account if you don't already have one.
2. Set up Twilio WhatsApp API access in your Twilio account.
3. Add the following environment variables to your environment:
   - `TWILIO_ACCOUNT_SID`: Your Twilio account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio auth token
   - `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number (in the format `+1234567890`)

### Using WhatsApp Messaging

1. Create a campaign and set it to "Active" status.
2. On the campaign card, click the "Send WhatsApp Messages" button.
3. The system will send WhatsApp messages to all customers in your database with information about the campaign and a link to participate.

### Benefits of WhatsApp over SMS

- Better international delivery rates
- Rich media support
- Read receipts
- No carrier fees for customers with data plans
- Familiar interface for many customers

### Troubleshooting

- Make sure phone numbers are in the correct international format (e.g., `+1234567890`).
- For Twilio's WhatsApp sandbox, customers must first opt-in by sending a message to your Twilio WhatsApp number.
- Check the Twilio console for delivery status and any error messages.

## Other Features

- Create and manage marketing campaigns
- Track customer submissions and engagement
- Approve or reject customer-submitted content
- Manage customer database with bulk import capabilities
