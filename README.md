# OpenClaw Railway Template (XMTP)

1‑click deploy for **OpenClaw** on Railway with **/setup** wizard. Uses the [XMTP channel](https://github.com/xmtplabs/openclaw/blob/feat/xmtp-and-convos-extensions/docs/channels/xmtp.md).

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/_1f6xq?referralCode=UxaXte&utm_medium=integration&utm_source=template&utm_campaign=generic)

### Setup

> XMTP extension is not in upstream OpenClaw yet. Use the [xmtplabs/openclaw](https://github.com/xmtplabs/openclaw) fork, branch `feat/xmtp-and-convos-extensions` ([PR #2](https://github.com/xmtplabs/openclaw/pull/2)).

```bash
openclaw configure
```

Choose environment (`production`/`dev`) and keys (`Random` or `Custom`). The wizard displays your agent's public address.

### Commands

| Command | Description |
|---------|-------------|
| `/address` | Print your XMTP public agent address |

### Actions

| Action | Params | Description |
|--------|--------|-------------|
| `send` | `to`, `message` | Send a text message to an XMTP address |

### Config

| Key | Default | Description |
|-----|---------|-------------|
| `walletKey` | — | Wallet private key (hex) |
| `dbEncryptionKey` | — | DB encryption key |
| `env` | `production` | `production` or `dev` |
| `dmPolicy` | `pairing` | `pairing`, `allowlist`, `open`, `disabled` |
| `groupPolicy` | `open` | `open`, `disabled`, `allowlist` |
| `allowFrom` | — | Address allowlist (when `dmPolicy` is `allowlist`) |
| `groups` | — | Conversation ID allowlist (when `groupPolicy` is `allowlist`) |
