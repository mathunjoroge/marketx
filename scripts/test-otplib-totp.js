const { TOTP } = require('otplib');

try {
    const totp = new TOTP();
    console.log('TOTP instance created');

    const secret = totp.generateSecret();
    console.log('Secret:', secret);

    const token = totp.generate({ secret }); // or totp.generate(secret)
    console.log('Token:', token);

    const valid = totp.check(token, secret);
    console.log('Valid:', valid);

    const verifyResult = totp.verify({ token, secret });
    console.log('Verify Result:', verifyResult);

} catch (e) {
    console.error('TOTP error:', e);
    // Try without options object for generate
    try {
        const totp = new TOTP();
        const s = totp.generateSecret();
        const t = totp.generate(s);
        console.log('Token (arg):', t);
    } catch (e2) {
        console.error('TOTP generate arg error:', e2);
    }
}
