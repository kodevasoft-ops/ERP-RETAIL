import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const MODULOS = [
  "productos", "inventario", "ventas", "clientes", "crm", "compras",
  "usuarios", "roles", "caja", "cotizaciones", "garantias", "devoluciones",
  "reportes", "gastos", "finanzas", "envios", "configuracion", "auditoria",
] as const;
const ACCIONES = ["ver", "crear", "editar", "eliminar", "exportar", "importar", "aprobar", "anular"] as const;

async function main() {
  // 1. Permisos: producto cartesiano módulo x acción
  const permisos = await Promise.all(
    MODULOS.flatMap((modulo) =>
      ACCIONES.map((accion) =>
        prisma.permiso.upsert({
          where: { modulo_accion: { modulo, accion } },
          update: {},
          create: { modulo, accion },
        }),
      ),
    ),
  );

  // 2. Empresa demo
  const empresa = await prisma.empresa.upsert({
    where: { nit: "900000000-1" },
    update: {},
    create: { nombre: "Tienda Demo", nit: "900000000-1" },
  });

  const sucursal = await prisma.sucursal.upsert({
    where: { empresaId_codigo: { empresaId: empresa.id, codigo: "PRINCIPAL" } },
    update: {},
    create: { empresaId: empresa.id, nombre: "Sucursal Principal", codigo: "PRINCIPAL" },
  });

  // 3. Rol Administrador con todos los permisos
  const rolAdmin = await prisma.rol.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: "Administrador" } },
    update: {},
    create: {
      empresaId: empresa.id,
      nombre: "Administrador",
      descripcion: "Acceso total al sistema",
      esSistema: true,
    },
  });

  await Promise.all(
    permisos.map((p) =>
      prisma.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: rolAdmin.id, permisoId: p.id } },
        update: {},
        create: { rolId: rolAdmin.id, permisoId: p.id },
      }),
    ),
  );

  // 4. Usuario administrador demo
  const passwordHash = await argon2.hash("Admin123!", { type: argon2.argon2id });
  const usuario = await prisma.usuario.upsert({
    where: { empresaId_email: { empresaId: empresa.id, email: "admin@demo.com" } },
    update: {},
    create: {
      empresaId: empresa.id,
      sucursalId: sucursal.id,
      email: "admin@demo.com",
      passwordHash,
      nombre: "Admin",
      apellido: "Demo",
    },
  });

  await prisma.usuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: usuario.id, rolId: rolAdmin.id } },
    update: {},
    create: { usuarioId: usuario.id, rolId: rolAdmin.id },
  });

  console.log("Seed completado:");
  console.log(`  Empresa: ${empresa.nombre} (${empresa.id})`);
  console.log(`  Sucursal: ${sucursal.nombre} (${sucursal.id})`);
  console.log(`  Usuario: admin@demo.com / Admin123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
