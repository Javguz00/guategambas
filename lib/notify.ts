export async function sendWhatsAppNotification(adminNumber: string, message: string) {
  // Try Twilio if configured, otherwise skip
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+1415XXXX

  if (!accountSid || !authToken || !fromNumber) {
    // Not configured; nothing to do
    return { ok: false, reason: "not-configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams();
  body.set("From", fromNumber);
  body.set("To", `whatsapp:${adminNumber}`);
  body.set("Body", message);

  const basic = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, reason: `twilio-error:${resp.status}`, detail: text };
    }

    const data = await resp.json();
    return { ok: true, detail: data };
  } catch (err) {
    return { ok: false, reason: "fetch-error", detail: String(err) };
  }
}
