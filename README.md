# Deploy

## Pull latest updates
```bash
cd /var/www/domains/iotroot.astraval.com/IotRootFrontend

git pull
```

## Install dependencies
```bash
npm ci 
```

## Build & deploy frontend
```bash
npm run build
cp -r dist/* /var/www/iotroot/public
``