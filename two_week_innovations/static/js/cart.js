/**
 * Cart management functionality
 */

// Initialize cart state from session storage or empty
let cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
let total = parseFloat(sessionStorage.getItem('total') || '0');
let subtotal = total;
let discountAmount = 0;
let discountCode = '';

// Update cart display
function displayCart() {
    const cartElement = document.getElementById('cart');
    const totalElement = document.getElementById('total');
    
    if (!cartElement || !totalElement) return;
    
    if (cart.length === 0) {
        cartElement.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
        
        // Reset totals when cart is empty
        subtotal = 0;
        total = 0;
        
        // Keep discount code but update display
        updateDiscountDisplay();
    } else {
        let cartHTML = '';
        cart.forEach((item, index) => {
            cartHTML += `
                <div class="cart-item">
                    <div>${item.name}</div>
                    <div class="d-flex align-items-center">
                        <div class="me-3">$${item.price.toFixed(2)}</div>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${index})">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        cartElement.innerHTML = cartHTML;
    }
    
    totalElement.textContent = total.toFixed(2);
    
    // Update the checkout button state
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
    
    // Update cart counter
    updateCartCounter();
}

// Add item to cart
function addToCart(id, name, price) {
    cart.push({ id, name, price });
    
    // Update totals
    subtotal += price;
    total = calculateTotalWithDiscount(subtotal, discountAmount);
    
    // Save to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));
    sessionStorage.setItem('total', total.toString());
    
    // Update display
    displayCart();
    updateDiscountDisplay();
    
    // Show confirmation tooltip
    showAddedToCartMessage(name);
}

// Remove item from cart
function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        subtotal -= cart[index].price;
        cart.splice(index, 1);
        
        // Update total with discount
        total = calculateTotalWithDiscount(subtotal, discountAmount);
        
        // Save to session storage
        sessionStorage.setItem('cart', JSON.stringify(cart));
        sessionStorage.setItem('total', total.toString());
        
        // Update display
        displayCart();
        updateDiscountDisplay();
    }
}

// Clear the entire cart
function clearCart() {
    cart = [];
    subtotal = 0;
    total = 0;
    
    // Optional: Also clear the discount code when clearing cart
    // Uncomment these to also clear discount when emptying cart
    // discountCode = '';
    // discountAmount = 0;
    // sessionStorage.removeItem('discountCode');
    // sessionStorage.removeItem('discountAmount');
    
    // Save to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));
    sessionStorage.setItem('total', total.toString());
    
    // Update display
    displayCart();
    updateDiscountDisplay();
}

// Navigate to checkout
function goToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items before proceeding to checkout.');
        return;
    }
    
    window.location.href = '/checkout';
}

// Show a message when item is added to cart
function showAddedToCartMessage(productName) {
    // Create toast element if it doesn't exist
    if (!document.getElementById('cart-toast')) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'cart-toast';
        toastDiv.className = 'toast position-fixed bottom-0 end-0 m-3';
        toastDiv.setAttribute('role', 'alert');
        toastDiv.setAttribute('aria-live', 'assertive');
        toastDiv.setAttribute('aria-atomic', 'true');
        toastDiv.innerHTML = `
            <div class="toast-header">
                <strong class="me-auto">Shopping Cart</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                <span id="toast-message"></span>
            </div>
        `;
        document.body.appendChild(toastDiv);
    }
    
    // Set the message and show the toast
    document.getElementById('toast-message').textContent = `${productName} added to cart`;
    const toastElement = new bootstrap.Toast(document.getElementById('cart-toast'));
    toastElement.show();
}

// Update the cart counter in the header
function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        counter.textContent = cart.length;
        counter.style.display = cart.length > 0 ? 'inline-block' : 'none';
    }
}

// Apply a discount code
function applyDiscount() {
    const discountCodeInput = document.getElementById('discount-code');
    const discountFeedback = document.getElementById('discount-feedback');
    const applyBtn = document.getElementById('apply-discount-btn');
    
    if (!discountCodeInput || !discountFeedback) return;
    
    const code = discountCodeInput.value.trim().toUpperCase();
    if (!code) {
        discountFeedback.innerHTML = '<div class="text-danger">Please enter a discount code.</div>';
        return;
    }
    
    // Show loading state
    const originalBtnText = applyBtn.innerHTML;
    applyBtn.disabled = true;
    applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
    // Send the code to the server for validation
    fetch('/validate-discount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code })
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            // Valid discount code
            discountCode = code;
            discountAmount = parseFloat(data.discount);
            
            // Update total
            total = calculateTotalWithDiscount(subtotal, discountAmount);
            
            // Update displays
            // Special message if discount makes the order free
            const newTotal = calculateTotalWithDiscount(subtotal, discountAmount);
            if (newTotal === 0 && subtotal > 0) {
                discountFeedback.innerHTML = `<div class="text-success">Wow! Your order is free with this discount code!</div>`;
            } else {
                discountFeedback.innerHTML = `<div class="text-success">${data.message}</div>`;
            }
            updateDiscountDisplay();
            displayCart(); // Update total display
            
            // Store in session if needed later
            sessionStorage.setItem('discountCode', discountCode);
            sessionStorage.setItem('discountAmount', discountAmount.toString());
            sessionStorage.setItem('total', total.toString());
        } else {
            // Invalid code
            discountFeedback.innerHTML = `<div class="text-danger">${data.message}</div>`;
        }
        
        // Reset button
        applyBtn.disabled = false;
        applyBtn.innerHTML = originalBtnText;
    })
    .catch(error => {
        console.error('Error:', error);
        discountFeedback.innerHTML = '<div class="text-danger">Error validating discount code. Please try again.</div>';
        applyBtn.disabled = false;
        applyBtn.innerHTML = originalBtnText;
    });
}

// Calculate total with discount applied
function calculateTotalWithDiscount(subtotal, discount) {
    if (!subtotal || subtotal <= 0) return 0;
    
    // Apply discount but never go below 0
    // This ensures the total can never go negative even with large discount codes
    return Math.max(0, subtotal - discount);
}

// Update discount display elements
function updateDiscountDisplay() {
    const discountInfo = document.getElementById('discount-info');
    const subtotalElement = document.getElementById('subtotal');
    const discountAmountElement = document.getElementById('discount-amount');
    
    if (!discountInfo || !subtotalElement || !discountAmountElement) return;
    
    if (discountAmount > 0 && subtotal > 0) {
        subtotalElement.textContent = subtotal.toFixed(2);
        discountAmountElement.textContent = discountAmount.toFixed(2);
        discountInfo.style.display = 'block';
    } else {
        discountInfo.style.display = 'none';
    }
}

// Submit the order via AJAX
function submitOrder() {
    // Get form data
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    // Handle school selection with "Other" option
    let school = document.getElementById('school').value;
    if (school === 'Other') {
        const otherSchool = document.getElementById('other-school').value.trim();
        if (otherSchool) {
            school = otherSchool;
        }
    }
    
    const termsChecked = document.getElementById('terms').checked;
    
    // Validate form
    let isValid = true;
    let errorMessage = '';
    
    if (!name) {
        isValid = false;
        errorMessage += 'Name is required.\n';
        document.getElementById('name').classList.add('is-invalid');
    } else {
        document.getElementById('name').classList.remove('is-invalid');
    }
    
    if (!email || !isValidEmail(email)) {
        isValid = false;
        errorMessage += 'A valid email is required.\n';
        document.getElementById('email').classList.add('is-invalid');
    } else {
        document.getElementById('email').classList.remove('is-invalid');
    }
    
    if (!school) {
        isValid = false;
        errorMessage += 'Please select a school.\n';
        document.getElementById('school').classList.add('is-invalid');
    } else {
        document.getElementById('school').classList.remove('is-invalid');
        
        // Validate the "Other" school field if it's displayed
        if (document.getElementById('school').value === 'Other') {
            const otherSchoolInput = document.getElementById('other-school');
            if (!otherSchoolInput.value.trim()) {
                isValid = false;
                errorMessage += 'Please specify your school.\n';
                otherSchoolInput.classList.add('is-invalid');
            } else {
                otherSchoolInput.classList.remove('is-invalid');
            }
        }
    }
    
    if (!termsChecked) {
        isValid = false;
        errorMessage += 'You must agree to the terms & conditions.\n';
        document.getElementById('terms-feedback').style.display = 'block';
    } else {
        document.getElementById('terms-feedback').style.display = 'none';
    }
    
    if (cart.length === 0) {
        isValid = false;
        errorMessage += 'Your cart is empty.\n';
    }
    
    if (!isValid) {
        alert('Please correct the following errors:\n' + errorMessage);
        return;
    }
    
    // Show loading state
    const submitButton = document.getElementById('submit-order-btn');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // Prepare order data
    const orderData = {
        name: name,
        email: email,
        phone: phone,
        school: school,
        cart: cart,
        total: total.toFixed(2),
        subtotal: subtotal.toFixed(2),
        discount_code: discountCode,
        discount_amount: discountAmount.toFixed(2)
    };
    
    // Send order to server
    fetch('/submit_order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear cart and discount info from session storage, then redirect
            sessionStorage.removeItem('cart');
            sessionStorage.removeItem('total');
            sessionStorage.removeItem('discountCode');
            sessionStorage.removeItem('discountAmount');
            window.location.href = '/confirmation';
        } else {
            // Show error message
            alert('Error: ' + (data.error || 'Unknown error occurred'));
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit order. Please try again.');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    });
}

// Validate email format
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Initialize cart display when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load initial cart state - includes calculating subtotal
    subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price;
    });
    
    // Restore discount code and amount if available
    const savedDiscountCode = sessionStorage.getItem('discountCode');
    const savedDiscountAmount = sessionStorage.getItem('discountAmount');
    
    if (savedDiscountCode && savedDiscountAmount) {
        discountCode = savedDiscountCode;
        discountAmount = parseFloat(savedDiscountAmount);
        
        // Update total with discount
        total = calculateTotalWithDiscount(subtotal, discountAmount);
        
        // If we're on the checkout page, display the discount code
        const discountCodeInput = document.getElementById('discount-code');
        const discountFeedback = document.getElementById('discount-feedback');
        if (discountCodeInput && discountFeedback) {
            discountCodeInput.value = discountCode;
            
            // Special message if order is free with this discount
            if (total === 0 && subtotal > 0) {
                discountFeedback.innerHTML = `<div class="text-success">Wow! Your order is free with this discount code!</div>`;
            } else {
                discountFeedback.innerHTML = `<div class="text-success">Discount of $${discountAmount.toFixed(2)} applied!</div>`;
            }
        }
    }
    
    // Display cart and discount info
    displayCart();
    updateDiscountDisplay();
    
    // Add validation behaviors to form inputs if on checkout page
    if (document.getElementById('checkout-form')) {
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.value.trim() === '' && this.hasAttribute('required')) {
                    this.classList.add('is-invalid');
                } else {
                    this.classList.remove('is-invalid');
                }
                
                // Special validation for email
                if (this.id === 'email' && this.value.trim() !== '') {
                    if (!isValidEmail(this.value.trim())) {
                        this.classList.add('is-invalid');
                    } else {
                        this.classList.remove('is-invalid');
                    }
                }
            });
        });
    }
});
