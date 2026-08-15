-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('HOMBRE', 'MUJER', 'UNISEX');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRADA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'MERMA', 'DEVOLUCION', 'RESERVA', 'LIBERACION_RESERVA');

-- CreateEnum
CREATE TYPE "OrigenMovimiento" AS ENUM ('COMPRA', 'VENTA', 'AJUSTE_MANUAL', 'TRANSFERENCIA', 'DEVOLUCION_CLIENTE', 'DEVOLUCION_PROVEEDOR', 'CONTEO_FISICO', 'MERMA', 'RESERVA_PEDIDO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CC', 'CE', 'NIT', 'PASAPORTE', 'TI');

-- CreateEnum
CREATE TYPE "EtiquetaCliente" AS ENUM ('VIP', 'MAYORISTA', 'FRECUENTE', 'NUEVO');

-- CreateEnum
CREATE TYPE "FuenteLead" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'WEB', 'REFERIDO', 'VISITA_LOCAL', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'CONTACTADO', 'INTERESADO', 'COTIZACION_ENVIADA', 'NEGOCIACION', 'APARTADO', 'GANADO', 'PERDIDO', 'NO_INTERESADO');

-- CreateEnum
CREATE TYPE "TipoSeguimiento" AS ENUM ('LLAMADA', 'WHATSAPP', 'CORREO', 'VISITA', 'NOTA');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('COMPLETADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CREDITO', 'BONO', 'PUNTOS');

-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('BORRADOR', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_TOTAL', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoCuentaPorPagar" AS ENUM ('PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoCuentaPorCobrar" AS ENUM ('PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoSesionCaja" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoCaja" AS ENUM ('INGRESO', 'RETIRO');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA', 'CONVERTIDA');

-- CreateEnum
CREATE TYPE "EstadoGarantia" AS ENUM ('RECIBIDO', 'EN_REVISION', 'ENVIADO_PROVEEDOR', 'APROBADO', 'RECHAZADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "TipoDevolucion" AS ENUM ('CAMBIO_TALLA', 'CAMBIO_COLOR', 'DINERO', 'BONO', 'CREDITO', 'REPOSICION');

-- CreateEnum
CREATE TYPE "EstadoDevolucion" AS ENUM ('SOLICITADA', 'APROBADA', 'RECHAZADA', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('ARRIENDO', 'SERVICIOS', 'INTERNET', 'PUBLICIDAD', 'NOMINA', 'TRANSPORTE', 'PAPELERIA', 'IMPREVISTOS', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('PENDIENTE', 'DESPACHADO', 'EN_TRANSITO', 'ENTREGADO', 'DEVUELTO');

-- CreateEnum
CREATE TYPE "TipoMovimientoPuntos" AS ENUM ('ACUMULACION', 'REDENCION', 'AJUSTE', 'EXPIRACION');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('STOCK_BAJO', 'GARANTIA', 'CUMPLEANOS', 'SEGUIMIENTO_CRM', 'COTIZACION_VENCIDA', 'PEDIDO', 'ENVIO', 'PAGO', 'CAJA');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tienda_activa" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_ventas" TEXT,
    "logo_url" TEXT,
    "descripcion_tienda" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "direccion" TEXT,
    "ciudad" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "ultimo_login" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "es_sistema" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "rol_id" TEXT NOT NULL,
    "permiso_id" TEXT NOT NULL,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "usuario_id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("usuario_id","rol_id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "dispositivo" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_actividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocada_at" TIMESTAMP(3),

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "padre_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_id" TEXT,
    "marca_id" TEXT,
    "sexo" "Sexo",
    "temporada" TEXT,
    "coleccion" TEXT,
    "proveedor_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "codigo_barras" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "ubicacion" TEXT,
    "costo_compra" DECIMAL(12,2) NOT NULL,
    "costo_promedio" DECIMAL(12,2) NOT NULL,
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "precio_mayorista" DECIMAL(12,2),
    "precio_vip" DECIMAL(12,2),
    "iva" DECIMAL(5,2) NOT NULL DEFAULT 19,
    "descuento_max" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "origen" "OrigenMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_anterior" INTEGER NOT NULL,
    "stock_nuevo" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(12,2),
    "motivo" TEXT,
    "referencia_tipo" TEXT,
    "referencia_id" TEXT,
    "sucursal_destino_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteos_fisicos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_PROCESO',
    "usuario_id" TEXT NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_at" TIMESTAMP(3),

    CONSTRAINT "conteos_fisicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteo_fisico_items" (
    "id" TEXT NOT NULL,
    "conteo_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "stock_sistema" INTEGER NOT NULL,
    "stock_contado" INTEGER,
    "diferencia" INTEGER,

    CONSTRAINT "conteo_fisico_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "etiquetas" "EtiquetaCliente"[],
    "saldo_credito" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "puntos_fidelizacion" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_documentos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "correo" TEXT,
    "ciudad" TEXT,
    "fuente" "FuenteLead" NOT NULL DEFAULT 'OTRO',
    "estado" "EstadoLead" NOT NULL DEFAULT 'NUEVO',
    "vendedor_id" TEXT,
    "cliente_id" TEXT,
    "observaciones" TEXT,
    "proximo_contacto" TIMESTAMP(3),
    "motivo_perdida" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_seguimientos" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "tipo" "TipoSeguimiento" NOT NULL,
    "notas" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numeraciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL DEFAULT '',
    "consecutivo_actual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "numeraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "prefijo" TEXT NOT NULL DEFAULT '',
    "cliente_id" TEXT,
    "vendedor_id" TEXT NOT NULL,
    "caja_id" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "iva_total" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'COMPLETADA',
    "idempotency_key" TEXT NOT NULL,
    "observaciones" TEXT,
    "motivo_anulacion" TEXT,
    "anulada_por_id" TEXT,
    "anulada_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_items" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "descuento_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "iva_porcentaje" DECIMAL(5,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "venta_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "referencia" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "EstadoOrdenCompra" NOT NULL DEFAULT 'BORRADOR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva_total" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "fecha_esperada" TIMESTAMP(3),
    "observaciones" TEXT,
    "usuario_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orden_compra_items" (
    "id" TEXT NOT NULL,
    "orden_compra_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "cantidad_recibida" INTEGER NOT NULL DEFAULT 0,
    "costo_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "orden_compra_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_pagar" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "orden_compra_id" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldo" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCuentaPorPagar" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_vencimiento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_por_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_cobrar" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldo" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCuentaPorCobrar" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_vencimiento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_por_cobrar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos_cartera" (
    "id" TEXT NOT NULL,
    "cuenta_por_cobrar_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "observaciones" TEXT,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_cartera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "id" TEXT NOT NULL,
    "caja_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "monto_apertura" DECIMAL(12,2) NOT NULL,
    "monto_cierre_sistema" DECIMAL(12,2),
    "monto_cierre_real" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "estado" "EstadoSesionCaja" NOT NULL DEFAULT 'ABIERTA',
    "observaciones_apertura" TEXT,
    "observaciones_cierre" TEXT,
    "abierta_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_at" TIMESTAMP(3),

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" TEXT NOT NULL,
    "sesion_caja_id" TEXT NOT NULL,
    "tipo" "TipoMovimientoCaja" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" TEXT,
    "lead_id" TEXT,
    "vendedor_id" TEXT NOT NULL,
    "venta_id" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "iva_total" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'BORRADOR',
    "fecha_vencimiento" TIMESTAMP(3),
    "observaciones" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion_items" (
    "id" TEXT NOT NULL,
    "cotizacion_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "descuento_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "iva_porcentaje" DECIMAL(5,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "cotizacion_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garantias" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "venta_id" TEXT,
    "cliente_id" TEXT,
    "variante_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "motivo" TEXT NOT NULL,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estado" "EstadoGarantia" NOT NULL DEFAULT 'RECIBIDO',
    "responsable_id" TEXT,
    "notas" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "entregada_at" TIMESTAMP(3),

    CONSTRAINT "garantias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "tipo" "TipoDevolucion" NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoDevolucion" NOT NULL DEFAULT 'SOLICITADA',
    "monto_reembolso" DECIMAL(12,2),
    "motivo_rechazo" TEXT,
    "usuario_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procesada_at" TIMESTAMP(3),

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucion_items" (
    "id" TEXT NOT NULL,
    "devolucion_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "variante_nueva_id" TEXT,

    CONSTRAINT "devolucion_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "comprobante_url" TEXT,
    "sesion_caja_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportadoras" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url_rastreo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transportadoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envios" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "transportadora_id" TEXT,
    "numero_guia" TEXT,
    "documento_destinatario" TEXT,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "barrio" TEXT,
    "telefono" TEXT,
    "costo_envio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" "EstadoEnvio" NOT NULL DEFAULT 'PENDIENTE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "despachado_at" TIMESTAMP(3),
    "entregado_at" TIMESTAMP(3),

    CONSTRAINT "envios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_puntos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "tipo" "TipoMovimientoPuntos" NOT NULL,
    "puntos" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "venta_id" TEXT,
    "usuario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "entidad_tipo" TEXT,
    "entidad_id" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_credito" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "prefijo" TEXT NOT NULL DEFAULT '',
    "venta_id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva_total" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_credito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_credito_items" (
    "id" TEXT NOT NULL,
    "nota_credito_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "iva_porcentaje" DECIMAL(5,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "nota_credito_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad_id" TEXT,
    "antes" JSONB,
    "despues" JSONB,
    "resultado" TEXT NOT NULL,
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nit_key" ON "empresas"("nit");

-- CreateIndex
CREATE INDEX "empresas_activo_idx" ON "empresas"("activo");

-- CreateIndex
CREATE INDEX "sucursales_empresa_id_activo_idx" ON "sucursales"("empresa_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_empresa_id_codigo_key" ON "sucursales"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "usuarios_empresa_id_activo_idx" ON "usuarios"("empresa_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_empresa_id_email_key" ON "usuarios"("empresa_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_empresa_id_nombre_key" ON "roles"("empresa_id", "nombre");

-- CreateIndex
CREATE INDEX "permisos_modulo_idx" ON "permisos"("modulo");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_modulo_accion_key" ON "permisos"("modulo", "accion");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_activa_idx" ON "sesiones"("usuario_id", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_revocado_idx" ON "refresh_tokens"("usuario_id", "revocado");

-- CreateIndex
CREATE INDEX "categorias_empresa_id_activo_idx" ON "categorias"("empresa_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_empresa_id_nombre_padre_id_key" ON "categorias"("empresa_id", "nombre", "padre_id");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_empresa_id_nombre_key" ON "marcas"("empresa_id", "nombre");

-- CreateIndex
CREATE INDEX "productos_empresa_id_activo_idx" ON "productos"("empresa_id", "activo");

-- CreateIndex
CREATE INDEX "productos_empresa_id_nombre_idx" ON "productos"("empresa_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_empresa_id_codigo_key" ON "productos"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "variantes_producto_id_idx" ON "variantes"("producto_id");

-- CreateIndex
CREATE INDEX "variantes_sucursal_id_stock_idx" ON "variantes"("sucursal_id", "stock");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_producto_id_talla_color_sucursal_id_key" ON "variantes"("producto_id", "talla", "color", "sucursal_id");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_sku_key" ON "variantes"("sku");

-- CreateIndex
CREATE INDEX "producto_imagenes_producto_id_idx" ON "producto_imagenes"("producto_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_empresa_id_variante_id_created_at_idx" ON "movimientos_inventario"("empresa_id", "variante_id", "created_at");

-- CreateIndex
CREATE INDEX "movimientos_inventario_empresa_id_sucursal_id_created_at_idx" ON "movimientos_inventario"("empresa_id", "sucursal_id", "created_at");

-- CreateIndex
CREATE INDEX "movimientos_inventario_referencia_tipo_referencia_id_idx" ON "movimientos_inventario"("referencia_tipo", "referencia_id");

-- CreateIndex
CREATE INDEX "conteos_fisicos_empresa_id_sucursal_id_estado_idx" ON "conteos_fisicos"("empresa_id", "sucursal_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "conteo_fisico_items_conteo_id_variante_id_key" ON "conteo_fisico_items"("conteo_id", "variante_id");

-- CreateIndex
CREATE INDEX "clientes_empresa_id_activo_idx" ON "clientes"("empresa_id", "activo");

-- CreateIndex
CREATE INDEX "clientes_empresa_id_nombre_idx" ON "clientes"("empresa_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresa_id_tipo_documento_numero_documento_key" ON "clientes"("empresa_id", "tipo_documento", "numero_documento");

-- CreateIndex
CREATE INDEX "cliente_documentos_cliente_id_idx" ON "cliente_documentos"("cliente_id");

-- CreateIndex
CREATE INDEX "leads_empresa_id_estado_orden_idx" ON "leads"("empresa_id", "estado", "orden");

-- CreateIndex
CREATE INDEX "leads_empresa_id_vendedor_id_idx" ON "leads"("empresa_id", "vendedor_id");

-- CreateIndex
CREATE INDEX "lead_seguimientos_lead_id_created_at_idx" ON "lead_seguimientos"("lead_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "numeraciones_empresa_id_sucursal_id_tipo_key" ON "numeraciones"("empresa_id", "sucursal_id", "tipo");

-- CreateIndex
CREATE INDEX "ventas_empresa_id_sucursal_id_created_at_idx" ON "ventas"("empresa_id", "sucursal_id", "created_at");

-- CreateIndex
CREATE INDEX "ventas_empresa_id_cliente_id_idx" ON "ventas"("empresa_id", "cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_empresa_id_sucursal_id_numero_key" ON "ventas"("empresa_id", "sucursal_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_empresa_id_idempotency_key_key" ON "ventas"("empresa_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "venta_items_venta_id_idx" ON "venta_items"("venta_id");

-- CreateIndex
CREATE INDEX "venta_items_variante_id_idx" ON "venta_items"("variante_id");

-- CreateIndex
CREATE INDEX "pagos_venta_id_idx" ON "pagos"("venta_id");

-- CreateIndex
CREATE INDEX "proveedores_empresa_id_activo_idx" ON "proveedores"("empresa_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_empresa_id_nit_key" ON "proveedores"("empresa_id", "nit");

-- CreateIndex
CREATE INDEX "ordenes_compra_empresa_id_proveedor_id_idx" ON "ordenes_compra"("empresa_id", "proveedor_id");

-- CreateIndex
CREATE INDEX "ordenes_compra_empresa_id_estado_idx" ON "ordenes_compra"("empresa_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_empresa_id_sucursal_id_numero_key" ON "ordenes_compra"("empresa_id", "sucursal_id", "numero");

-- CreateIndex
CREATE INDEX "orden_compra_items_orden_compra_id_idx" ON "orden_compra_items"("orden_compra_id");

-- CreateIndex
CREATE INDEX "orden_compra_items_variante_id_idx" ON "orden_compra_items"("variante_id");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_empresa_id_proveedor_id_estado_idx" ON "cuentas_por_pagar"("empresa_id", "proveedor_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_por_cobrar_venta_id_key" ON "cuentas_por_cobrar"("venta_id");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_empresa_id_cliente_id_estado_idx" ON "cuentas_por_cobrar"("empresa_id", "cliente_id", "estado");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_empresa_id_estado_fecha_vencimiento_idx" ON "cuentas_por_cobrar"("empresa_id", "estado", "fecha_vencimiento");

-- CreateIndex
CREATE INDEX "abonos_cartera_cuenta_por_cobrar_id_idx" ON "abonos_cartera"("cuenta_por_cobrar_id");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_empresa_id_sucursal_id_nombre_key" ON "cajas"("empresa_id", "sucursal_id", "nombre");

-- CreateIndex
CREATE INDEX "sesiones_caja_caja_id_estado_idx" ON "sesiones_caja"("caja_id", "estado");

-- CreateIndex
CREATE INDEX "movimientos_caja_sesion_caja_id_idx" ON "movimientos_caja"("sesion_caja_id");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_venta_id_key" ON "cotizaciones"("venta_id");

-- CreateIndex
CREATE INDEX "cotizaciones_empresa_id_estado_idx" ON "cotizaciones"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "cotizaciones_empresa_id_cliente_id_idx" ON "cotizaciones"("empresa_id", "cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_empresa_id_sucursal_id_numero_key" ON "cotizaciones"("empresa_id", "sucursal_id", "numero");

-- CreateIndex
CREATE INDEX "cotizacion_items_cotizacion_id_idx" ON "cotizacion_items"("cotizacion_id");

-- CreateIndex
CREATE INDEX "garantias_empresa_id_estado_idx" ON "garantias"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "garantias_empresa_id_cliente_id_idx" ON "garantias"("empresa_id", "cliente_id");

-- CreateIndex
CREATE INDEX "devoluciones_empresa_id_estado_idx" ON "devoluciones"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "devoluciones_empresa_id_venta_id_idx" ON "devoluciones"("empresa_id", "venta_id");

-- CreateIndex
CREATE INDEX "devolucion_items_devolucion_id_idx" ON "devolucion_items"("devolucion_id");

-- CreateIndex
CREATE INDEX "gastos_empresa_id_fecha_idx" ON "gastos"("empresa_id", "fecha");

-- CreateIndex
CREATE INDEX "gastos_empresa_id_categoria_idx" ON "gastos"("empresa_id", "categoria");

-- CreateIndex
CREATE UNIQUE INDEX "transportadoras_empresa_id_nombre_key" ON "transportadoras"("empresa_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "envios_venta_id_key" ON "envios"("venta_id");

-- CreateIndex
CREATE INDEX "envios_empresa_id_estado_idx" ON "envios"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "movimientos_puntos_empresa_id_cliente_id_created_at_idx" ON "movimientos_puntos"("empresa_id", "cliente_id", "created_at");

-- CreateIndex
CREATE INDEX "notificaciones_empresa_id_usuario_id_leida_idx" ON "notificaciones"("empresa_id", "usuario_id", "leida");

-- CreateIndex
CREATE UNIQUE INDEX "notas_credito_venta_id_key" ON "notas_credito"("venta_id");

-- CreateIndex
CREATE INDEX "notas_credito_empresa_id_venta_id_idx" ON "notas_credito"("empresa_id", "venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "notas_credito_empresa_id_sucursal_id_numero_key" ON "notas_credito"("empresa_id", "sucursal_id", "numero");

-- CreateIndex
CREATE INDEX "nota_credito_items_nota_credito_id_idx" ON "nota_credito_items"("nota_credito_id");

-- CreateIndex
CREATE INDEX "audit_logs_empresa_id_created_at_idx" ON "audit_logs"("empresa_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_modulo_accion_idx" ON "audit_logs"("modulo", "accion");

-- CreateIndex
CREATE INDEX "audit_logs_entidad_id_idx" ON "audit_logs"("entidad_id");

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteo_fisico_items" ADD CONSTRAINT "conteo_fisico_items_conteo_id_fkey" FOREIGN KEY ("conteo_id") REFERENCES "conteos_fisicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_documentos" ADD CONSTRAINT "cliente_documentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_seguimientos" ADD CONSTRAINT "lead_seguimientos_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_compra_items" ADD CONSTRAINT "orden_compra_items_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos_cartera" ADD CONSTRAINT "abonos_cartera_cuenta_por_cobrar_id_fkey" FOREIGN KEY ("cuenta_por_cobrar_id") REFERENCES "cuentas_por_cobrar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_sesion_caja_id_fkey" FOREIGN KEY ("sesion_caja_id") REFERENCES "sesiones_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_items" ADD CONSTRAINT "cotizacion_items_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_items" ADD CONSTRAINT "devolucion_items_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_credito_items" ADD CONSTRAINT "nota_credito_items_nota_credito_id_fkey" FOREIGN KEY ("nota_credito_id") REFERENCES "notas_credito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
