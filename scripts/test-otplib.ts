import { authenticator } from 'otplib';

// Check if verify exists on the default export or named export
try {
    const otplib = require('otplib');
    console.log('otplib exports:', Object.keys(otplib));

    if (otplib.verify) {
        console.log('verify is exported directly');
    } else {
        console.log('verify is NOT exported directly');
    }
} catch (e) {
    console.error('Error requiring otplib:', e);
}

// Test standard usage
const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
const isValid = authenticator.check(token, secret);
console.log('Standard usage valid:', isValid);
