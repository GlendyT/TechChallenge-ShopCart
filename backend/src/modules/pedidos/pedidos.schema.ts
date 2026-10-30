import { z } from 'zod';

export const iniciarReservaSchema = z.object({
  claveIdempotencia: z
    .string()
    .trim()
    .min(5, 'La clave de idempotencia es obligatoria')
    .max(100),
});

export const confirmarCheckoutSchema = z.object({
  idDireccionEntrega: z
    .number()
    .int()
    .positive('Debes seleccionar una dirección de entrega válida'),
  claveIdempotencia: z
    .string()
    .trim()
    .min(5, 'La clave de idempotencia es obligatoria')
    .max(100),
  metodoPago: z
    .string()
    .trim()
    .min(2, 'El método de pago es obligatorio')
    .max(50)
    .default('TARJETA_CREDITO'),
  codigoCupon: z.string().trim().max(30).optional().nullable(),
  simularResultadoPago: z
    .enum(['APROBADO', 'RECHAZADO'])
    .optional()
    .default('APROBADO'),
});

export const cambiarEstadoPedidoSchema = z.object({
  estadoNuevo: z.enum(['EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'], {
    required_error:
      'El estado nuevo debe ser EN_PREPARACION, DESPACHADO o ENTREGADO',
  }),
  motivo: z.string().trim().max(255).optional().nullable(),
});

export const cancelarPedidoSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, 'Debes indicar un motivo obligatorio para cancelar el pedido')
    .max(255),
});

export const procesarDevolucionSchema = z.object({
  idPedidoDetalle: z
    .number()
    .int()
    .positive('El ID de la línea del pedido (idPedidoDetalle) es obligatorio'),
  cantidadADevolver: z
    .number()
    .int()
    .positive('La cantidad a devolver debe ser mayor a cero'),
  motivo: z
    .string()
    .trim()
    .min(5, 'El motivo de la devolución es obligatorio')
    .max(255),
});
