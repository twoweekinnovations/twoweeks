# Two Week Innovations

A dynamic e-commerce platform for Two Week Innovations that offers tech products through direct sourcing and smart pricing.

## Setup Instructions

### 1. Install Python
Make sure you have Python 3.11 or newer installed.

### 2. Create a Virtual Environment
```
python -m venv venv
```

### 3. Activate the Virtual Environment
- Windows: 
```
venv\Scripts\activate
```
- Mac/Linux: 
```
source venv/bin/activate
```

### 4. Install Dependencies
```
pip install -r requirements.txt
```

### 5. Set Up Environment Variables
1. Copy the `.env.example` file to `.env`
2. Fill in your email credentials and other settings

### 6. Run the Application
```
python main.py
```

The website will be available at `http://localhost:5000`

## Features
- Product catalog with available and coming soon items
- Shopping cart functionality with persistent storage
- Checkout system with school selection
- Discount code system
- Email notifications for new orders
- About page with company information

## Email Configuration
To receive order notifications, you need to:
1. Use a Gmail account
2. Generate an App Password for your Gmail
3. Configure the `.env` file with your credentials

## Hosting Options
- Shared hosting (e.g., HostGator, Bluehost)
- Cloud services (Heroku, PythonAnywhere)
- VPS/Dedicated servers (DigitalOcean, AWS)

For production, you may want to use a proper web server like Nginx or Apache with Gunicorn.