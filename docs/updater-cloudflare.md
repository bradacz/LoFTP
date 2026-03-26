# LoFTP updater + Cloudflare

## Build-time promenne

- `LOFTP_UPDATER_PUBLIC_KEY`
- `LOFTP_UPDATER_ENDPOINT`

Pokud nejsou nastaveny, aplikace zobrazi v `About` updater jako nenakonfigurovany.

## Doporuceny endpoint

- `https://downloads.loftp.mylocalio.com/stable/latest.json`

## R2 struktura

```text
/stable/latest.json
/stable/macos/aarch64/LoFTP.dmg
/stable/macos/aarch64/LoFTP.app.tar.gz
/stable/macos/aarch64/LoFTP.app.tar.gz.sig
/stable/macos/aarch64/release-notes.txt

/releases/1.0.0/macos/aarch64/LoFTP.dmg
/releases/1.0.0/macos/aarch64/LoFTP.app.tar.gz
/releases/1.0.0/macos/aarch64/LoFTP.app.tar.gz.sig
/releases/1.0.0/release-notes.txt
```

## Release poradi

1. Postavit release aplikaci.
2. Podepsat a notarizovat `.app`.
3. Vygenerovat updater artifacty.
4. Uploadnout artefakty do `/releases/x.y.z/...`.
5. Overit verejna URL.
6. Zapsat nebo prepnout `/stable/latest.json`.
