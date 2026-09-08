import fs from 'fs';
import path from 'path';

/**
 * Shared credentials for a commercial-contract customer created during Phase 2
 * (signing → save card → set password). Used by later specs in the same or next run.
 */

const SESSION_FILE = path.join(process.cwd(), 'Data', '.contractCustomer.session.json');

/** Default password used when the customer sets a portal password during onboarding */
export const DEFAULT_CONTRACT_CUSTOMER_PASSWORD = 'Password@123';

/** @type {{ email: string, password: string, customerName?: string, savedAt?: string } | null} */
let inMemory = null;

/**
 * @param {{ email: string, password: string, customerName?: string }} creds
 */
export function saveContractCustomerCredentials(creds) {
    if (!creds?.email || !creds?.password) {
        throw new Error('saveContractCustomerCredentials requires email and password');
    }
    inMemory = {
        email: creds.email,
        password: creds.password,
        customerName: creds.customerName || '',
        savedAt: new Date().toISOString(),
    };
    try {
        fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
        fs.writeFileSync(SESSION_FILE, JSON.stringify(inMemory, null, 2), 'utf8');
    } catch {
        // Disk write is best-effort — in-memory is enough for the current process
    }
    return { ...inMemory };
}

/**
 * @returns {{ email: string, password: string, customerName?: string, savedAt?: string } | null}
 */
export function loadContractCustomerCredentials() {
    if (inMemory?.email && inMemory?.password) {
        return { ...inMemory };
    }
    try {
        if (!fs.existsSync(SESSION_FILE)) return null;
        const parsed = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
        if (parsed?.email && parsed?.password) {
            inMemory = parsed;
            return { ...parsed };
        }
    } catch {
        // ignore corrupt/missing file
    }
    return null;
}

/**
 * @returns {{ email: string, password: string, customerName?: string, savedAt?: string }}
 */
export function requireContractCustomerCredentials() {
    const creds = loadContractCustomerCredentials();
    if (!creds) {
        throw new Error(
            'No contract customer credentials saved yet — complete save-card + set-password onboarding first'
        );
    }
    return creds;
}
