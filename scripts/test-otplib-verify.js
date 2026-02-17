const { verify, generateSecret, generate } = require('otplib');

const secret = generateSecret(); // or just use a string
const token = generate(secret); // Does generate exist? 'generate' is in the keys list.

console.log('Secret:', secret);
console.log('Token:', token);

// Test verify
try {
    const result = verify({
        token: token,
        secret: secret,
        window: [1, 1]
    });
    console.log('Verify result:', result, 'Type:', typeof result);
} catch (e) {
    console.error('Verify error:', e);
}

// Test invalid
try {
    const result = verify({
        token: '000000',
        secret: secret,
        window: [1, 1]
    });
    console.log('Invalid Verify result:', result, 'Type:', typeof result);
} catch (e) {
    console.error('Verify error:', e);
}
