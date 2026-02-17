import { generate } from 'otplib';
const secret = 'J5RH5RFO5URAEN5DBJ6PARVSYMBPGBDL';

async function main() {
    const token = await generate({ secret });
    console.log('TOTP_CODE:' + token);
}

main();
