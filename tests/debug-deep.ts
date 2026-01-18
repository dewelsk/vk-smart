import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function debugAuthLogic() {
    const login = 'superadmin@retry.sk'
    const password = 'H25'

    console.log('--- DEEP DEBUG AUTH LOGIC ---')

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: login },
                { username: login },
            ],
            deleted: false,
            active: true,
        },
        select: {
            id: true,
            email: true,
            username: true,
            password: true,
            userRoles: {
                select: {
                    role: true,
                },
            },
        },
    })

    if (!user) {
        console.log('User NOT found!')
        return
    }

    console.log('User found:', user.email)
    console.log('Stored Hash:', user.password)

    if (!user.password) {
        console.log('User has no password!')
        return
    }

    const match = await bcrypt.compare(password, user.password)
    console.log('Bcrypt comparison (bcryptjs):', match)

    // Try with 'bcrypt' if it exists (sometimes projects have both and they might differ)
    try {
        const bcryptNative = require('bcrypt')
        const matchNative = await bcryptNative.compare(password, user.password)
        console.log('Bcrypt comparison (native bcrypt):', matchNative)
    } catch (e) {
        console.log('Native bcrypt not available')
    }

    console.log('--- END DEBUG ---')
}

debugAuthLogic()
