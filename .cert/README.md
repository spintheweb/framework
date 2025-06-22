# Certificate folder

This folder contains the site private key and SSL certificate, these should be added to .env file.

Step 1: Install `mkcert`

[Download mkcert directly from the mkcert GitHub releases page](https://github.com/FiloSottile/mkcert/releases)

Step 2: Create a Local Certificate Authority (CA)

$ `mkcert -install`

Step 3: Generate the Certificate Files

$ `cd .cert`

In my case I use sandbox.spintheweb.org

$ `mkcert sandbox.spintheweb.org`

This will create two files in your .cert directory:
- sandbox.spintheweb.org.pem (the certificate)
- sandbox.spintheweb.org-key.pem (the private key)

Edit your .env file:

```
HOST=sandbox.spintheweb.org
PORT=443
CERTFILE=.cer/sandbox.spintheweb.org.pem
KEYFILE=.cer/sandbox.spintheweb.org-key.pem
```