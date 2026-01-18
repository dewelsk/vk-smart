import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function updatePassword() {
    const email = 'superadmin@retry.sk'
    const newPassword = 'Hackaton25'

    console.log(`--- UPDATING PASSWORD FOR ${email} ---`)

    try {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(newPassword, salt)

        const user = await prisma.user.update({
            where: { email },
            data: { password: hash }
        })

        console.log('Password successfully updated!')
        console.log('New Hash:', hash)

        // Verify
        const match = await bcrypt.compare(newPassword, user.password!)
        console.log('Verification match:', match)

    } catch (error) {
        console.error('Error updating password:', error)
    }
}

updatePassword()
