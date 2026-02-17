const { generateSecret, generate, verify, generateURI } = require('otplib');

async function test() {
    try {
        const secret = generateSecret();
        console.log('Secret:', secret);

        const token = await generate({ secret });
        console.log('Token:', token);

        const isValid = await verify({ token, secret });
        console.log('IsValid (simple):', isValid);

        const isValidWindow = await verify({
            token,
            secret,
            window: 1 // Attempting window option
        });
        console.log('IsValid (window=1):', isValidWindow);

        // Test array window if that was the old style
        const isValidWindowArray = await verify({
            token,
            secret,
            window: [1, 1]
        });
        console.log('IsValid (window=[1,1]):', isValidWindowArray);

    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
