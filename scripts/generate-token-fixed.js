const { generate } = require('otplib');

const secret = 'RFHSJPIOXWP3A6T5WI64SSMQEINVEC3F';

async function getToken() {
    try {
        const token = await generate({ secret });
        console.log('Token:', token);
    } catch (e) {
        console.error(e);
    }
}

getToken();
