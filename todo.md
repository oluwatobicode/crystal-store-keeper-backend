## Auth & Security

- [ ] OTP verification for sign up
- [ ] Welcome email
- [ ] generateRefreshToken
- [ ] Update password
- [ ] Forget password
- [✅ ] Logout with JWT blacklisting
- [ ] Email utils (config + send helpers)

## Features

- [ ] Payments controller
- [✅ ] Backup endpoints (CSV/JSON export, restore, schedule)
- [ ✅] Invoice PDF generation (pdfkit) --front-end handles it
- [ ] Partial payment top-up (PATCH /api/sales/:id/payment)
- [ ] Manager approval for large discounts

## Quality / Fixes

- [ ✅ ] Pagination on all list endpoints
- [ ✅ ] Fix adjustStock using req.body.performedBy → use req.user.\_id
- [ ] Fix receiveStock — wrap in transaction
- [✅ ] Fix response.ts — status: "true" → success: true
- [✅ ] Extract duplicate getLowStockProducts to shared service
