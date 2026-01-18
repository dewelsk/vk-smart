import Credentials from 'next-auth/providers/credentials'

const provider = Credentials({
    authorize: async (c: any) => {
        return { id: '1' }
    }
})

// Try to override ID
provider.id = 'custom-id'
provider.name = 'Custom Name'

console.log('Final ID:', provider.id)
console.log('Final Name:', provider.name)
