const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSync() {
  const users = await prisma.user.findMany({
    where: {
      deleted: false,
      role: {
        notIn: ['SUPERADMIN', 'UCHADZAC']
      }
    },
    include: {
      institutions: {
        include: {
          institution: true
        }
      },
      userRoles: {
        include: {
          institution: true
        }
      }
    }
  });

  console.log('Total staff users:', users.length);
  console.log('');

  let okCount = 0;
  let missingCount = 0;
  let noInstitutionRolesCount = 0;

  users.forEach(u => {
    const hasInstitutions = u.institutions.length > 0;
    const rolesWithInst = u.userRoles.filter(ur => ur.institutionId);

    console.log('User:', u.username, '(' + u.role + ')');
    console.log('  user_institutions:', u.institutions.map(i => i.institution.code).join(', ') || 'NONE');
    console.log('  user_role_assignments:', u.userRoles.map(ur => ur.role + '@' + (ur.institution ? ur.institution.code : 'GLOBAL')).join(', ') || 'NONE');

    if (rolesWithInst.length > 0 && !hasInstitutions) {
      console.log('  ⚠️ MISSING INSTITUTION LINK');
      missingCount++;
    } else if (hasInstitutions && rolesWithInst.length > 0) {
      console.log('  ✅ OK');
      okCount++;
    } else if (rolesWithInst.length === 0) {
      console.log('  ℹ️ No institution roles (all GLOBAL)');
      noInstitutionRolesCount++;
    }
    console.log('');
  });

  console.log('Summary:');
  console.log('  ✅ OK:', okCount);
  console.log('  ⚠️ Missing:', missingCount);
  console.log('  ℹ️ No institution roles:', noInstitutionRolesCount);

  await prisma.$disconnect();
}

checkSync().catch(console.error);
