# Brain 2 staging release gates

No production deployment is authorized by this document.

1. Require server-verified founder authentication on every endpoint except health; derive tenant and actor from trusted claims, not request JSON.
2. Scope jobs, audit, approvals and memory by verified tenant and actor; test cross-tenant denial.
3. Keep all outbound communications, publication, purchases, and production writes disabled unless approved for exact immutable arguments, expiry and one-time use.
4. Run the 32-role roster through isolated microjobs and verified no-cost inference; do not claim a live integration from a model profile alone.
5. Test durable scheduling, retries, crash recovery, emergency stop, and three 9:16 Shorts/day queued for approval.
6. Keep IrisKey licensing and 8ORA commercial data, tools and permissions separate.
7. Publish no patent-sensitive data. No deployment or spend without founder approval.
