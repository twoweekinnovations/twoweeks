import os
import logging
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "thalia0419<3")

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Email settings
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')  # SMTP Server (e.g., Gmail)
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))  # SMTP Port (587 for Gmail)
SENDER_EMAIL = os.environ.get('EMAIL_FROM', '')  # Sender's email address
SENDER_PASSWORD = os.environ.get('EMAIL_PASS', 'iznf hcqu wplo cblw')  # Sender's email password or app-specific password
RECEIVER_EMAIL = os.environ.get('EMAIL_TO', 'twoweekinnovations@gmail.com')  # Receiver's email address

# Product catalog organized by categories (in a real app, this would come from a database)
PRODUCTS = [
    # Electronics Category
    {"id": 1, "category": "Electronics", "name": "AirPods Pro 2", "price": 139.00, "description": "Active Noise Cancellation and Transparency mode", "available": True},
    {"id": 2, "category": "Electronics", "name": "AirPods 3rd Generation", "price": 99.00, "description": "Spatial Audio with dynamic head tracking", "available": True},
    {"id": 3, "category": "Electronics", "name": "AirPods 2nd Generation", "price": 89.00, "description": "Double-tap to play or skip forward", "available": True},
    {"id": 4, "category": "Electronics", "name": "AirPods Max", "price": None, "description": "Coming soon - High-fidelity audio with Active Noise Cancellation", "available": False},
    {"id": 5, "category": "Electronics", "name": "AirPods 4 ANC", "price": None, "description": "Coming soon - Next generation AirPods with ANC", "available": False},
    {"id": 6, "category": "Electronics", "name": "Apple Lightning Cable", "price": None, "description": "Coming soon - Official Apple Lightning Cable", "available": False},
    {"id": 7, "category": "Electronics", "name": "Apple Watch SE", "price": None, "description": "Coming soon - The affordable Apple Watch option", "available": False},
    
    # Accessories Category
    {"id": 8, "category": "Accessories", "name": "UGGs Tasman", "price": 79.00, "description": "Comfortable and stylish boots", "available": True},
    {"id": 9, "category": "Accessories", "name": "Crocs", "price": None, "description": "Coming soon - Comfortable casual footwear", "available": False},
    {"id": 10, "category": "Accessories", "name": "Nike Dunks", "price": None, "description": "Coming soon - Classic Nike sneakers", "available": False}
]

# List of schools for delivery/pickup
SCHOOLS = [
    "Saint Charles Preparatory",
    "Madison Christian",
    "Bishop Ready",
    "Fisher Catholic",
    "Other"
]

# Discount codes and their amounts
DISCOUNT_CODES = {
    # Original codes
    "WELCOME10": 10.00,    # $10 off
    "STUDENT25": 25.00,    # $25 off
    "APPLE15": 15.00,      # $15 off
    "SCHOOL20": 20.00,     # $20 off
    
    # Additional codes
    "CODE": 1.00,          # $1 off
    "20SCPS25": 29.00,     # $29 off
    "20MCHS25": 29.00,     # $29 off
    "20PHS25": 29.00,      # $29 off
    "20FCHS25": 29.00,     # $29 off
    "20TLS25": 29.00,      # $29 off
    "K1G3R5P3C1AL": 49.00, # $49 off
    "M0RAL3S5W1LTR0N5P3C1AL": 49.00, # $49 off
    "IRP2NMBUNDLE": 58.00, # $58 off
    "0930SPOOKY": 63.00,   # $63 off
    "0214HUZZ": 69.00,     # $69 off
    "12HISBIRTH25": 75.00, # $75 off
    "777LUCKY777": 107.00, # $107 off
    "03SUPERBUNDLE06": 129.00, # $129 off
    "Y0UW1N816": 200.00,   # $200 off
    "8UY1N8U1K4M0R3CA5H": 499.00, # $499 off
    "SHH010309060609": 99999.00 # $99999 off (effectively free)
}

@app.route('/')
def index():
    """Render the product selection page"""
    return render_template('index.html', products=PRODUCTS)

@app.route('/about')
def about():
    """Render the about page"""
    return render_template('about.html')

@app.route('/terms')
def terms():
    """Render the terms and conditions page"""
    return render_template('terms.html')

# Download route removed

@app.route('/checkout')
def checkout():
    """Render the checkout page"""
    return render_template('checkout.html', schools=SCHOOLS)

@app.route('/submit_order', methods=['POST'])
def submit_order():
    """Process order submission and send email notification"""
    try:
        data = request.json
        name = data.get('name')
        school = data.get('school')
        cart = data.get('cart', [])
        total = data.get('total', '0.00')
        email = data.get('email')
        phone = data.get('phone', 'Not provided')
        
        # Validate the data
        if not name or not school or not cart:
            return jsonify({"error": "Missing required fields"}), 400

        # Get discount information
        discount_code = data.get('discount_code', '')
        discount_amount = data.get('discount_amount', 0)
        subtotal = data.get('subtotal', total)
        
        # Prepare email content
        subject = 'New Order Received'
        
        # Create HTML body
        html_body = f"""
        <html>
        <body>
            <h2>New Order Details</h2>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>School:</strong> {school}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Phone:</strong> {phone}</p>
            <h3>Order Items:</h3>
            <table border="1" cellpadding="5">
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                </tr>
        """
        
        # Add each item to the table
        for item in cart:
            html_body += f"""
                <tr>
                    <td>{item['name']}</td>
                    <td>${item['price']}</td>
                </tr>
            """
        
        # Add discount and total information
        discount_html = ""
        if discount_code and float(discount_amount) > 0:
            discount_html = f"""
                <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td>${subtotal}</td>
                </tr>
                <tr>
                    <td><strong>Discount Code:</strong></td>
                    <td>{discount_code}</td>
                </tr>
                <tr>
                    <td><strong>Discount Amount:</strong></td>
                    <td>-${discount_amount}</td>
                </tr>
            """
            
        html_body += f"""
            </table>
            {discount_html}
            <p><strong>Total:</strong> ${total}</p>
        </body>
        </html>
        """

        # Create plain text version
        text_body = f"Name: {name}\nSchool: {school}\nEmail: {email}\nPhone: {phone}\n\nOrder Items:\n"
        for item in cart:
            text_body += f"- {item['name']}: ${item['price']}\n"
        
        # Add discount info to text version
        if discount_code and float(discount_amount) > 0:
            text_body += f"\nSubtotal: ${subtotal}\nDiscount Code: {discount_code}\nDiscount Amount: -${discount_amount}"
            
        text_body += f"\nTotal: ${total}"
        
        # Create the email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL
        
        # Attach both versions
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email if credentials are provided
        if SENDER_EMAIL and SENDER_PASSWORD and RECEIVER_EMAIL:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
            server.quit()
            app.logger.info(f"Order email sent to {RECEIVER_EMAIL}")
        else:
            app.logger.warning("Email credentials not configured - skipping email send")
        
        # Store order ID in session for confirmation page
        session['order_name'] = name
        session['order_school'] = school
        
        return jsonify({
            "success": True, 
            "message": "Order submitted successfully!"
        })
    
    except Exception as e:
        app.logger.error(f"Error submitting order: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/validate-discount', methods=['POST'])
def validate_discount():
    """Validate a discount code and return the discount amount"""
    try:
        data = request.json
        code = data.get('code', '').strip().upper()
        
        # Check if the code exists
        if code in DISCOUNT_CODES:
            discount_amount = DISCOUNT_CODES[code]
            return jsonify({
                "valid": True,
                "discount": discount_amount,
                "message": f"Discount of ${discount_amount:.2f} applied!"
            })
        else:
            return jsonify({
                "valid": False,
                "discount": 0,
                "message": "Invalid discount code."
            })
    
    except Exception as e:
        app.logger.error(f"Error validating discount code: {str(e)}")
        return jsonify({
            "valid": False,
            "discount": 0,
            "message": "An error occurred while validating the discount code."
        }), 500

@app.route('/confirmation')
def confirmation():
    """Show order confirmation page"""
    name = session.get('order_name', '')
    school = session.get('order_school', '')
    return render_template('confirmation.html', name=name, school=school)

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
