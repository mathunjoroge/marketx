import { authenticator } from 'otplib';
const secret = 'J5RH5RFO5URAEN5DBJ6PARVSYMBPGBDL';
const token = authenticator.generate(secret);
console.log('TOTP_CODE:' + token);
