export async function sendEmailReceipt(to: string, subject: string, html: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'sendgrid-not-configured' };
  }

  const url = 'https://api.sendgrid.com/v3/mail/send';
  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: process.env.SENDGRID_FROM || 'no-reply@guategambas.com', name: 'GuateGambas' },
    subject,
    content: [{ type: 'text/html', value: html }]
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, reason: `sendgrid-error:${resp.status}`, detail: text };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'fetch-error', detail: String(err) };
  }
}

export function renderReceiptTemplate(order: { items?: Array<{ name?: string; variantLabel?: string; quantity?: number; unitPrice?: number }>; customerName?: string; total?: number; shippingCost?: number }) {
  const itemsHtml = (order.items || []).map((it) => `<li>${it.name || ''} - ${it.variantLabel || ''} x ${Number(it.quantity || 0)} · Q ${Number(it.unitPrice||0).toFixed(2)}</li>`).join('');
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111">
      <h2>Confirmación de pedido — GuateGambas</h2>
      <p>Hola ${order.customerName},</p>
      <p>Hemos registrado tu pedido. Detalles:</p>
      <ul>
        ${itemsHtml}
      </ul>
      <p>Subtotal: Q ${Number(order.total||0).toFixed(2)}</p>
      <p>Envío: Q ${Number(order.shippingCost||0).toFixed(2)}</p>
      <p><strong>Total: Q ${(Number(order.total||0) + Number(order.shippingCost||0)).toFixed(2)}</strong></p>
      <p>Si necesitas ayuda, responde este correo o escríbenos por WhatsApp.</p>
      <p>Saludos,<br/>GuateGambas</p>
    </div>
  `;
}
