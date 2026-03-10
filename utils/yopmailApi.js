import { request } from '@playwright/test';

// Create API context
export async function createYopmailApiContext() {
  return await request.newContext({
    baseURL: 'https://yopmail.com',
    extraHTTPHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
}


// Fetch inbox messages via JSON
export async function fetchInboxMessages(api, mailboxName) {
  const safeMailbox = mailboxName.toLowerCase();

  const res = await api.get(
    `/en/inbox?login=${encodeURIComponent(safeMailbox)}&domain=yopmail.com&format=json`
  );

  if (!res.ok()) {
    throw new Error(
      `Failed to load Yopmail inbox for ${mailboxName}: ${res.status()} ${res.statusText()}`
    );
  }

  return await res.json();
}


// Fetch email body
export async function fetchMailBody(api, mailId) {
  const res = await api.get(`/en/mail?b=m&id=${encodeURIComponent(mailId)}`);

  if (!res.ok()) {
    throw new Error(`Failed to load Yopmail mail body for id: ${mailId}`);
  }

  return await res.text();
}


// Extract URL from email body
export function extractFirstLink(mailHtml) {
  const match = mailHtml.match(/https:\/\/[^\s"'<>]+/);
  return match ? match[0] : null;
}


// Poll inbox and return first mail containing marker
export async function waitForMailUrlByText(
  api,
  mailboxName,
  textMarker,
  { maxAttempts = 10, delayMs = 3000 } = {}
) {
  const safeMailbox = mailboxName.toLowerCase();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {

    const inbox = await fetchInboxMessages(api, safeMailbox);

    if (inbox.messages && inbox.messages.length > 0) {

      for (const msg of inbox.messages) {

        const mailHtml = await fetchMailBody(api, msg.id);

        if (mailHtml.toLowerCase().includes(textMarker.toLowerCase())) {

          const link = extractFirstLink(mailHtml);

          if (link) {
            return link;
          }

          // fallback return yopmail mail page
          return `https://yopmail.com/en/mail?b=m&id=${msg.id}`;
        }
      }
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error(
    `No Yopmail email found for ${mailboxName} containing marker "${textMarker}"`
  );
}