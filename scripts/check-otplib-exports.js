try {
    const otplib = require('otplib');
    console.log('otplib exports:', Object.keys(otplib));
} catch (e) {
    console.error(e);
}
