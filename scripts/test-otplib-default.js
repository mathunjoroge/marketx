const otplib = require('otplib');

console.log('otplib keys:', Object.keys(otplib));

const authenticator = otplib.default;
console.log('authenticator:', typeof authenticator);

if (authenticator) {
    console.log('authenticator keys:', Object.keys(authenticator));
    try {
        const secret = authenticator.generateSecret();
        console.log('Generated secret:', secret);

        const token = authenticator.generate(secret);
        console.log('Generated token:', token);

        const valid = authenticator.check(token, secret);
        console.log('Is valid:', valid);
    } catch (e) {
        console.error('Error using authenticator:', e);
    }
}
