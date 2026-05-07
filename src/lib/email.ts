import { Resend } from 'resend'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Configuración ─────────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface DatosEmailConfirmacion {
  to: string
  clienteNombre: string
  negocioNombre: string
  negocioLogo: string | null
  servicioNombre: string
  duracionMinutos: number
  fecha: string   // YYYY-MM-DD
  hora: string    // HH:mm
}

export interface DatosEmailCancelacion {
  to: string
  clienteNombre: string
  negocioNombre: string
  negocioLogo: string | null
  servicioNombre: string
  fecha: string
  hora: string
}

export interface DatosEmailRecordatorio {
  to: string
  clienteNombre: string
  negocioNombre: string
  negocioLogo: string | null
  servicioNombre: string
  duracionMinutos: number
  fecha: string   // YYYY-MM-DD
  hora: string    // HH:mm
  tipo: '24h' | '2h'
}

// ─── Helpers de template ──────────────────────────────────────────────────────

function formatearFecha(fecha: string): string {
  const [y, mo, d] = fecha.split('-').map(Number)
  return format(new Date(y, mo - 1, d), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
}

function bloqueLogoONombre(nombre: string, logo: string | null): string {
  if (logo) {
    return `
      <img src="${logo}" alt="${nombre}" width="auto" height="52"
        style="display:block;margin:0 auto 12px;max-width:160px;height:52px;width:auto;" />
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;
        color:#9ca3af;letter-spacing:1.8px;text-transform:uppercase;">${nombre}</p>`
  }
  return `
    <h2 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;
      font-weight:400;color:#1a1a2e;letter-spacing:-0.3px;">${nombre}</h2>`
}

function filaDetalle(label: string, value: string, last = false): string {
  const border = last ? '' : 'border-bottom:1px solid #ede8e0;'
  return `
    <tr><td style="padding:16px 20px;${border}">
      <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;
        font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">${label}</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;
        color:#1a1a2e;">${value}</p>
    </td></tr>`
}

function envoltura(cuerpo: string, negocioNombre: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>awel</title>
</head>
<body style="margin:0;padding:0;background-color:#ede8e0;
  font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
  style="background-color:#ede8e0;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="max-width:520px;">
      <tr><td style="background-color:#FEF8F0;border-radius:20px;overflow:hidden;">

        ${cuerpo}

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center"
            style="padding:16px 40px 20px;background-color:#ede8e0;
              border-radius:0 0 20px 20px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;
              font-size:11px;color:#9ca3af;line-height:1.5;">
              Enviado por <strong style="color:#6b7280;">${negocioNombre}</strong>
              &nbsp;·&nbsp; Plataforma <strong style="color:#6b7280;">awel</strong>
            </p>
          </td></tr>
        </table>

      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ─── Email: Confirmación de reserva ───────────────────────────────────────────

export async function enviarEmailConfirmacion(datos: DatosEmailConfirmacion): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada — envío omitido')
    return
  }

  const fechaFormateada = formatearFecha(datos.fecha)

  const cuerpo = `
    <!-- Cabecera -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 40px 28px;">
        ${bloqueLogoONombre(datos.negocioNombre, datos.negocioLogo)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px;">
        <div style="height:1px;background-color:#ede8e0;"></div>
      </td></tr>
    </table>

    <!-- Contenido principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:32px 40px 40px;">

        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;
          font-size:28px;font-weight:400;color:#1a1a2e;line-height:1.25;
          letter-spacing:-0.5px;">Tu momento ha<br />sido reservado</h1>

        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;">
          Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>,
          tu cita está confirmada.
        </p>

        <!-- Bloque de detalles -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:12px;border:1px solid #ede8e0;">
          ${filaDetalle('Servicio', datos.servicioNombre)}
          ${filaDetalle('Fecha', `<span style="text-transform:capitalize">${fechaFormateada}</span>`)}
          ${filaDetalle('Hora', datos.hora)}
          ${filaDetalle('Duración', `${datos.duracionMinutos} min`, true)}
        </table>

        <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
          Te esperamos para renovar tu energía ✨
        </p>

      </td></tr>
    </table>`

  await resend.emails.send({
    from: FROM,
    to:   datos.to,
    subject: `Tu reserva confirmada 🌿 — ${datos.negocioNombre}`,
    html: envoltura(cuerpo, datos.negocioNombre),
  })
}

// ─── Email: Cancelación de cita ───────────────────────────────────────────────

export async function enviarEmailCancelacion(datos: DatosEmailCancelacion): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada — envío omitido')
    return
  }

  const fechaFormateada = formatearFecha(datos.fecha)

  const cuerpo = `
    <!-- Cabecera -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 40px 28px;">
        ${bloqueLogoONombre(datos.negocioNombre, datos.negocioLogo)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px;">
        <div style="height:1px;background-color:#ede8e0;"></div>
      </td></tr>
    </table>

    <!-- Contenido principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:32px 40px 40px;">

        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;
          font-size:28px;font-weight:400;color:#1a1a2e;line-height:1.25;
          letter-spacing:-0.5px;">Actualización<br />sobre tu cita</h1>

        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;">
          Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>,
          lamentamos informarte que la siguiente cita ha sido cancelada.
        </p>

        <!-- Bloque de detalles -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:12px;border:1px solid #ede8e0;">
          ${filaDetalle('Servicio', datos.servicioNombre)}
          ${filaDetalle('Fecha', `<span style="text-transform:capitalize">${fechaFormateada}</span>`)}
          ${filaDetalle('Hora', datos.hora, true)}
        </table>

        <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
          Esperamos verte pronto en otra ocasión 🌿
        </p>

      </td></tr>
    </table>`

  await resend.emails.send({
    from: FROM,
    to:   datos.to,
    subject: `Actualización sobre tu cita 🌿 — ${datos.negocioNombre}`,
    html: envoltura(cuerpo, datos.negocioNombre),
  })
}

// ─── Email: Recordatorio de cita ──────────────────────────────────────────────

export async function enviarEmailRecordatorio(datos: DatosEmailRecordatorio): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada — envío omitido')
    return
  }

  const fechaFormateada = formatearFecha(datos.fecha)
  const es24h = datos.tipo === '24h'

  const titular = es24h
    ? 'Mañana tienes<br />una cita'
    : 'Tu cita empieza<br />en 2 horas'

  const subtitulo = es24h
    ? `Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>, te recordamos que mañana tienes agendado lo siguiente:`
    : `Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>, ¡ya casi es tu momento! Aquí están los detalles de tu cita:`

  const cuerpo = `
    <!-- Cabecera -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 40px 28px;">
        ${bloqueLogoONombre(datos.negocioNombre, datos.negocioLogo)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px;">
        <div style="height:1px;background-color:#ede8e0;"></div>
      </td></tr>
    </table>

    <!-- Banda de tiempo -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:20px 40px 0;">
        <span style="display:inline-block;padding:6px 16px;background-color:#f0d5fc;
          border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:11px;
          font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#9333ea;">
          ${es24h ? 'Recordatorio · 24 horas' : 'Recordatorio · 2 horas'}
        </span>
      </td></tr>
    </table>

    <!-- Contenido principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 40px 40px;">

        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;
          font-size:28px;font-weight:400;color:#1a1a2e;line-height:1.25;
          letter-spacing:-0.5px;">${titular}</h1>

        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;">${subtitulo}</p>

        <!-- Bloque de detalles -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:12px;border:1px solid #ede8e0;">
          ${filaDetalle('Servicio', datos.servicioNombre)}
          ${filaDetalle('Fecha', `<span style="text-transform:capitalize">${fechaFormateada}</span>`)}
          ${filaDetalle('Hora', datos.hora)}
          ${filaDetalle('Duración', `${datos.duracionMinutos} min`, true)}
        </table>

        <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
          ${es24h ? 'Si necesitas cancelar o modificar tu cita, contáctanos con tiempo 🙏' : '¡Te esperamos! 🌿'}
        </p>

      </td></tr>
    </table>`

  const subjectPrefix = es24h ? 'Mañana tienes' : 'En 2 horas:'
  await resend.emails.send({
    from: FROM,
    to:   datos.to,
    subject: `${subjectPrefix} ${datos.servicioNombre} a las ${datos.hora} 🌿 — ${datos.negocioNombre}`,
    html: envoltura(cuerpo, datos.negocioNombre),
  })
}

// ─── Email: Confirmación de lista de espera ───────────────────────────────────

export interface DatosEmailEsperaConfirmacion {
  to: string
  clienteNombre: string
  negocioNombre: string
  negocioLogo: string | null
  servicioNombre: string
  fecha: string   // YYYY-MM-DD
}

export async function enviarEmailConfirmacionEspera(datos: DatosEmailEsperaConfirmacion): Promise<void> {
  if (!resend) return

  const fechaFormateada = formatearFecha(datos.fecha)

  const cuerpo = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 40px 28px;">
        ${bloqueLogoONombre(datos.negocioNombre, datos.negocioLogo)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#ede8e0;"></div></td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:20px 40px 0;">
        <span style="display:inline-block;padding:6px 16px;background-color:#f0d5fc;
          border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:11px;
          font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#9333ea;">
          Lista de espera
        </span>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 40px 40px;">
        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;
          font-size:28px;font-weight:400;color:#1a1a2e;line-height:1.25;letter-spacing:-0.5px;">
          Estás en la lista<br />de espera
        </h1>
        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;">
          Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>, te anotamos en la lista de espera para el servicio indicado.
          Si se libera un horario, te avisaremos de inmediato.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:12px;border:1px solid #ede8e0;">
          ${filaDetalle('Servicio', datos.servicioNombre)}
          ${filaDetalle('Fecha deseada', `<span style="text-transform:capitalize">${fechaFormateada}</span>`, true)}
        </table>
        <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;
          font-size:13px;color:#9ca3af;line-height:1.6;text-align:center;">
          Te notificaremos en cuanto se libere un turno 🔔
        </p>
      </td></tr>
    </table>`

  await resend.emails.send({
    from: FROM,
    to:   datos.to,
    subject: `Lista de espera confirmada 🌿 — ${datos.negocioNombre}`,
    html: envoltura(cuerpo, datos.negocioNombre),
  })
}

// ─── Email: Slot liberado — notificación a lista de espera ───────────────────

export interface DatosEmailSlotLiberado {
  to: string
  clienteNombre: string
  negocioNombre: string
  negocioLogo: string | null
  servicioNombre: string
  fecha: string   // YYYY-MM-DD
  hora: string    // HH:mm
  urlReserva: string  // https://awel.cl/[slug]
}

export async function enviarEmailSlotLiberado(datos: DatosEmailSlotLiberado): Promise<void> {
  if (!resend) return

  const fechaFormateada = formatearFecha(datos.fecha)

  const cuerpo = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 40px 28px;">
        ${bloqueLogoONombre(datos.negocioNombre, datos.negocioLogo)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#ede8e0;"></div></td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:20px 40px 0;">
        <span style="display:inline-block;padding:6px 16px;background-color:#dcfce7;
          border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:11px;
          font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#16a34a;">
          ¡Turno disponible!
        </span>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 40px 40px;">
        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;
          font-size:28px;font-weight:400;color:#1a1a2e;line-height:1.25;letter-spacing:-0.5px;">
          Se liberó un turno<br />a las ${datos.hora}
        </h1>
        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;">
          Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>,
          alguien canceló su cita y se liberó el siguiente horario que estabas esperando.
          ¡Sé el primero en tomarlo!
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:12px;border:1px solid #ede8e0;">
          ${filaDetalle('Servicio', datos.servicioNombre)}
          ${filaDetalle('Fecha', `<span style="text-transform:capitalize">${fechaFormateada}</span>`)}
          ${filaDetalle('Hora liberada', `<strong style="color:#1a1a2e;">${datos.hora}</strong>`, true)}
        </table>

        <!-- CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
          <tr><td align="center">
            <a href="${datos.urlReserva}"
              style="display:inline-block;padding:14px 32px;background-color:#1a1a2e;
                border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;
                font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
                color:#ffffff;text-decoration:none;">
              Reservar ahora →
            </a>
          </td></tr>
        </table>

        <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;
          font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
          Los turnos se asignan al primero en confirmar. El horario puede llenarse nuevamente.
        </p>
      </td></tr>
    </table>`

  await resend.emails.send({
    from: FROM,
    to:   datos.to,
    subject: `¡Se liberó un turno a las ${datos.hora}! 🌿 — ${datos.negocioNombre}`,
    html: envoltura(cuerpo, datos.negocioNombre),
  })
}

// ─── Email: Reactivación de cliente (churn) ───────────────────────────────────

export interface DatosEmailReactivacion {
  to: string
  clienteNombre: string
  negocioNombre: string
  negocioLogo: string | null
  servicioFavorito: string | null  // nombre del servicio más reservado
  diasSinVisita: number
  urlReserva: string               // https://awel.cl/[slug]
}

export async function enviarEmailReactivacion(datos: DatosEmailReactivacion): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada — envío omitido')
    return
  }

  const saludo = datos.servicioFavorito
    ? `Tu próximo <strong style="color:#3d3d5c;">${datos.servicioFavorito}</strong> te está esperando.`
    : 'Nos encantaría verte pronto.'

  const cuerpo = `
    <!-- Cabecera -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 40px 28px;">
        ${bloqueLogoONombre(datos.negocioNombre, datos.negocioLogo)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#ede8e0;"></div></td></tr>
    </table>

    <!-- Banda personalizada -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:20px 40px 0;">
        <span style="display:inline-block;padding:6px 16px;background-color:#fef3c7;
          border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:11px;
          font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#d97706;">
          Te extrañamos 🌸
        </span>
      </td></tr>
    </table>

    <!-- Contenido principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 40px 40px;">

        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;
          font-size:28px;font-weight:400;color:#1a1a2e;line-height:1.25;letter-spacing:-0.5px;">
          Hace tiempo<br />que no te vemos
        </h1>

        <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;">
          Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>,
          han pasado <strong style="color:#1a1a2e;">${datos.diasSinVisita} días</strong>
          desde tu última visita. ${saludo}
        </p>

        <!-- Separador decorativo -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="margin-bottom:24px;">
          <tr>
            <td style="background-color:#ede8e0;height:1px;width:40%;"></td>
            <td align="center" style="padding:0 12px;">
              <span style="font-family:Georgia,serif;font-size:18px;color:#d4a574;">✦</span>
            </td>
            <td style="background-color:#ede8e0;height:1px;width:40%;"></td>
          </tr>
        </table>

        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;text-align:center;
          font-style:italic;">
          "El bienestar no es un lujo, es una necesidad.<br />Tu momento de renovarte te está esperando."
        </p>

        <!-- CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="${datos.urlReserva}"
              style="display:inline-block;padding:14px 36px;background-color:#1a1a2e;
                border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;
                font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
                color:#ffffff;text-decoration:none;">
              Reservar mi lugar →
            </a>
          </td></tr>
        </table>

        <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;
          font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
          Estamos aquí cuando tú quieras. Con cariño, el equipo de ${datos.negocioNombre} 🌿
        </p>

      </td></tr>
    </table>`

  await resend.emails.send({
    from: FROM,
    to:   datos.to,
    subject: `${datos.clienteNombre}, hace tiempo no te vemos 🌿 — ${datos.negocioNombre}`,
    html: envoltura(cuerpo, datos.negocioNombre),
  })
}

// ─── Email: Campaña por clima ─────────────────────────────────────────────────

export interface DatosEmailCampanaClima {
  to: string
  clienteNombre: string
  negocioNombre: string
  negocioLogo: string | null
  tipo: 'lluvia' | 'calor'
  tempC: number
  urlReserva: string
}

export async function enviarEmailCampanaClima(datos: DatosEmailCampanaClima): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada — envío omitido')
    return
  }

  const esLluvia = datos.tipo === 'lluvia'

  // Paleta y textos por condición
  const banda = esLluvia
    ? { bg: '#dbeafe', color: '#1d4ed8', texto: '🌧 Día de lluvia' }
    : { bg: '#fef3c7', color: '#d97706', texto: '☀️ Día de calor' }

  const titulo = esLluvia
    ? 'El mejor plan para<br />un día lluvioso'
    : 'Refresca tu energía<br />con este calor'

  const subtitulo = esLluvia
    ? `Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>, hay lluvia afuera. Es el momento perfecto para darte un espacio de bienestar y renovarte.`
    : `Hola <strong style="color:#3d3d5c;">${datos.clienteNombre}</strong>, con ${datos.tempC} °C afuera, lo mejor es regalarte un momento de relax y cuidado personal.`

  const fraseInspiradora = esLluvia
    ? '"La lluvia trae calma. Aprovecha para conectar contigo."'
    : '"El calor se siente menos cuando te cuidas por dentro."'

  const cuerpo = `
    <!-- Cabecera -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 40px 28px;">
        ${bloqueLogoONombre(datos.negocioNombre, datos.negocioLogo)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#ede8e0;"></div></td></tr>
    </table>

    <!-- Banda de clima -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:20px 40px 0;">
        <span style="display:inline-block;padding:6px 18px;
          background-color:${banda.bg};border-radius:999px;
          font-family:Arial,Helvetica,sans-serif;font-size:11px;
          font-weight:700;letter-spacing:1.8px;text-transform:uppercase;
          color:${banda.color};">
          ${banda.texto}
        </span>
      </td></tr>
    </table>

    <!-- Contenido -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 40px 40px;">

        <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;
          font-size:28px;font-weight:400;color:#1a1a2e;line-height:1.25;
          letter-spacing:-0.5px;">${titulo}</h1>

        <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;">${subtitulo}</p>

        <!-- Separador decorativo -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="margin-bottom:24px;">
          <tr>
            <td style="background-color:#ede8e0;height:1px;width:40%;"></td>
            <td align="center" style="padding:0 12px;">
              <span style="font-family:Georgia,serif;font-size:18px;color:#d4a574;">✦</span>
            </td>
            <td style="background-color:#ede8e0;height:1px;width:40%;"></td>
          </tr>
        </table>

        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;
          font-size:14px;color:#6b7280;line-height:1.6;text-align:center;
          font-style:italic;">${fraseInspiradora}</p>

        <!-- CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="${datos.urlReserva}"
              style="display:inline-block;padding:14px 36px;background-color:#1a1a2e;
                border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;
                font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
                color:#ffffff;text-decoration:none;">
              Reservar mi lugar →
            </a>
          </td></tr>
        </table>

        <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;
          font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
          Con cariño, el equipo de ${datos.negocioNombre} 🌿
        </p>

      </td></tr>
    </table>`

  const subjectEmoji = esLluvia ? '🌧' : '☀️'
  const subjectTexto = esLluvia
    ? `Día lluvioso, perfecto para mimarte`
    : `Con ${datos.tempC} °C, date un momento`

  await resend.emails.send({
    from: FROM,
    to:   datos.to,
    subject: `${subjectEmoji} ${subjectTexto} — ${datos.negocioNombre}`,
    html: envoltura(cuerpo, datos.negocioNombre),
  })
}
