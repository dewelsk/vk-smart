import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

async function createNewAdmin() {
    const email = 'testadmin@retry.sk'
    const username = 'testadmin'
    const password = 'Hackaton25'

    console.log(`--- CREATING NEW SUPERADMIN: ${email} ---`)

    try {
        // Check if exists
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        })

        if (existing) {
            console.log('User already exists, deleting to recreate...')
            await prisma.user.delete({ where: { id: existing.id } })
        }

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)

        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                password: hash,
                name: 'Test',
                surname: 'Admin',
                role: UserRole.SUPERADMIN,
                active: true,
                userRoles: {
                    create: {
                        role: UserRole.SUPERADMIN
                    }
                }
            }
        })

        console.log('New Admin created successfully:', newUser.id)

    } catch (error) {
        console.error('Error creating user:', error)
    }
}

createNewAdmin()
