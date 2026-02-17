const { generate } = require('otplib');

const secret = 'RFHSJPIOXWP3A6T5WI64SSMQEINVEC3F';
const token = generate(secret); // using default options (sync?)
// Wait, generate is async in v13? 
// README says: const token = await generate({ secret });
// But my valid test used await.

async function getToken() {
    try {
        // v13 requires object
        const token = await generate({ secret });
        console.log('Token:', token);
    } catch (e) {
        console.error(e);
    }
}

getToken();
