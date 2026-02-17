const { authenticator } = require('otplib');
const bcrypt = require('bcryptjs');

async function test2FALogic() {
    console.log('--- Testing 2FA Logic ---');

    // 1. Generate secret
    const secret = authenticator.generateSecret();
    console.log('Secret generated:', secret);

    // 2. Generate token
    const token = authenticator.generate(secret);
    console.log('Token generated:', token);

    // 3. Verify token
    const isValid = authenticator.check(token, secret);
    console.log('Token verification:', isValid ? 'SUCCESS' : 'FAILED');

    if (isValid) {
        console.log('2FA Logic is sound.');
    } else {
        console.log('2FA Logic failed verification!');
        process.exit(1);
    }
}

test2FALogic();
