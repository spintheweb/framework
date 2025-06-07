# Certificate folder

This folder contains the site private key and SSL certificate, these should be added to .env

Use the following openssl commands to generate them:

$ openssl genrsa -out key.pem // Generate private key
$ openssl req -new -key key.pem -out csr.pem // Create certificate signin request
$ openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem // Generate SSL certificate (del csr.pem)

As an alternative use:

$ certbot certonly

Or:

$ cd .cert/
$ openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj //CN=sandbox.spintheweb.org