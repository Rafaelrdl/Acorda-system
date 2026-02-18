# Icones PWA

Esta pasta deve conter os icones do app nos seguintes tamanhos:

## Icones obrigatorios

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Icones Apple

- apple-touch-icon.png (180x180)

## Favicons

- favicon-16x16.png
- favicon-32x32.png
- favicon.ico

## Como gerar

1. Crie uma imagem de 512x512 pixels do logo
2. Use um gerador de PWA icons como:
   - <https://realfavicongenerator.net/>
   - <https://www.pwabuilder.com/imageGenerator>

Ou use ImageMagick:

```bash
convert logo-512.png -resize 192x192 icon-192x192.png
convert logo-512.png -resize 384x384 icon-384x384.png
# etc...
```
