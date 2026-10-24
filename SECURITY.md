# Security Policy

Report security vulnerabilities privately to the maintainers through GitHub private vulnerability reporting where enabled. Do not publish tokens, exploit details or sensitive information in issues.

Do not commit `.dev.vars`, `.env` files, keys or production credentials. Use Cloudflare secrets for deployment credentials. Rotate credentials exposed in Git history; adding ignore rules does not remove previous commits.

Changes to IrisKey authority checks, approvals, revocation or agent execution require independent security review and tests before deployment.
