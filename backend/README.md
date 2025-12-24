# backend

## Implementing JWT Auth

We need a couple different functions
- Hash password
- Check password hash
- Make JWT token
- Get bearer token from Authorization header
- Validate JWT

- make refresh token

How do we plan to store JWT tokens?
- Http only, secure, same-site cookies
- Refresh will be stored in db