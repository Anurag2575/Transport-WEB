# Transport WEB

A web application for connecting shippers with carriers through a bidding system.

## Features

- User registration and authentication
- Load uploading and management
- Competitive bidding system with time limits
- Search functionality by origin and destination
- User profiles with verification status
- Complaint system

## Technologies

- Node.js
- Express.js
- EJS templating
- MongoDB with Mongoose
- Passport.js for authentication
- Multer for file uploads

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up MongoDB
4. Create a `.env` file with your configuration
5. Run the application: `npm start`

## Usage

- Register an account
- Upload loads with bidding timeframes
- Browse and bid on available loads
- View user profiles and track records

## Project Structure

```
/
├── models/          # Database models
├── routes/          # Route handlers
├── views/           # EJS templates
│   ├── layouts/     # Layout templates
│   └── pages/       # Page templates
├── public/          # Static files
│   ├── css/         # Stylesheets
│   ├── js/          # JavaScript files
│   └── images/      # Uploaded images
├── middleware/      # Custom middleware
├── controllers/     # Business logic (if separated)
├── config/          # Configuration files
├── utils/           # Utility functions
├── server.js        # Main application file
├── package.json     # Dependencies and scripts
└── .env             # Environment variables
```