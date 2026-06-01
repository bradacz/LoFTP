# FAQ

## Is LoFTP open source?

Yes. The repository is licensed under the MIT License.

## Do I need to pay to use LoFTP?

No. The application works without functional restrictions. Payment is a voluntary contribution to development.

## Is LoFTP only for macOS?

The current implementation is strongly macOS-oriented.

## Does LoFTP support unlimited saved FTP and SFTP connections?

Yes. That is one of the core workflow advantages of the project.

## Does LoFTP search remote servers?

Not currently. Search is implemented for the local filesystem.

## Can I edit remote files directly in place?

Not as a direct in-place remote editing flow. The built-in editor writes local text files.

## Does LoFTP work with AI or Codex?

Yes. The project includes AI-oriented workflows inside the application and a bundled LoFTP Codex Connector that can be installed from `Settings -> Codex`.

## Do I need a separate Codex add-on download?

No. The Codex Connector is bundled with LoFTP. Install or repair it from `Settings -> Codex`.

## How does another user connect Codex to LoFTP?

They install LoFTP, save their own profiles, open `Settings -> Codex`, enable the local bridge, click `Install / repair connector`, and test the connector. The bridge token and connector config are generated locally for that user.

## Where do I configure Bunny.net?

Create or edit a saved hosting profile and choose `Bunny Storage`. Enter the storage zone name, Bunny Storage access key, and optional pull zone URL.

## Does Codex receive my passwords or API keys?

No. FTP, SFTP, Bunny Storage, SSH, and AI credentials stay inside LoFTP. Codex receives metadata, listings, plans, and transfer status through the local bridge.
