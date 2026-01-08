import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import forge from 'node-forge';

const pki = forge.pki;

// Generate keypair
const keys = pki.rsa.generateKeyPair(2048);

// Create certificate
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [{
  name: 'commonName',
  value: 'localhost'
}, {
  name: 'countryName',
  value: 'BR'
}, {
  shortName: 'ST',
  value: 'State'
}, {
  name: 'localityName',
  value: 'City'
}, {
  name: 'organizationName',
  value: 'Minhas Financas'
}, {
  shortName: 'OU',
  value: 'Dev'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.setExtensions([{
  name: 'basicConstraints',
  cA: true
}, {
  name: 'keyUsage',
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: 'subjectAltName',
  altNames: [{
    type: 2, // DNS
    value: 'localhost'
  }, {
    type: 2,
    value: '192.168.0.6'
  }, {
    type: 7, // IP
    ip: '127.0.0.1'
  }, {
    type: 7,
    ip: '192.168.0.6'
  }]
}]);

// Self-sign certificate
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convert to PEM
const pem = {
  privateKey: pki.privateKeyToPem(keys.privateKey),
  publicKey: pki.publicKeyToPem(keys.publicKey),
  certificate: pki.certificateToPem(cert)
};

// Save files
writeFileSync('localhost-key.pem', pem.privateKey);
writeFileSync('localhost.pem', pem.certificate);

console.log('✅ SSL certificates generated!');
console.log('   - localhost-key.pem');
console.log('   - localhost.pem');
