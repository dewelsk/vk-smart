import { prisma } from '../lib/prisma'

async function main() {
  const vks = await prisma.vyberoveKonanie.findMany({
    select: {
      id: true,
      identifier: true,
      organizationalUnit: true,
      serviceField: true,
      position: true,
      institution: {
        select: {
          code: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log('Aktuálne výberové konania:\n')
  vks.forEach((vk, i) => {
    console.log(`${i + 1}. ${vk.identifier}`)
    console.log(`   Pozícia: ${vk.position}`)
    console.log(`   Útvar: ${vk.organizationalUnit}`)
    console.log(`   Odbor: ${vk.serviceField}`)
    console.log(`   Rezort: ${vk.institution.code} - ${vk.institution.name}`)
    console.log(`   ID: ${vk.id}\n`)
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
