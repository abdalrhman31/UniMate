const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const envPath = path.join(__dirname, '..', '.env');

const readHidden = (prompt) => new Promise((resolve, reject) => {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    reject(new Error('Run this setup script in an interactive terminal.'));
    return;
  }

  let value = '';
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  const finish = (error) => {
    process.stdin.removeListener('data', handleInput);
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write('\n');
    if (error) reject(error);
    else resolve(value);
  };

  const handleInput = (input) => {
    for (const character of input) {
      if (character === '\u0003') return finish(new Error('Setup cancelled.'));
      if (character === '\r' || character === '\n') return finish();
      if (character === '\u0008' || character === '\u007f') {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    }
  };

  process.stdin.on('data', handleInput);
});

const main = async () => {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const email = (await prompt.question('Admin GJU email: ')).trim().toLowerCase();
  prompt.close();

  if (!/^[^\s@]+@gju\.edu\.jo$/.test(email)) {
    throw new Error('Enter a valid GJU email address.');
  }

  const password = await readHidden('Admin password (input is hidden): ');
  if (password.length < 8) throw new Error('The admin password must contain at least 8 characters.');

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  const sessionSecret = crypto.randomBytes(48).toString('hex');
  const existingLines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
  const preservedLines = existingLines.filter((line) => !/^\s*ADMIN_(EMAIL|PASSWORD_HASH|SESSION_SECRET)\s*=/.test(line));
  const configuredNames = new Set(
    preservedLines
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=/)?.[1])
      .filter(Boolean),
  );

  preservedLines.push(
    `ADMIN_EMAIL=${email}`,
    `ADMIN_PASSWORD_HASH=${salt}:${passwordHash}`,
    `ADMIN_SESSION_SECRET=${sessionSecret}`,
  );
  if (!configuredNames.has('APP_SESSION_SECRET')) {
    preservedLines.push(`APP_SESSION_SECRET=${crypto.randomBytes(48).toString('hex')}`);
  }
  if (!configuredNames.has('OUTLOOK_TOKEN_ENCRYPTION_KEY')) {
    preservedLines.push(`OUTLOOK_TOKEN_ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}`);
  }
  fs.writeFileSync(envPath, `${preservedLines.filter(Boolean).join('\n')}\n`, { mode: 0o600 });
  console.log('Admin credentials saved as a password hash in the ignored backend .env file.');
  console.log('Student session and Outlook token encryption secrets are preserved or generated securely.');
  console.log('Restart the backend server to apply the configuration.');
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
