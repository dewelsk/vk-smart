import { authConfig } from '../auth'

async function testAuthorize() {
    console.log('--- PROVIDERS DEBUG ---')
    authConfig.providers.forEach((p: any, i: number) => {
        console.log(`Provider ${i}:`, {
            id: p.id,
            name: p.name,
            type: p.type,
            hasAuthorize: !!p.authorize,
            authorizeSource: p.authorize?.toString().substring(0, 100) + '...'
        })
    })

    // Try to find by index if ID search fails
    const provider = authConfig.providers[0] as any

    if (!provider || typeof provider.authorize !== 'function') {
        console.log('FAILURE: authorize function not found on provider 0!')
        return
    }

    const credentials = {
        login: 'superadmin@retry.sk',
        password: 'H25'
    }

    console.log('Testing authorize with:', credentials.login)

    try {
        const user = await provider.authorize(credentials)
        if (user) {
            console.log('Authorize success:', JSON.stringify(user, null, 2))
        } else {
            console.log('Authorize returned null (Login failed)')
        }
    } catch (error) {
        console.error('Authorize threw error:', error)
    }
}

testAuthorize()
