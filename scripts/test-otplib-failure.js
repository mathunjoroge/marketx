const { generateSecret, generate, verify } = require('otplib');

async function test() {
    try {
        const secret = generateSecret();
        const token = await generate({ secret });

        console.log('Testing valid token...');
        const validResult = await verify({ token, secret });
        console.log('Valid result:', validResult);

        console.log('Testing invalid token...');
        try {
            const invalidResult = await verify({ token: '123456', secret });
            console.log('Invalid result:', invalidResult);
        } catch (e) {
            console.log('Invalid verify threw error:', e.message);
        }

    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
