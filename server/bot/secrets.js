/**
 * SECRETS.JS — Chiffrement/déchiffrement des secrets bot Steam
 *
 * Les shared_secret et identity_secret donnent un accès TOTAL au compte bot.
 * Ils sont chiffrés AES-256-GCM au repos et déchiffrés uniquement en mémoire.
 *
 * Clé de chiffrement : env var ENCRYPTION_KEY (32 bytes hex ou base64)
 * Générer une clé : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY manquante — impossible de déchiffrer les secrets bot');

  // Accepte hex (64 chars) ou base64 (44 chars)
  const buf = raw.length === 64
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY doit faire 32 bytes (64 hex ou 44 base64)');
  return buf;
}

/**
 * Chiffre un secret en AES-256-GCM.
 * @param {string} plaintext
 * @returns {string} iv:tag:ciphertext (hex)
 */
function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Déchiffre un secret AES-256-GCM.
 * @param {string} encoded  format iv:tag:ciphertext (hex)
 * @returns {string} plaintext
 */
function decrypt(encoded) {
  const key = getEncryptionKey();
  const [ivHex, tagHex, dataHex] = encoded.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Format de secret invalide (attendu iv:tag:data)');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);

  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
