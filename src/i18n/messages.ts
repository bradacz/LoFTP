export type Locale = "cs" | "en" | "de" | "sk" | "pl" | "es";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface Messages {
  meta: {
    nativeName: string;
  };
  common: {
    close: string;
    cancel: string;
    save: string;
    saveChanges: string;
    delete: string;
    rename: string;
    create: string;
    continue: string;
    install: string;
    loading: string;
    local: string;
    server: string;
    all: string;
    selectedCount: string;
    filesCountLabel: string;
    dir: string;
    light: string;
    dark: string;
  };
  settings: {
    title: string;
    license: string;
    fullVersionActivated: string;
    activate: string;
    appearance: string;
    language: string;
  };
  toolbar: {
    newConnection: string;
    refresh: string;
    disconnect: string;
    upload: string;
    download: string;
    folder: string;
    rename: string;
    delete: string;
    search: string;
    compare: string;
    openArchive: string;
    createArchive: string;
    settings: string;
    about: string;
  };
  about: {
    version: string;
    description: string;
    eula: string;
    terms: string;
    privacy: string;
    updates: string;
    checking: string;
    check: string;
    latest: string;
    updateAvailable: string;
    installing: string;
    updateError: string;
    notChecked: string;
    updatesNotConfigured: string;
  };
  hostingDialog: {
    editTitle: string;
    newTitle: string;
    name: string;
    namePlaceholder: string;
    host: string;
    port: string;
    protocol: string;
    user: string;
    password: string;
    ftps: string;
    sshKey: string;
    chooseKey: string;
    chooseKeyTitle: string;
    testConnection: string;
    testing: string;
    connectionOk: string;
    connectionOkDescription: string;
    connectionFailed: string;
  };
  driveSelector: {
    volumes: string;
    cloud: string;
    servers: string;
    quickAccess: string;
    home: string;
    desktop: string;
    downloads: string;
    free: string;
  };
  search: {
    title: string;
    searchIn: string;
    fileName: string;
    containingText: string;
    subfolders: string;
    caseSensitive: string;
    search: string;
    searching: string;
    found: string;
    results: string;
    noResults: string;
  };
  transferDialog: {
    uploadTitle: string;
    downloadTitle: string;
    archiveExtractTitle: string;
    copyTitle: string;
    transferMode: string;
    auto: string;
    binary: string;
    overwriteExisting: string;
    ask: string;
    overwrite: string;
    overwriteOlder: string;
    skip: string;
    rename: string;
    options: string;
    resume: string;
    preserveTimestamps: string;
    preservePermissions: string;
    followSymlinks: string;
    createDirs: string;
    verify: string;
    extract: string;
    copy: string;
    fileOne: string;
    fileFew: string;
    fileMany: string;
    moreFiles: string;
    advancedOptions: string;
  };
  compare: {
    title: string;
    newer: string;
    older: string;
    differs: string;
    localOnly: string;
    remoteOnly: string;
    same: string;
    syncToRemote: string;
    syncToLocal: string;
  };
  shareware: {
    version: string;
    body: string;
    activateLicense: string;
    buyLicense: string;
  };
  purchase: {
    doneTitle: string;
    doneBody: string;
    doneHint: string;
    title: string;
    securePayment: string;
    lifetimeLicense: string;
    email: string;
    redirectNotice: string;
    openPayment: string;
  };
  editor: {
    unsupported: string;
    unsavedConfirm: string;
    saving: string;
    save: string;
    loadingFile: string;
    lines: string;
    unsaved: string;
    saveShortcut: string;
  };
  quickView: {
    loading: string;
    imageTooLarge: string;
    pdfTooLarge: string;
    lines: string;
  };
  transferStatus: {
    transferring: string;
    done: string;
    error: string;
    paused: string;
    queued: string;
    files: string;
    active: string;
    pending: string;
    completed: string;
    errors: string;
    cancelAll: string;
  };
  transferQueue: {
    title: string;
    active: string;
    pending: string;
    done: string;
    errors: string;
    retry: string;
    moveUp: string;
    cancel: string;
  };
  functionKeys: {
    view: string;
    edit: string;
    copy: string;
    move: string;
    folder: string;
    delete: string;
    search: string;
  };
  contextMenu: {
    copyPath: string;
    copyName: string;
    openInFinder: string;
    openInVsCode: string;
    openArchive: string;
    createArchive: string;
    chmod: string;
    properties: string;
    rename: string;
    delete: string;
  };
  hostingTabs: {
    empty: string;
    editAria: string;
    deleteAria: string;
    deleteTitle: string;
    deleteMessage: string;
    deleteFallback: string;
  };
  archive: {
    filesAndDirs: string;
    total: string;
    extracting: string;
    extractSelected: string;
    extractAll: string;
  };
  properties: {
    title: string;
    name: string;
    path: string;
    type: string;
    folder: string;
    file: string;
    size: string;
    modified: string;
    permissions: string;
  };
  dialogs: {
    newFolderTitle: string;
    newFolderLabel: string;
    renameTitle: string;
    renameLabel: string;
    createArchiveTitle: string;
    createArchiveLabel: string;
    deleteTitle: string;
    deleteMessage: string;
  };
  toasts: {
    archiveCreated: string;
    archiveCreateFailed: string;
    folderOpenFailed: string;
    onedrivePickFailed: string;
    onedriveOpenedStored: string;
    onedriveOpenedPicker: string;
    connectionFailed: string;
  };
  notFound: {
    message: string;
    backHome: string;
  };
  legal: {
    copyrightNotice: string;
    eulaTitle: string;
    termsTitle: string;
    privacyTitle: string;
    eulaSections: LegalSection[];
    termsSections: LegalSection[];
    privacySections: LegalSection[];
  };
}

const legalTemplate = {
  eulaSections: [
    {
      heading: "Introduction",
      paragraphs: [
        "This End User License Agreement (EULA) is a legally binding agreement between you and Localio Labs s.r.o. regarding your use of the LoFTP application.",
        "By installing, launching or otherwise using the application, you confirm that you have read these terms and agree to them in full.",
      ],
    },
    {
      heading: "License Grant",
      paragraphs: [
        "LoFTP is distributed as shareware. All application features remain available even without a purchased license. The only limitation of the unactivated version is the display of an information window on each start.",
        "After purchasing and activating a license key, you receive a perpetual, non-exclusive and non-transferable license to use the application on one device. The license is tied to a specific installation and cannot be transferred to another device without prior deactivation.",
      ],
    },
    {
      heading: "Restrictions and Prohibited Conduct",
      paragraphs: [
        "You may not copy, modify, decompile, reverse engineer, redistribute, rent, sublicense or bypass the licensing mechanisms of the application or any part of it.",
        "Sharing license keys with third parties, using automated tools to generate keys or attempting to compromise the licensing infrastructure is prohibited and may result in immediate license invalidation.",
      ],
    },
    {
      heading: "Updates and Services",
      paragraphs: [
        "Localio Labs reserves the right to update, extend or modify the application over time. Updates may be distributed automatically and may be required to preserve full functionality.",
        "Some services, including license verification, purchasing and update downloads, require an active internet connection. The provider does not guarantee uninterrupted availability of these services.",
      ],
    },
    {
      heading: "Disclaimer",
      paragraphs: [
        'The application is provided "as is", without express or implied warranties of any kind, including fitness for a particular purpose, error-free operation or uninterrupted availability.',
        "You remain fully responsible for the correctness of server credentials, transfer configuration and regular backups of your data. The provider is not liable for loss, corruption or incomplete transfer of data to the maximum extent permitted by applicable law.",
      ],
    },
    {
      heading: "Termination",
      paragraphs: [
        "This license remains valid until terminated. Breach of any provision of this agreement automatically terminates your rights arising from the license.",
        "You may terminate the license at any time by uninstalling the application from your device. Upon termination, you are not entitled to a refund of the paid license fee.",
      ],
    },
    {
      heading: "Governing Law",
      paragraphs: [
        "This agreement is governed by the laws of the Czech Republic. Any disputes shall be resolved by the competent courts of the Czech Republic.",
      ],
    },
  ] as LegalSection[],
  termsSections: [
    {
      heading: "Provider and Scope",
      paragraphs: [
        "These commercial terms govern the purchase of software licenses for LoFTP from Localio Labs s.r.o.",
        "They apply to the ordering process, payment, electronic delivery of the license and related customer communication.",
      ],
    },
    {
      heading: "Order and Contract Formation",
      paragraphs: [
        "An order is created by completing the checkout form and confirming payment through the payment gateway.",
        "The purchase contract is concluded once the payment is successfully authorized and the order is accepted by the provider.",
      ],
    },
    {
      heading: "Price and Payment",
      paragraphs: [
        "All prices are shown before completing the order. Payment is processed through Stripe or another designated payment partner.",
        "The provider does not store full payment card details and receives only the information necessary to confirm the transaction.",
      ],
    },
    {
      heading: "Delivery of Digital Content",
      paragraphs: [
        "The license key is delivered electronically to the email address entered during purchase.",
        "Delivery usually takes place immediately after successful payment, but may be delayed in justified technical cases.",
      ],
    },
    {
      heading: "Refunds and Complaints",
      paragraphs: [
        "If the delivered license key is defective or cannot be activated due to a provider-side issue, the customer may request a remedy or replacement.",
        "Because the product is digital content delivered without a physical medium, withdrawal rights may be limited once delivery begins, where permitted by applicable law.",
      ],
    },
    {
      heading: "Support and Contact",
      paragraphs: [
        "Questions about orders, invoices, license delivery or complaints may be sent through the contact form on www.mylocalio.com.",
        "The provider handles customer requests without undue delay and aims to resolve legitimate complaints within a reasonable time.",
      ],
    },
  ] as LegalSection[],
  privacySections: [
    {
      heading: "Data Controller",
      paragraphs: [
        "Localio Labs s.r.o., seated in the Czech Republic, acts as the controller of your personal data. Questions regarding processing can be submitted through the contact form on www.mylocalio.com.",
      ],
    },
    {
      heading: "Scope of Processed Data",
      paragraphs: [
        "For the purchase and activation of a license, we process your email address, license key, purchased license type, unique installation identifier and basic technical metadata such as application version and operating system.",
        "The application stores server connection settings locally, including login credentials. Passwords are protected through the system key store where available. This data does not leave your device.",
      ],
    },
    {
      heading: "Purpose and Legal Basis",
      paragraphs: [
        "Your data is processed for the conclusion and performance of the license contract, issuance and delivery of the license key, customer support, update distribution and protection against unauthorized license use.",
        "The legal basis includes performance of a contract, compliance with legal obligations and, where justified, the controller's legitimate interest.",
      ],
    },
    {
      heading: "Recipients and Processors",
      paragraphs: [
        "Payments are processed through Stripe, Inc. or another payment processor acting as an independent controller of payment data. The provider does not access payment card details.",
        "License delivery and supporting services may be handled by contractual processors bound by confidentiality and appropriate security measures.",
        "FTP/SFTP credentials remain exclusively on your device and are not shared with third parties.",
      ],
    },
    {
      heading: "Retention Period",
      paragraphs: [
        "Data related to the license is retained for the duration of the contractual relationship and subsequently for the period required by accounting, tax and archival regulations.",
        "Locally stored configuration data and passwords remain on your device until you remove them manually or uninstall the application.",
      ],
    },
    {
      heading: "Your Rights",
      paragraphs: [
        "Under applicable privacy law, including GDPR where relevant, you may request access, rectification, erasure, restriction, portability or object to processing.",
        "To exercise your rights, contact us via www.mylocalio.com. We respond without undue delay, no later than within the period required by law.",
      ],
    },
  ] as LegalSection[],
};

const deLegal: Messages["legal"] = {
  copyrightNotice: "© 2026 Localio Labs s.r.o. Alle Rechte vorbehalten.",
  eulaTitle: "Lizenzbedingungen (EULA)",
  termsTitle: "Geschäftsbedingungen",
  privacyTitle: "Datenschutz und DSGVO",
  eulaSections: [
    { heading: "Einleitung", paragraphs: ["Diese Vereinbarung regelt Ihre Nutzung von LoFTP und wird durch Installation oder Nutzung der Anwendung akzeptiert."] },
    { heading: "Lizenz", paragraphs: ["LoFTP wird als Shareware bereitgestellt; nach Aktivierung erhalten Sie eine nicht exklusive, nicht übertragbare Lizenz für ein Gerät."] },
    { heading: "Haftung", paragraphs: ["Die Anwendung wird ohne Gewähr bereitgestellt; Sie bleiben für Zugangsdaten, Übertragungen und Backups verantwortlich."] },
  ],
  termsSections: [
    { heading: "Bestellung", paragraphs: ["Die Bestellung wird durch den Checkout und die erfolgreiche Zahlungsbestätigung abgeschlossen."] },
    { heading: "Zahlung und Lieferung", paragraphs: ["Die Zahlung wird über einen Zahlungsdienstleister verarbeitet und der Lizenzschlüssel wird elektronisch per E-Mail zugestellt."] },
    { heading: "Reklamation", paragraphs: ["Bei Problemen mit Lizenzzustellung oder Aktivierung können Sie den Support von Localio Labs kontaktieren."] },
  ],
  privacySections: [
    { heading: "Verarbeitete Daten", paragraphs: ["Wir verarbeiten E-Mail, Lizenzdaten, Installationskennung und technische Metadaten zur Lizenzverwaltung."] },
    { heading: "Zweck", paragraphs: ["Die Daten werden für Lizenzzustellung, Support, Updates und Schutz vor unbefugter Nutzung verarbeitet."] },
    { heading: "Rechte", paragraphs: ["Sie haben die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit und Widerspruch nach geltendem Datenschutzrecht."] },
  ],
};

const skLegal: Messages["legal"] = {
  copyrightNotice: "© 2026 Localio Labs s.r.o. Všetky práva vyhradené.",
  eulaTitle: "Licenčné podmienky (EULA)",
  termsTitle: "Obchodné podmienky",
  privacyTitle: "Ochrana súkromia a GDPR",
  eulaSections: [
    { heading: "Úvod", paragraphs: ["Táto dohoda upravuje používanie aplikácie LoFTP a prijímate ju inštaláciou alebo používaním aplikácie."] },
    { heading: "Licencia", paragraphs: ["LoFTP je poskytovaná ako shareware; po aktivácii získavate nevýhradnú a neprenosnú licenciu pre jedno zariadenie."] },
    { heading: "Zodpovednosť", paragraphs: ["Aplikácia je poskytovaná bez záruk a za prístupové údaje, prenosy a zálohy zodpovedá používateľ."] },
  ],
  termsSections: [
    { heading: "Objednávka", paragraphs: ["Objednávka je dokončená checkoutom a úspešným potvrdením platby."] },
    { heading: "Platba a doručenie", paragraphs: ["Platba je spracovaná cez platobného partnera a licenčný kľúč je doručený elektronicky e-mailom."] },
    { heading: "Reklamácie", paragraphs: ["Pri problémoch s doručením alebo aktiváciou licencie môžete kontaktovať podporu Localio Labs."] },
  ],
  privacySections: [
    { heading: "Spracúvané údaje", paragraphs: ["Spracúvame e-mail, licenčné údaje, identifikátor inštalácie a technické metadáta na správu licencie."] },
    { heading: "Účel", paragraphs: ["Údaje sa používajú na doručenie licencie, podporu, aktualizácie a ochranu pred neoprávneným použitím."] },
    { heading: "Práva", paragraphs: ["Máte právo na prístup, opravu, výmaz, obmedzenie, prenosnosť a námietku podľa platných predpisov."] },
  ],
};

const plLegal: Messages["legal"] = {
  copyrightNotice: "© 2026 Localio Labs s.r.o. Wszelkie prawa zastrzeżone.",
  eulaTitle: "Warunki licencji (EULA)",
  termsTitle: "Warunki handlowe",
  privacyTitle: "Prywatność i RODO",
  eulaSections: [
    { heading: "Wprowadzenie", paragraphs: ["Niniejsza umowa reguluje korzystanie z LoFTP i zostaje zaakceptowana przez instalację lub używanie aplikacji."] },
    { heading: "Licencja", paragraphs: ["LoFTP jest udostępniana jako shareware; po aktywacji otrzymujesz niewyłączną i nieprzenoszalną licencję na jedno urządzenie."] },
    { heading: "Odpowiedzialność", paragraphs: ["Aplikacja jest dostarczana bez gwarancji, a użytkownik odpowiada za dane logowania, transfery i kopie zapasowe."] },
  ],
  termsSections: [
    { heading: "Zamówienie", paragraphs: ["Zamówienie zostaje sfinalizowane po przejściu procesu checkout i potwierdzeniu płatności."] },
    { heading: "Płatność i dostawa", paragraphs: ["Płatność jest przetwarzana przez partnera płatniczego, a klucz licencyjny jest dostarczany elektronicznie na e-mail."] },
    { heading: "Reklamacje", paragraphs: ["W przypadku problemów z dostarczeniem lub aktywacją licencji można skontaktować się ze wsparciem Localio Labs."] },
  ],
  privacySections: [
    { heading: "Przetwarzane dane", paragraphs: ["Przetwarzamy adres e-mail, dane licencji, identyfikator instalacji i metadane techniczne do zarządzania licencją."] },
    { heading: "Cel", paragraphs: ["Dane są używane do dostarczenia licencji, wsparcia, aktualizacji i ochrony przed nieuprawnionym użyciem."] },
    { heading: "Prawa", paragraphs: ["Przysługują Ci prawa dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia i sprzeciwu zgodnie z obowiązującym prawem."] },
  ],
};

const esLegal: Messages["legal"] = {
  copyrightNotice: "© 2026 Localio Labs s.r.o. Todos los derechos reservados.",
  eulaTitle: "Términos de licencia (EULA)",
  termsTitle: "Términos comerciales",
  privacyTitle: "Privacidad y RGPD",
  eulaSections: [
    { heading: "Introducción", paragraphs: ["Este acuerdo regula el uso de LoFTP y se acepta al instalar o utilizar la aplicación."] },
    { heading: "Licencia", paragraphs: ["LoFTP se ofrece como shareware; tras la activación obtienes una licencia no exclusiva e intransferible para un dispositivo."] },
    { heading: "Responsabilidad", paragraphs: ["La aplicación se proporciona sin garantías y el usuario sigue siendo responsable de credenciales, transferencias y copias de seguridad."] },
  ],
  termsSections: [
    { heading: "Pedido", paragraphs: ["El pedido se completa al finalizar el proceso de pago y confirmar correctamente la transacción."] },
    { heading: "Pago y entrega", paragraphs: ["El pago se procesa mediante un proveedor de pago y la clave de licencia se entrega electrónicamente por correo."] },
    { heading: "Reclamaciones", paragraphs: ["Si hay problemas con la entrega o activación de la licencia, puede contactar con el soporte de Localio Labs."] },
  ],
  privacySections: [
    { heading: "Datos tratados", paragraphs: ["Tratamos el correo electrónico, los datos de licencia, el identificador de instalación y metadatos técnicos para gestionar la licencia."] },
    { heading: "Finalidad", paragraphs: ["Los datos se usan para entregar la licencia, ofrecer soporte, distribuir actualizaciones y prevenir el uso no autorizado."] },
    { heading: "Derechos", paragraphs: ["Tiene derecho de acceso, rectificación, supresión, limitación, portabilidad y oposición conforme a la normativa aplicable."] },
  ],
};

function createMessages(nativeName: string): Messages {
  return {
    meta: { nativeName },
    common: {
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      saveChanges: "Save changes",
      delete: "Delete",
      rename: "Rename",
      create: "Create",
      continue: "Continue",
      install: "Install",
      loading: "Loading...",
      local: "Local",
      server: "Server",
      all: "All",
      selectedCount: "{count} selected",
      filesCountLabel: "Files: {done}/{total}",
      dir: "DIR",
      light: "Light",
      dark: "Dark",
    },
    settings: {
      title: "Settings",
      license: "License",
      fullVersionActivated: "Full version activated",
      activate: "Activate",
      appearance: "Appearance",
      language: "Language",
    },
    toolbar: {
      newConnection: "New connection",
      refresh: "Refresh",
      disconnect: "Disconnect",
      upload: "Upload",
      download: "Download",
      folder: "Folder",
      rename: "Rename",
      delete: "Delete",
      search: "Search",
      compare: "Compare",
      openArchive: "Open archive",
      createArchive: "Create archive",
      settings: "Settings",
      about: "About",
    },
    about: {
      version: "Version {version}",
      description: "Desktop FTP/SFTP client for macOS focused on fast file and transfer management.",
      eula: "License terms",
      terms: "Business terms",
      privacy: "Privacy",
      updates: "Updates",
      checking: "Checking...",
      check: "Check",
      latest: "Latest version",
      updateAvailable: "Available: v{version}",
      installing: "Installing... {percent} %",
      updateError: "Update error",
      notChecked: "Not checked",
      updatesNotConfigured: "Updates are not configured",
    },
    hostingDialog: {
      editTitle: "Edit hosting",
      newTitle: "New hosting",
      name: "Name",
      namePlaceholder: "My server",
      host: "Host",
      port: "Port",
      protocol: "Protocol",
      user: "User",
      password: "Password",
      ftps: "FTPS (TLS/SSL)",
      sshKey: "SSH key (optional)",
      chooseKey: "Choose",
      chooseKeyTitle: "Choose SSH key",
      testConnection: "Test connection",
      testing: "Testing...",
      connectionOk: "Connection looks good",
      connectionOkDescription: "Login and root listing completed successfully.",
      connectionFailed: "Connection test failed",
    },
    driveSelector: {
      volumes: "Volumes",
      cloud: "Cloud",
      servers: "Servers",
      quickAccess: "Quick access",
      home: "Home folder",
      desktop: "Desktop",
      downloads: "Downloads",
      free: "free",
    },
    search: {
      title: "Search files",
      searchIn: "Search in:",
      fileName: "File name (glob)",
      containingText: "Containing text",
      subfolders: "Subfolders",
      caseSensitive: "Case sensitive",
      search: "Search",
      searching: "Searching...",
      found: "Found:",
      results: "results",
      noResults: "No results",
    },
    transferDialog: {
      uploadTitle: "Upload files",
      downloadTitle: "Download files",
      archiveExtractTitle: "Copy from archive",
      copyTitle: "Copy files",
      transferMode: "Transfer mode",
      auto: "Automatic",
      binary: "Binary",
      overwriteExisting: "When file exists",
      ask: "Ask",
      overwrite: "Overwrite",
      overwriteOlder: "Overwrite older",
      skip: "Skip",
      rename: "Rename",
      options: "Options",
      resume: "Resume interrupted transfer",
      preserveTimestamps: "Preserve timestamps",
      preservePermissions: "Preserve permissions",
      followSymlinks: "Follow symlinks",
      createDirs: "Create directories",
      verify: "Verify after transfer",
      extract: "Extract",
      copy: "Copy",
      fileOne: "file",
      fileFew: "files",
      fileMany: "files",
      moreFiles: "more files",
      advancedOptions: "Advanced options",
    },
    compare: {
      title: "Comparison:",
      newer: "newer",
      older: "older",
      differs: "different",
      localOnly: "local only",
      remoteOnly: "server only",
      same: "same",
      syncToRemote: "Sync ->",
      syncToLocal: "<- Sync",
    },
    shareware: {
      version: "Version 1.0.0",
      body: "This app is shareware. All features are fully available. After license activation this window will stop appearing.",
      activateLicense: "Activate license",
      buyLicense: "Buy license",
    },
    purchase: {
      doneTitle: "Payment opened in browser",
      doneBody: "Complete the payment in your browser. After a successful payment, the license key will be sent to {email}.",
      doneHint: "Enter the code in Settings -> Activation code.",
      title: "Buy full version",
      securePayment: "Secure payment",
      lifetimeLicense: "LoFTP license (lifetime)",
      email: "Email (for license delivery)",
      redirectNotice: "You will be redirected to Stripe's secure payment page.",
      openPayment: "Continue to payment",
    },
    editor: {
      unsupported: "This file cannot be edited (binary file).",
      unsavedConfirm: "File has unsaved changes. Close anyway?",
      saving: "Saving...",
      save: "Save",
      loadingFile: "Loading file...",
      lines: "{count} lines",
      unsaved: "Unsaved",
      saveShortcut: "Ctrl+S to save",
    },
    quickView: {
      loading: "Loading...",
      imageTooLarge: "Image is too large for preview ({size})",
      pdfTooLarge: "PDF is too large for preview ({size})",
      lines: "{count} lines",
    },
    transferStatus: {
      transferring: "Transferring",
      done: "Done",
      error: "Transfer error",
      paused: "Paused",
      queued: "Queued",
      files: "Files",
      active: "Active",
      pending: "Pending",
      completed: "Completed {count} files",
      errors: "{count} errors",
      cancelAll: "Cancel all transfers",
    },
    transferQueue: {
      title: "Transfer queue",
      active: "Active",
      pending: "Pending",
      done: "Done",
      errors: "Errors",
      retry: "Retry",
      moveUp: "Move up",
      cancel: "Cancel",
    },
    functionKeys: {
      view: "View",
      edit: "Edit",
      copy: "Copy",
      move: "Move",
      folder: "Folder",
      delete: "Delete",
      search: "Search",
    },
    contextMenu: {
      copyPath: "Copy path",
      copyName: "Copy name",
      openInFinder: "Open in Finder",
      openInVsCode: "Open in VS Code",
      openArchive: "Open archive",
      createArchive: "Create archive",
      chmod: "Change permissions",
      properties: "Properties",
      rename: "Rename",
      delete: "Delete",
    },
    hostingTabs: {
      empty: 'No saved hostings. Click "New+" to add one.',
      editAria: "Edit {name}",
      deleteAria: "Delete {name}",
      deleteTitle: "Delete saved connection?",
      deleteMessage: 'The account "{name}" will be removed from saved connections including its password.',
      deleteFallback: "This action removes the saved connection.",
    },
    archive: {
      filesAndDirs: "{files} files, {dirs} folders",
      total: "Total: {size}",
      extracting: "Extracting...",
      extractSelected: "Extract selected",
      extractAll: "Extract all",
    },
    properties: {
      title: "Properties",
      name: "Name",
      path: "Path",
      type: "Type",
      folder: "Folder",
      file: "File",
      size: "Size",
      modified: "Modified",
      permissions: "Permissions",
    },
    dialogs: {
      newFolderTitle: "New folder",
      newFolderLabel: "Folder name:",
      renameTitle: "Rename",
      renameLabel: "New name:",
      createArchiveTitle: "Create archive",
      createArchiveLabel: "ZIP archive name:",
      deleteTitle: "Delete",
      deleteMessage: "Delete {count} items?",
    },
    toasts: {
      archiveCreated: "Archive created",
      archiveCreateFailed: "Failed to create archive",
      folderOpenFailed: "Failed to open folder",
      onedrivePickFailed: "Failed to select OneDrive folder",
      onedriveOpenedStored: "OneDrive was opened via the stored path.",
      onedriveOpenedPicker: "OneDrive was opened via the system folder picker.",
      connectionFailed: "Connection failed",
    },
    notFound: {
      message: "Oops! Page not found",
      backHome: "Return home",
    },
    legal: {
      copyrightNotice: "© 2026 Localio Labs s.r.o. All rights reserved.",
      eulaTitle: "License terms (EULA)",
      termsTitle: "Business terms",
      privacyTitle: "Privacy and GDPR",
      eulaSections: legalTemplate.eulaSections,
      termsSections: legalTemplate.termsSections,
      privacySections: legalTemplate.privacySections,
    },
  };
}

const baseEn = createMessages("English");

function withMeta(localeName: string, overrides: Partial<Messages> = {}): Messages {
  return {
    ...baseEn,
    ...overrides,
    meta: { nativeName: localeName },
    common: { ...baseEn.common, ...(overrides.common ?? {}) },
    settings: { ...baseEn.settings, ...(overrides.settings ?? {}) },
    toolbar: { ...baseEn.toolbar, ...(overrides.toolbar ?? {}) },
    about: { ...baseEn.about, ...(overrides.about ?? {}) },
    hostingDialog: { ...baseEn.hostingDialog, ...(overrides.hostingDialog ?? {}) },
    driveSelector: { ...baseEn.driveSelector, ...(overrides.driveSelector ?? {}) },
    search: { ...baseEn.search, ...(overrides.search ?? {}) },
    transferDialog: { ...baseEn.transferDialog, ...(overrides.transferDialog ?? {}) },
    compare: { ...baseEn.compare, ...(overrides.compare ?? {}) },
    shareware: { ...baseEn.shareware, ...(overrides.shareware ?? {}) },
    purchase: { ...baseEn.purchase, ...(overrides.purchase ?? {}) },
    editor: { ...baseEn.editor, ...(overrides.editor ?? {}) },
    quickView: { ...baseEn.quickView, ...(overrides.quickView ?? {}) },
    transferStatus: { ...baseEn.transferStatus, ...(overrides.transferStatus ?? {}) },
    transferQueue: { ...baseEn.transferQueue, ...(overrides.transferQueue ?? {}) },
    functionKeys: { ...baseEn.functionKeys, ...(overrides.functionKeys ?? {}) },
    contextMenu: { ...baseEn.contextMenu, ...(overrides.contextMenu ?? {}) },
    hostingTabs: { ...baseEn.hostingTabs, ...(overrides.hostingTabs ?? {}) },
    archive: { ...baseEn.archive, ...(overrides.archive ?? {}) },
    properties: { ...baseEn.properties, ...(overrides.properties ?? {}) },
    dialogs: { ...baseEn.dialogs, ...(overrides.dialogs ?? {}) },
    toasts: { ...baseEn.toasts, ...(overrides.toasts ?? {}) },
    notFound: { ...baseEn.notFound, ...(overrides.notFound ?? {}) },
    legal: { ...baseEn.legal, ...(overrides.legal ?? {}) },
  };
}

export const messages: Record<Locale, Messages> = {
  en: baseEn,
  cs: withMeta("Čeština", {
    common: {
      close: "Zavřít",
      cancel: "Zrušit",
      save: "Uložit",
      saveChanges: "Uložit změny",
      delete: "Smazat",
      rename: "Přejmenovat",
      create: "Vytvořit",
      continue: "Pokračovat",
      install: "Nainstalovat",
      loading: "Načítám...",
      local: "Místní",
      server: "Server",
      all: "Vše",
      selectedCount: "{count} vybráno",
      filesCountLabel: "Soubory: {done}/{total}",
      dir: "〈DIR〉",
      light: "Světlý",
      dark: "Tmavý",
    },
    settings: {
      title: "Nastavení",
      license: "Licence",
      fullVersionActivated: "Plná verze aktivována",
      activate: "Aktivovat",
      appearance: "Vzhled",
      language: "Jazyk",
    },
    toolbar: {
      newConnection: "Nové připojení",
      refresh: "Přenačíst",
      disconnect: "Odpojit",
      upload: "Nahrát",
      download: "Stáhnout",
      folder: "Složka",
      rename: "Přejmenovat",
      delete: "Smazat",
      search: "Hledat",
      compare: "Porovnat",
      openArchive: "Otevřít archiv",
      createArchive: "Vytvořit archiv",
      settings: "Nastavení",
      about: "O aplikaci",
    },
    about: {
      version: "Verze {version}",
      description: "Desktop FTP/SFTP klient pro macOS se zaměřením na rychlou správu souborů a přenosů.",
      eula: "Licenční podmínky",
      terms: "Obchodní podmínky",
      privacy: "Ochrana soukromí",
      updates: "Aktualizace",
      checking: "Kontroluji...",
      check: "Zkontrolovat",
      latest: "Nejnovější verze",
      updateAvailable: "K dispozici v{version}",
      installing: "Instaluji... {percent} %",
      updateError: "Chyba aktualizace",
      notChecked: "Nezkontrolováno",
      updatesNotConfigured: "Aktualizace nejsou nakonfigurovány",
    },
    hostingDialog: {
      editTitle: "Upravit hosting",
      newTitle: "Nový hosting",
      name: "Název",
      namePlaceholder: "Můj server",
      host: "Host",
      port: "Port",
      protocol: "Protokol",
      user: "Uživatel",
      password: "Heslo",
      ftps: "FTPS (TLS/SSL)",
      sshKey: "SSH klíč (volitelné)",
      chooseKey: "Vybrat",
      chooseKeyTitle: "Vybrat SSH klíč",
      testConnection: "Test připojení",
      testing: "Testuji...",
      connectionOk: "Připojení je v pořádku",
      connectionOkDescription: "Přihlášení i listing kořene proběhly úspěšně.",
      connectionFailed: "Test připojení selhal",
    },
    driveSelector: {
      volumes: "Disky",
      cloud: "Cloud",
      servers: "Servery",
      quickAccess: "Rychlý přístup",
      home: "Domovská složka",
      desktop: "Plocha",
      downloads: "Stažené soubory",
      free: "volno",
    },
    search: {
      title: "Hledat soubory",
      searchIn: "Hledat v:",
      fileName: "Název souboru (glob)",
      containingText: "Obsahující text",
      subfolders: "Podsložky",
      caseSensitive: "Rozlišovat velikost písmen",
      search: "Hledat",
      searching: "Hledám...",
      found: "Nalezeno:",
      results: "výsledků",
      noResults: "Žádné výsledky",
    },
    transferDialog: {
      uploadTitle: "Nahrát soubory",
      downloadTitle: "Stáhnout soubory",
      archiveExtractTitle: "Vykopírovat z archivu",
      copyTitle: "Kopírovat soubory",
      transferMode: "Režim přenosu",
      auto: "Automaticky",
      binary: "Binární",
      overwriteExisting: "Při existujícím souboru",
      ask: "Zeptat se",
      overwrite: "Přepsat",
      overwriteOlder: "Přepsat starší",
      skip: "Přeskočit",
      rename: "Přejmenovat",
      options: "Možnosti",
      resume: "Pokračovat v přerušeném přenosu",
      preserveTimestamps: "Zachovat časová razítka",
      preservePermissions: "Zachovat oprávnění",
      followSymlinks: "Sledovat symbolické odkazy",
      createDirs: "Vytvářet adresáře",
      verify: "Ověřit po přenosu",
      extract: "Vykopírovat",
      copy: "Kopírovat",
      fileOne: "soubor",
      fileFew: "soubory",
      fileMany: "souborů",
      moreFiles: "dalších souborů",
      advancedOptions: "Pokročilé možnosti",
    },
    compare: {
      title: "Porovnání:",
      newer: "novějších",
      older: "starších",
      differs: "liší se",
      localOnly: "jen místní",
      remoteOnly: "jen server",
      same: "shodných",
      syncToRemote: "Sync ->",
      syncToLocal: "<- Sync",
    },
    shareware: {
      version: "Verze 1.0.0",
      body: "Tato aplikace je shareware. Všechny funkce jsou plně dostupné. Po aktivaci licence se toto okno přestane zobrazovat.",
      activateLicense: "Aktivovat licenci",
      buyLicense: "Koupit licenci",
    },
    purchase: {
      doneTitle: "Platba otevřena v prohlížeči",
      doneBody: "Dokončete platbu v prohlížeči. Po úspěšné platbě obdržíte licenční klíč na {email}.",
      doneHint: "Kód zadejte v Nastavení -> Aktivační kód.",
      title: "Koupit plnou verzi",
      securePayment: "Zabezpečená platba",
      lifetimeLicense: "Licence LoFTP (doživotní)",
      email: "E-mail (pro zaslání licence)",
      redirectNotice: "Budete přesměrováni na zabezpečenou platební stránku Stripe.",
      openPayment: "Pokračovat k platbě",
    },
    editor: {
      unsupported: "Tento soubor nelze editovat (binární soubor).",
      unsavedConfirm: "Soubor nebyl uložen. Opravdu zavřít?",
      saving: "Ukládám...",
      save: "Uložit",
      loadingFile: "Načítám soubor...",
      lines: "{count} řádků",
      unsaved: "Neuloženo",
      saveShortcut: "Ctrl+S pro uložení",
    },
    quickView: {
      loading: "Načítám...",
      imageTooLarge: "Obrázek je příliš velký pro náhled ({size})",
      pdfTooLarge: "PDF je příliš velké pro náhled ({size})",
      lines: "{count} řádků",
    },
    transferStatus: {
      transferring: "Přenáší se",
      done: "Dokončeno",
      error: "Chyba přenosu",
      paused: "Pozastaveno",
      queued: "Ve frontě",
      files: "Soubory",
      active: "Aktivní",
      pending: "Čeká",
      completed: "Dokončeno {count} souborů",
      errors: "{count} chyb",
      cancelAll: "Zrušit všechny přenosy",
    },
    transferQueue: {
      title: "Fronta přenosů",
      active: "Aktivní",
      pending: "Čeká",
      done: "Hotovo",
      errors: "Chyby",
      retry: "Zkusit znovu",
      moveUp: "Přesunout nahoru",
      cancel: "Zrušit",
    },
    functionKeys: {
      view: "Zobrazit",
      edit: "Editovat",
      copy: "Kopírovat",
      move: "Přesunout",
      folder: "Složka",
      delete: "Smazat",
      search: "Hledat",
    },
    contextMenu: {
      copyPath: "Kopírovat cestu",
      copyName: "Kopírovat název",
      openInFinder: "Otevřít ve Finderu",
      openInVsCode: "Otevřít ve VS Code",
      openArchive: "Otevřít archiv",
      createArchive: "Vytvořit archiv",
      chmod: "Změnit oprávnění",
      properties: "Vlastnosti",
      rename: "Přejmenovat",
      delete: "Smazat",
    },
    hostingTabs: {
      empty: 'Žádné uložené hostingy. Klikněte na "Nový+" pro přidání.',
      editAria: "Upravit {name}",
      deleteAria: "Smazat {name}",
      deleteTitle: "Opravdu smazat uložený přístup?",
      deleteMessage: 'Účet "{name}" bude odstraněn z uložených připojení včetně hesla.',
      deleteFallback: "Tato akce odstraní uložený přístup.",
    },
    archive: {
      filesAndDirs: "{files} souborů, {dirs} složek",
      total: "Celkem: {size}",
      extracting: "Rozbaluji...",
      extractSelected: "Rozbalit vybrané",
      extractAll: "Rozbalit vše",
    },
    properties: {
      title: "Vlastnosti",
      name: "Název",
      path: "Cesta",
      type: "Typ",
      folder: "Složka",
      file: "Soubor",
      size: "Velikost",
      modified: "Změněno",
      permissions: "Oprávnění",
    },
    dialogs: {
      newFolderTitle: "Nová složka",
      newFolderLabel: "Název složky:",
      renameTitle: "Přejmenovat",
      renameLabel: "Nový název:",
      createArchiveTitle: "Vytvořit archiv",
      createArchiveLabel: "Název archivu ZIP:",
      deleteTitle: "Smazat",
      deleteMessage: "Opravdu smazat {count} položek?",
    },
    toasts: {
      archiveCreated: "Archiv vytvořen",
      archiveCreateFailed: "Vytvoření archivu selhalo",
      folderOpenFailed: "Nepodařilo se otevřít složku",
      onedrivePickFailed: "Nepodařilo se vybrat složku OneDrive",
      onedriveOpenedStored: "OneDrive byl otevřen přes uloženou cestu.",
      onedriveOpenedPicker: "OneDrive byl otevřen přes systémový výběr složky.",
      connectionFailed: "Připojení selhalo",
    },
    legal: {
      copyrightNotice: "© 2026 Localio Labs s.r.o. Všechna práva vyhrazena.",
      eulaTitle: "Licenční podmínky (EULA)",
      termsTitle: "Obchodní podmínky",
      privacyTitle: "Ochrana soukromí a GDPR",
      eulaSections: [
        {
          heading: "Úvodní ustanovení",
          paragraphs: [
            "Tato licenční smlouva s koncovým uživatelem představuje právně závaznou dohodu mezi vámi a společností Localio Labs s.r.o. týkající se užívání aplikace LoFTP.",
            "Instalací, spuštěním nebo jakýmkoli užíváním aplikace potvrzujete, že jste se s těmito podmínkami seznámili a souhlasíte s nimi v plném rozsahu.",
          ],
        },
        {
          heading: "Udělení licence",
          paragraphs: [
            "LoFTP je distribuována jako shareware. Všechny funkce aplikace jsou dostupné i bez zakoupené licence.",
            "Aktivací licence získáváte časově neomezenou, nevýhradní a nepřenosnou licenci k užívání aplikace na jednom zařízení.",
          ],
        },
        {
          heading: "Omezení",
          paragraphs: [
            "Uživatel nesmí aplikaci kopírovat, upravovat, dekompilovat, redistribuovat, pronajímat, sublicencovat ani obcházet licenční mechanismy.",
            "Sdílení licenčního klíče nebo pokus o narušení licenční infrastruktury může vést ke zneplatnění licence.",
          ],
        },
        {
          heading: "Vyloučení odpovědnosti",
          paragraphs: [
            "Aplikace je poskytována tak, jak je, bez jakýchkoli výslovných či předpokládaných záruk.",
            "Uživatel nese plnou odpovědnost za konfiguraci připojení, přístupové údaje i zálohování vlastních dat.",
          ],
        },
      ],
      termsSections: [
        {
          heading: "Poskytovatel a rozsah",
          paragraphs: [
            "Tyto obchodní podmínky upravují nákup softwarových licencí pro LoFTP od společnosti Localio Labs s.r.o.",
            "Vztahují se na proces objednávky, platbu, elektronické doručení licence a související komunikaci se zákazníkem.",
          ],
        },
        {
          heading: "Objednávka a uzavření smlouvy",
          paragraphs: [
            "Objednávka vzniká vyplněním objednávkového formuláře a potvrzením platby prostřednictvím platební brány.",
            "Kupní smlouva je uzavřena okamžikem úspěšné autorizace platby a přijetím objednávky poskytovatelem.",
          ],
        },
        {
          heading: "Cena a platba",
          paragraphs: [
            "Veškeré ceny jsou zobrazeny před dokončením objednávky. Platba je zpracována prostřednictvím služby Stripe nebo jiného určeného platebního partnera.",
            "Poskytovatel neukládá úplné údaje o platebních kartách a získává pouze informace nezbytné k potvrzení transakce.",
          ],
        },
        {
          heading: "Doručení digitálního obsahu",
          paragraphs: [
            "Licenční klíč je doručen elektronicky na e-mailovou adresu zadanou při nákupu.",
            "Doručení zpravidla probíhá bezprostředně po úspěšné platbě, ve výjimečných technických případech však může dojít k prodlení.",
          ],
        },
        {
          heading: "Reklamace a vrácení",
          paragraphs: [
            "Pokud je dodaný licenční klíč vadný nebo jej nelze z důvodu na straně poskytovatele aktivovat, může zákazník požádat o nápravu nebo náhradní plnění.",
            "Jelikož jde o digitální obsah dodávaný bez hmotného nosiče, může být právo na odstoupení po zahájení plnění omezeno v rozsahu připouštěném platnými právními předpisy.",
          ],
        },
        {
          heading: "Podpora a kontakt",
          paragraphs: [
            "Dotazy k objednávkám, fakturám, doručení licence nebo reklamacím lze zaslat prostřednictvím kontaktního formuláře na www.mylocalio.com.",
            "Poskytovatel vyřizuje zákaznické požadavky bez zbytečného odkladu a oprávněné reklamace se snaží řešit v přiměřené lhůtě.",
          ],
        },
      ],
      privacySections: [
        {
          heading: "Správce údajů",
          paragraphs: [
            "Správcem vašich osobních údajů je společnost Localio Labs s.r.o. v souvislosti s licencemi, nákupem a podporou.",
          ],
        },
        {
          heading: "Rozsah údajů",
          paragraphs: [
            "Při nákupu a aktivaci můžeme zpracovávat e-mailovou adresu, licenční klíč, typ licence, identifikátor instalace a technická metadata.",
            "FTP/SFTP přihlašovací údaje zůstávají uložené lokálně na vašem zařízení a aplikace je nepředává třetím stranám.",
          ],
        },
        {
          heading: "Účel zpracování",
          paragraphs: [
            "Údaje jsou zpracovávány za účelem vydání licence, poskytování aktualizací, zákaznické podpory a ochrany před neoprávněným užíváním.",
          ],
        },
        {
          heading: "Doba uchování a práva",
          paragraphs: [
            "Údaje související s licencí uchováváme po dobu vyžadovanou smluvními a právními povinnostmi.",
            "V souladu s právními předpisy můžete požadovat přístup, opravu, výmaz, omezení zpracování nebo vznést námitku.",
          ],
        },
      ],
    },
  }),
  de: withMeta("Deutsch", {
    common: { close: "Schließen", cancel: "Abbrechen", save: "Speichern", saveChanges: "Änderungen speichern", delete: "Löschen", rename: "Umbenennen", create: "Erstellen", continue: "Fortfahren", install: "Installieren", loading: "Wird geladen...", local: "Lokal", server: "Server", all: "Alle", selectedCount: "{count} ausgewählt", filesCountLabel: "Dateien: {done}/{total}", dir: "〈VERZ〉", light: "Hell", dark: "Dunkel" },
    settings: { title: "Einstellungen", license: "Lizenz", fullVersionActivated: "Vollversion aktiviert", activate: "Aktivieren", appearance: "Darstellung", language: "Sprache" },
    toolbar: { newConnection: "Neue Verbindung", refresh: "Neu laden", disconnect: "Trennen", upload: "Hochladen", download: "Herunterladen", folder: "Ordner", rename: "Umbenennen", delete: "Löschen", search: "Suchen", compare: "Vergleichen", openArchive: "Archiv öffnen", createArchive: "Archiv erstellen", settings: "Einstellungen", about: "Über die App" },
    about: { version: "Version {version}", description: "Desktop-FTP/SFTP-Client für macOS mit Fokus auf schnelle Datei- und Transferverwaltung.", eula: "Lizenzbedingungen", terms: "Geschäftsbedingungen", privacy: "Datenschutz", updates: "Updates", checking: "Prüfe...", check: "Prüfen", latest: "Neueste Version", updateAvailable: "Verfügbar: v{version}", installing: "Installiere... {percent} %", updateError: "Update-Fehler", notChecked: "Nicht geprüft", updatesNotConfigured: "Updates sind nicht konfiguriert" },
    hostingDialog: { editTitle: "Hosting bearbeiten", newTitle: "Neues Hosting", name: "Name", namePlaceholder: "Mein Server", host: "Host", port: "Port", protocol: "Protokoll", user: "Benutzer", password: "Passwort", ftps: "FTPS (TLS/SSL)", sshKey: "SSH-Schlüssel (optional)", chooseKey: "Auswählen", chooseKeyTitle: "SSH-Schlüssel auswählen", testConnection: "Verbindung testen", testing: "Teste...", connectionOk: "Verbindung ist in Ordnung", connectionOkDescription: "Anmeldung und Root-Listing waren erfolgreich.", connectionFailed: "Verbindungstest fehlgeschlagen" },
    driveSelector: { volumes: "Laufwerke", cloud: "Cloud", servers: "Server", quickAccess: "Schnellzugriff", home: "Home-Ordner", desktop: "Schreibtisch", downloads: "Downloads", free: "frei" },
    search: { title: "Dateien suchen", searchIn: "Suchen in:", fileName: "Dateiname (Glob)", containingText: "Text enthält", subfolders: "Unterordner", caseSensitive: "Groß-/Kleinschreibung beachten", search: "Suchen", searching: "Suche...", found: "Gefunden:", results: "Ergebnisse", noResults: "Keine Ergebnisse" },
    transferDialog: { uploadTitle: "Dateien hochladen", downloadTitle: "Dateien herunterladen", archiveExtractTitle: "Aus Archiv kopieren", copyTitle: "Dateien kopieren", transferMode: "Transfermodus", auto: "Automatisch", binary: "Binär", overwriteExisting: "Wenn Datei existiert", ask: "Fragen", overwrite: "Überschreiben", overwriteOlder: "Ältere überschreiben", skip: "Überspringen", rename: "Umbenennen", options: "Optionen", resume: "Unterbrochenen Transfer fortsetzen", preserveTimestamps: "Zeitstempel beibehalten", preservePermissions: "Berechtigungen beibehalten", followSymlinks: "Symbolischen Links folgen", createDirs: "Verzeichnisse erstellen", verify: "Nach Transfer prüfen", extract: "Extrahieren", copy: "Kopieren", fileOne: "Datei", fileFew: "Dateien", fileMany: "Dateien", moreFiles: "weitere Dateien", advancedOptions: "Erweiterte Optionen" },
    compare: { title: "Vergleich:", newer: "neuer", older: "älter", differs: "abweichend", localOnly: "nur lokal", remoteOnly: "nur Server", same: "identisch", syncToRemote: "Sync ->", syncToLocal: "<- Sync" },
    shareware: { version: "Version 1.0.0", body: "Diese Anwendung ist Shareware. Alle Funktionen sind vollständig verfügbar. Nach der Aktivierung der Lizenz wird dieses Fenster nicht mehr angezeigt.", activateLicense: "Lizenz aktivieren", buyLicense: "Lizenz kaufen" },
    purchase: { doneTitle: "Zahlung im Browser geöffnet", doneBody: "Schließen Sie die Zahlung in Ihrem Browser ab. Nach erfolgreicher Zahlung wird der Lizenzschlüssel an {email} gesendet.", doneHint: "Geben Sie den Code unter Einstellungen -> Aktivierungscode ein.", title: "Vollversion kaufen", securePayment: "Sichere Zahlung", lifetimeLicense: "LoFTP-Lizenz (lebenslang)", email: "E-Mail (für Lizenzzustellung)", redirectNotice: "Sie werden zur sicheren Stripe-Zahlungsseite weitergeleitet.", openPayment: "Zur Zahlung fortfahren" },
    editor: { unsupported: "Diese Datei kann nicht bearbeitet werden (Binärdatei).", unsavedConfirm: "Datei wurde nicht gespeichert. Trotzdem schließen?", saving: "Speichere...", save: "Speichern", loadingFile: "Datei wird geladen...", lines: "{count} Zeilen", unsaved: "Nicht gespeichert", saveShortcut: "Ctrl+S zum Speichern" },
    quickView: { loading: "Wird geladen...", imageTooLarge: "Bild ist für die Vorschau zu groß ({size})", pdfTooLarge: "PDF ist für die Vorschau zu groß ({size})", lines: "{count} Zeilen" },
    transferStatus: { transferring: "Übertragung läuft", done: "Fertig", error: "Übertragungsfehler", paused: "Pausiert", queued: "In Warteschlange", files: "Dateien", active: "Aktiv", pending: "Ausstehend", completed: "{count} Dateien abgeschlossen", errors: "{count} Fehler", cancelAll: "Alle Transfers abbrechen" },
    transferQueue: { title: "Transferwarteschlange", active: "Aktiv", pending: "Wartend", done: "Fertig", errors: "Fehler", retry: "Erneut versuchen", moveUp: "Nach oben", cancel: "Abbrechen" },
    functionKeys: { view: "Anzeigen", edit: "Bearbeiten", copy: "Kopieren", move: "Verschieben", folder: "Ordner", delete: "Löschen", search: "Suchen" },
    contextMenu: { copyPath: "Pfad kopieren", copyName: "Name kopieren", openInFinder: "Im Finder öffnen", openInVsCode: "In VS Code öffnen", openArchive: "Archiv öffnen", createArchive: "Archiv erstellen", chmod: "Berechtigungen ändern", properties: "Eigenschaften", rename: "Umbenennen", delete: "Löschen" },
    hostingTabs: { empty: 'Keine gespeicherten Hostings. Klicken Sie auf "Neu+", um eines hinzuzufügen.', editAria: "{name} bearbeiten", deleteAria: "{name} löschen", deleteTitle: "Gespeicherten Zugang wirklich löschen?", deleteMessage: 'Das Konto "{name}" wird mitsamt Passwort aus den gespeicherten Verbindungen entfernt.', deleteFallback: "Diese Aktion entfernt den gespeicherten Zugang." },
    archive: { filesAndDirs: "{files} Dateien, {dirs} Ordner", total: "Gesamt: {size}", extracting: "Entpacke...", extractSelected: "Auswahl entpacken", extractAll: "Alles entpacken" },
    properties: { title: "Eigenschaften", name: "Name", path: "Pfad", type: "Typ", folder: "Ordner", file: "Datei", size: "Größe", modified: "Geändert", permissions: "Berechtigungen" },
    dialogs: { newFolderTitle: "Neuer Ordner", newFolderLabel: "Ordnername:", renameTitle: "Umbenennen", renameLabel: "Neuer Name:", createArchiveTitle: "Archiv erstellen", createArchiveLabel: "Name des ZIP-Archivs:", deleteTitle: "Löschen", deleteMessage: "{count} Elemente wirklich löschen?" },
    toasts: { archiveCreated: "Archiv erstellt", archiveCreateFailed: "Archiv konnte nicht erstellt werden", folderOpenFailed: "Ordner konnte nicht geöffnet werden", onedrivePickFailed: "OneDrive-Ordner konnte nicht ausgewählt werden", onedriveOpenedStored: "OneDrive wurde über den gespeicherten Pfad geöffnet.", onedriveOpenedPicker: "OneDrive wurde über den Systemdialog geöffnet.", connectionFailed: "Verbindung fehlgeschlagen" },
    notFound: { message: "Ups! Seite nicht gefunden", backHome: "Zur Startseite" },
    legal: {
      copyrightNotice: "© 2026 Localio Labs s.r.o. Alle Rechte vorbehalten.",
      eulaTitle: "Lizenzbedingungen (EULA)",
      termsTitle: "Geschäftsbedingungen",
      privacyTitle: "Datenschutz und DSGVO",
      eulaSections: [
        { heading: "Einleitung", paragraphs: ["Diese Endbenutzer-Lizenzvereinbarung (EULA) ist eine rechtlich bindende Vereinbarung zwischen Ihnen und Localio Labs s.r.o. über die Nutzung der Anwendung LoFTP.", "Durch Installation, Start oder sonstige Nutzung der Anwendung bestätigen Sie, dass Sie diese Bedingungen gelesen haben und ihnen vollständig zustimmen."] },
        { heading: "Lizenzgewährung", paragraphs: ["LoFTP wird als Shareware vertrieben. Alle Funktionen der Anwendung bleiben auch ohne gekaufte Lizenz verfügbar. Die einzige Einschränkung der nicht aktivierten Version ist die Anzeige eines Informationsfensters bei jedem Start.", "Nach Kauf und Aktivierung eines Lizenzschlüssels erhalten Sie eine zeitlich unbegrenzte, nicht exklusive und nicht übertragbare Lizenz zur Nutzung der Anwendung auf einem Gerät."] },
        { heading: "Beschränkungen", paragraphs: ["Sie dürfen die Anwendung oder Teile davon nicht kopieren, verändern, dekompilieren, zurückentwickeln, weitervertreiben, vermieten, unterlizenzieren oder Lizenzmechanismen umgehen.", "Das Teilen von Lizenzschlüsseln mit Dritten oder Versuche, die Lizenzinfrastruktur zu kompromittieren, sind untersagt und können zur sofortigen Ungültigkeit der Lizenz führen."] },
        { heading: "Updates und Dienste", paragraphs: ["Localio Labs behält sich das Recht vor, die Anwendung fortlaufend zu aktualisieren, zu erweitern oder zu ändern. Updates können automatisch verteilt werden.", "Einige Dienste, einschließlich Lizenzprüfung, Kauf und Update-Download, erfordern eine aktive Internetverbindung."] },
        { heading: "Haftungsausschluss", paragraphs: ['Die Anwendung wird "wie besehen" bereitgestellt, ohne ausdrückliche oder stillschweigende Gewährleistungen.', "Sie tragen die volle Verantwortung für Zugangsdaten, Transferkonfiguration und regelmäßige Backups Ihrer Daten."] },
        { heading: "Beendigung", paragraphs: ["Diese Lizenz bleibt bis zu ihrer Beendigung gültig. Ein Verstoß gegen diese Vereinbarung führt automatisch zum Erlöschen Ihrer Rechte.", "Sie können die Lizenz jederzeit durch Deinstallation der Anwendung beenden."] },
        { heading: "Anwendbares Recht", paragraphs: ["Diese Vereinbarung unterliegt dem Recht der Tschechischen Republik. Streitigkeiten werden von den zuständigen Gerichten der Tschechischen Republik entschieden."] },
      ],
      termsSections: [
        { heading: "Anbieter und Umfang", paragraphs: ["Diese Geschäftsbedingungen regeln den Kauf von Softwarelizenzen für LoFTP von Localio Labs s.r.o.", "Sie gelten für den Bestellvorgang, die Zahlung, die elektronische Zustellung der Lizenz und die damit verbundene Kundenkommunikation."] },
        { heading: "Bestellung und Vertragsschluss", paragraphs: ["Eine Bestellung entsteht durch Ausfüllen des Checkout-Formulars und Bestätigung der Zahlung über das Zahlungsportal.", "Der Kaufvertrag kommt mit erfolgreicher Autorisierung der Zahlung und Annahme der Bestellung durch den Anbieter zustande."] },
        { heading: "Preis und Zahlung", paragraphs: ["Alle Preise werden vor Abschluss der Bestellung angezeigt. Die Zahlung wird über Stripe oder einen anderen benannten Zahlungsdienstleister verarbeitet.", "Der Anbieter speichert keine vollständigen Kartendaten."] },
        { heading: "Lieferung digitaler Inhalte", paragraphs: ["Der Lizenzschlüssel wird elektronisch an die beim Kauf angegebene E-Mail-Adresse geliefert.", "Die Zustellung erfolgt in der Regel sofort nach erfolgreicher Zahlung, kann sich in begründeten technischen Fällen jedoch verzögern."] },
        { heading: "Reklamationen und Rückerstattungen", paragraphs: ["Ist der gelieferte Lizenzschlüssel fehlerhaft oder kann er aufgrund eines Problems auf Seiten des Anbieters nicht aktiviert werden, kann der Kunde Abhilfe verlangen.", "Da es sich um digitale Inhalte ohne physischen Datenträger handelt, kann das Widerrufsrecht nach Beginn der Lieferung eingeschränkt sein, soweit dies gesetzlich zulässig ist."] },
        { heading: "Support und Kontakt", paragraphs: ["Fragen zu Bestellungen, Rechnungen, Lizenzzustellung oder Reklamationen können über das Kontaktformular auf www.mylocalio.com gesendet werden.", "Der Anbieter bearbeitet Kundenanfragen ohne unnötige Verzögerung."] },
      ],
      privacySections: [
        { heading: "Verantwortlicher", paragraphs: ["Verantwortlicher für Ihre personenbezogenen Daten ist Localio Labs s.r.o. mit Sitz in der Tschechischen Republik. Fragen zur Verarbeitung können über www.mylocalio.com gestellt werden."] },
        { heading: "Umfang der verarbeiteten Daten", paragraphs: ["Beim Kauf und bei der Aktivierung verarbeiten wir Ihre E-Mail-Adresse, den Lizenzschlüssel, die Lizenzart, die Installationskennung und technische Metadaten.", "Die Anwendung speichert Verbindungseinstellungen lokal auf Ihrem Gerät, einschließlich Zugangsdaten."] },
        { heading: "Zweck und Rechtsgrundlage", paragraphs: ["Ihre Daten werden zur Abwicklung des Lizenzvertrags, zur Zustellung des Lizenzschlüssels, für Support, Updates und zum Schutz vor unbefugter Nutzung verarbeitet.", "Rechtsgrundlagen sind Vertragserfüllung, gesetzliche Pflichten und in begründeten Fällen berechtigte Interessen."] },
        { heading: "Empfänger und Auftragsverarbeiter", paragraphs: ["Zahlungen werden über Stripe, Inc. oder einen anderen Zahlungsdienstleister verarbeitet, der als unabhängiger Verantwortlicher auftritt.", "Zugangsdaten zu FTP/SFTP-Servern verbleiben ausschließlich auf Ihrem Gerät."] },
        { heading: "Speicherdauer", paragraphs: ["Lizenzbezogene Daten werden für die Dauer des Vertragsverhältnisses und anschließend entsprechend gesetzlicher Aufbewahrungspflichten gespeichert.", "Lokal gespeicherte Daten verbleiben auf Ihrem Gerät, bis Sie sie manuell entfernen oder die Anwendung deinstallieren."] },
        { heading: "Ihre Rechte", paragraphs: ["Nach geltendem Datenschutzrecht, einschließlich DSGVO, haben Sie Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit und Widerspruch.", "Zur Ausübung Ihrer Rechte kontaktieren Sie uns über www.mylocalio.com."] },
      ],
    },
  }),
  sk: withMeta("Slovenčina", {
    common: { close: "Zavrieť", cancel: "Zrušiť", save: "Uložiť", saveChanges: "Uložiť zmeny", delete: "Zmazať", rename: "Premenovať", create: "Vytvoriť", continue: "Pokračovať", install: "Nainštalovať", loading: "Načítavam...", local: "Miestne", server: "Server", all: "Všetko", selectedCount: "{count} vybrané", filesCountLabel: "Súbory: {done}/{total}", dir: "〈ADR〉", light: "Svetlá", dark: "Tmavá" },
    settings: { title: "Nastavenia", license: "Licencia", fullVersionActivated: "Plná verzia aktivovaná", activate: "Aktivovať", appearance: "Vzhľad", language: "Jazyk" },
    toolbar: { newConnection: "Nové pripojenie", refresh: "Obnoviť", disconnect: "Odpojiť", upload: "Nahrať", download: "Stiahnuť", folder: "Priečinok", rename: "Premenovať", delete: "Zmazať", search: "Hľadať", compare: "Porovnať", openArchive: "Otvoriť archív", createArchive: "Vytvoriť archív", settings: "Nastavenia", about: "O aplikácii" },
    about: { version: "Verzia {version}", description: "Desktop FTP/SFTP klient pre macOS so zameraním na rýchlu správu súborov a prenosov.", eula: "Licenčné podmienky", terms: "Obchodné podmienky", privacy: "Ochrana súkromia", updates: "Aktualizácie", checking: "Kontrolujem...", check: "Skontrolovať", latest: "Najnovšia verzia", updateAvailable: "K dispozícii v{version}", installing: "Inštalujem... {percent} %", updateError: "Chyba aktualizácie", notChecked: "Neskontrolované", updatesNotConfigured: "Aktualizácie nie sú nakonfigurované" },
    driveSelector: { volumes: "Disky", cloud: "Cloud", servers: "Servery", quickAccess: "Rýchly prístup", home: "Domovský priečinok", desktop: "Plocha", downloads: "Stiahnuté súbory", free: "voľné" },
    search: { title: "Hľadať súbory", searchIn: "Hľadať v:", fileName: "Názov súboru (glob)", containingText: "Obsahuje text", subfolders: "Podpriečinky", caseSensitive: "Rozlišovať veľkosť písmen", search: "Hľadať", searching: "Hľadám...", found: "Nájdené:", results: "výsledkov", noResults: "Žiadne výsledky" },
    shareware: { version: "Verzia 1.0.0", body: "Táto aplikácia je shareware. Všetky funkcie sú plne dostupné. Po aktivácii licencie sa toto okno prestane zobrazovať.", activateLicense: "Aktivovať licenciu", buyLicense: "Kúpiť licenciu" },
    purchase: { doneTitle: "Platba otvorená v prehliadači", doneBody: "Dokončite platbu v prehliadači. Po úspešnej platbe dostanete licenčný kľúč na {email}.", doneHint: "Kód zadajte v Nastavenia -> Aktivačný kód.", title: "Kúpiť plnú verziu", securePayment: "Bezpečná platba", lifetimeLicense: "Licencia LoFTP (doživotná)", email: "E-mail (na doručenie licencie)", redirectNotice: "Budete presmerovaní na zabezpečenú platobnú stránku Stripe.", openPayment: "Pokračovať k platbe" },
    editor: { unsupported: "Tento súbor nemožno upravovať (binárny súbor).", unsavedConfirm: "Súbor nebol uložený. Naozaj zavrieť?", saving: "Ukladám...", save: "Uložiť", loadingFile: "Načítavam súbor...", lines: "{count} riadkov", unsaved: "Neuložené", saveShortcut: "Ctrl+S na uloženie" },
    transferDialog: { uploadTitle: "Nahrať súbory", downloadTitle: "Stiahnuť súbory", archiveExtractTitle: "Kopírovať z archívu", copyTitle: "Kopírovať súbory", transferMode: "Režim prenosu", auto: "Automaticky", binary: "Binárny", overwriteExisting: "Keď súbor existuje", ask: "Opýtať sa", overwrite: "Prepísať", overwriteOlder: "Prepísať staršie", skip: "Preskočiť", rename: "Premenovať", options: "Možnosti", resume: "Pokračovať v prerušenom prenose", preserveTimestamps: "Zachovať časové pečiatky", preservePermissions: "Zachovať oprávnenia", followSymlinks: "Sledovať symbolické odkazy", createDirs: "Vytvárať adresáre", verify: "Overiť po prenose", extract: "Rozbaliť", copy: "Kopírovať", fileOne: "súbor", fileFew: "súbory", fileMany: "súborov", moreFiles: "ďalších súborov", advancedOptions: "Pokročilé možnosti" },
    transferStatus: { transferring: "Prenáša sa", done: "Dokončené", error: "Chyba prenosu", paused: "Pozastavené", queued: "Vo fronte", files: "Súbory", active: "Aktívne", pending: "Čaká", completed: "Dokončených {count} súborov", errors: "{count} chýb", cancelAll: "Zrušiť všetky prenosy" },
    transferQueue: { title: "Front prenosov", active: "Aktívne", pending: "Čaká", done: "Hotovo", errors: "Chyby", retry: "Skúsiť znova", moveUp: "Presunúť vyššie", cancel: "Zrušiť" },
    functionKeys: { view: "Zobraziť", edit: "Upraviť", copy: "Kopírovať", move: "Presunúť", folder: "Priečinok", delete: "Zmazať", search: "Hľadať" },
    contextMenu: { copyPath: "Kopírovať cestu", copyName: "Kopírovať názov", openInFinder: "Otvoriť vo Finderi", openInVsCode: "Otvoriť vo VS Code", openArchive: "Otvoriť archív", createArchive: "Vytvoriť archív", chmod: "Zmeniť oprávnenia", properties: "Vlastnosti", rename: "Premenovať", delete: "Zmazať" },
    hostingTabs: { empty: 'Žiadne uložené hostingy. Kliknite na "Nový+" pre pridanie.', editAria: "Upraviť {name}", deleteAria: "Zmazať {name}", deleteTitle: "Naozaj zmazať uložený prístup?", deleteMessage: 'Účet "{name}" bude odstránený z uložených pripojení vrátane hesla.', deleteFallback: "Táto akcia odstráni uložený prístup." },
    archive: { filesAndDirs: "{files} súborov, {dirs} priečinkov", total: "Spolu: {size}", extracting: "Rozbaľujem...", extractSelected: "Rozbaliť vybrané", extractAll: "Rozbaliť všetko" },
    properties: { title: "Vlastnosti", name: "Názov", path: "Cesta", type: "Typ", folder: "Priečinok", file: "Súbor", size: "Veľkosť", modified: "Zmenené", permissions: "Oprávnenia" },
    dialogs: { newFolderTitle: "Nový priečinok", newFolderLabel: "Názov priečinka:", renameTitle: "Premenovať", renameLabel: "Nový názov:", createArchiveTitle: "Vytvoriť archív", createArchiveLabel: "Názov ZIP archívu:", deleteTitle: "Zmazať", deleteMessage: "Naozaj zmazať {count} položiek?" },
    toasts: { archiveCreated: "Archív vytvorený", archiveCreateFailed: "Vytvorenie archívu zlyhalo", folderOpenFailed: "Nepodarilo sa otvoriť priečinok", onedrivePickFailed: "Nepodarilo sa vybrať priečinok OneDrive", onedriveOpenedStored: "OneDrive bol otvorený cez uloženú cestu.", onedriveOpenedPicker: "OneDrive bol otvorený cez systémový výber priečinka.", connectionFailed: "Pripojenie zlyhalo" },
    notFound: { message: "Ups! Stránka sa nenašla", backHome: "Späť domov" },
    legal: skLegal,
  }),
  pl: withMeta("Polski", {
    common: { close: "Zamknij", cancel: "Anuluj", save: "Zapisz", saveChanges: "Zapisz zmiany", delete: "Usuń", rename: "Zmień nazwę", create: "Utwórz", continue: "Kontynuuj", install: "Zainstaluj", loading: "Ładowanie...", local: "Lokalne", server: "Serwer", all: "Wszystko", selectedCount: "Wybrano: {count}", filesCountLabel: "Pliki: {done}/{total}", dir: "〈KAT〉", light: "Jasny", dark: "Ciemny" },
    settings: { title: "Ustawienia", license: "Licencja", fullVersionActivated: "Pełna wersja aktywowana", activate: "Aktywuj", appearance: "Wygląd", language: "Język" },
    toolbar: { newConnection: "Nowe połączenie", refresh: "Odśwież", disconnect: "Rozłącz", upload: "Prześlij", download: "Pobierz", folder: "Folder", rename: "Zmień nazwę", delete: "Usuń", search: "Szukaj", compare: "Porównaj", openArchive: "Otwórz archiwum", createArchive: "Utwórz archiwum", settings: "Ustawienia", about: "O aplikacji" },
    about: { version: "Wersja {version}", description: "Desktopowy klient FTP/SFTP dla macOS skoncentrowany na szybkiej obsłudze plików i transferów.", eula: "Warunki licencji", terms: "Warunki handlowe", privacy: "Prywatność", updates: "Aktualizacje", checking: "Sprawdzanie...", check: "Sprawdź", latest: "Najnowsza wersja", updateAvailable: "Dostępna: v{version}", installing: "Instalowanie... {percent} %", updateError: "Błąd aktualizacji", notChecked: "Nie sprawdzono", updatesNotConfigured: "Aktualizacje nie są skonfigurowane" },
    driveSelector: { volumes: "Dyski", cloud: "Chmura", servers: "Serwery", quickAccess: "Szybki dostęp", home: "Folder domowy", desktop: "Pulpit", downloads: "Pobrane", free: "wolne" },
    search: { title: "Szukaj plików", searchIn: "Szukaj w:", fileName: "Nazwa pliku (glob)", containingText: "Zawiera tekst", subfolders: "Podfoldery", caseSensitive: "Uwzględniaj wielkość liter", search: "Szukaj", searching: "Szukanie...", found: "Znaleziono:", results: "wyników", noResults: "Brak wyników" },
    shareware: { version: "Wersja 1.0.0", body: "Ta aplikacja jest shareware. Wszystkie funkcje są w pełni dostępne. Po aktywacji licencji to okno przestanie się pojawiać.", activateLicense: "Aktywuj licencję", buyLicense: "Kup licencję" },
    purchase: { doneTitle: "Płatność otwarta w przeglądarce", doneBody: "Dokończ płatność w przeglądarce. Po udanej płatności klucz licencyjny zostanie wysłany na {email}.", doneHint: "Wpisz kod w Ustawienia -> Kod aktywacyjny.", title: "Kup pełną wersję", securePayment: "Bezpieczna płatność", lifetimeLicense: "Licencja LoFTP (dożywotnia)", email: "E-mail (do wysyłki licencji)", redirectNotice: "Zostaniesz przekierowany na bezpieczną stronę płatności Stripe.", openPayment: "Przejdź do płatności" },
    editor: { unsupported: "Tego pliku nie można edytować (plik binarny).", unsavedConfirm: "Plik nie został zapisany. Na pewno zamknąć?", saving: "Zapisywanie...", save: "Zapisz", loadingFile: "Ładowanie pliku...", lines: "{count} wierszy", unsaved: "Niezapisane", saveShortcut: "Ctrl+S, aby zapisać" },
    transferDialog: { uploadTitle: "Prześlij pliki", downloadTitle: "Pobierz pliki", archiveExtractTitle: "Kopiuj z archiwum", copyTitle: "Kopiuj pliki", transferMode: "Tryb transferu", auto: "Automatycznie", binary: "Binarny", overwriteExisting: "Gdy plik istnieje", ask: "Zapytaj", overwrite: "Nadpisz", overwriteOlder: "Nadpisz starsze", skip: "Pomiń", rename: "Zmień nazwę", options: "Opcje", resume: "Wznów przerwany transfer", preserveTimestamps: "Zachowaj znaczniki czasu", preservePermissions: "Zachowaj uprawnienia", followSymlinks: "Podążaj za dowiązaniami", createDirs: "Twórz katalogi", verify: "Weryfikuj po transferze", extract: "Rozpakuj", copy: "Kopiuj", fileOne: "plik", fileFew: "pliki", fileMany: "plików", moreFiles: "więcej plików", advancedOptions: "Zaawansowane opcje" },
    transferStatus: { transferring: "Trwa przesyłanie", done: "Zakończono", error: "Błąd transferu", paused: "Wstrzymano", queued: "W kolejce", files: "Pliki", active: "Aktywne", pending: "Oczekuje", completed: "Ukończono {count} plików", errors: "{count} błędów", cancelAll: "Anuluj wszystkie transfery" },
    transferQueue: { title: "Kolejka transferów", active: "Aktywne", pending: "Oczekuje", done: "Gotowe", errors: "Błędy", retry: "Ponów", moveUp: "Przesuń wyżej", cancel: "Anuluj" },
    functionKeys: { view: "Podgląd", edit: "Edytuj", copy: "Kopiuj", move: "Przenieś", folder: "Folder", delete: "Usuń", search: "Szukaj" },
    contextMenu: { copyPath: "Kopiuj ścieżkę", copyName: "Kopiuj nazwę", openInFinder: "Otwórz w Finderze", openInVsCode: "Otwórz w VS Code", openArchive: "Otwórz archiwum", createArchive: "Utwórz archiwum", chmod: "Zmień uprawnienia", properties: "Właściwości", rename: "Zmień nazwę", delete: "Usuń" },
    hostingTabs: { empty: 'Brak zapisanych hostingów. Kliknij "Nowy+", aby dodać.', editAria: "Edytuj {name}", deleteAria: "Usuń {name}", deleteTitle: "Usunąć zapisany dostęp?", deleteMessage: 'Konto "{name}" zostanie usunięte z zapisanych połączeń wraz z hasłem.', deleteFallback: "Ta akcja usunie zapisany dostęp." },
    archive: { filesAndDirs: "{files} plików, {dirs} folderów", total: "Razem: {size}", extracting: "Rozpakowywanie...", extractSelected: "Rozpakuj wybrane", extractAll: "Rozpakuj wszystko" },
    properties: { title: "Właściwości", name: "Nazwa", path: "Ścieżka", type: "Typ", folder: "Folder", file: "Plik", size: "Rozmiar", modified: "Zmodyfikowano", permissions: "Uprawnienia" },
    dialogs: { newFolderTitle: "Nowy folder", newFolderLabel: "Nazwa folderu:", renameTitle: "Zmień nazwę", renameLabel: "Nowa nazwa:", createArchiveTitle: "Utwórz archiwum", createArchiveLabel: "Nazwa archiwum ZIP:", deleteTitle: "Usuń", deleteMessage: "Usunąć {count} elementów?" },
    toasts: { archiveCreated: "Archiwum utworzone", archiveCreateFailed: "Nie udało się utworzyć archiwum", folderOpenFailed: "Nie udało się otworzyć folderu", onedrivePickFailed: "Nie udało się wybrać folderu OneDrive", onedriveOpenedStored: "OneDrive otwarto z zapisanej ścieżki.", onedriveOpenedPicker: "OneDrive otwarto przez systemowy wybór folderu.", connectionFailed: "Połączenie nie powiodło się" },
    notFound: { message: "Ups! Nie znaleziono strony", backHome: "Powrót do strony głównej" },
    legal: plLegal,
  }),
  es: withMeta("Español", {
    common: { close: "Cerrar", cancel: "Cancelar", save: "Guardar", saveChanges: "Guardar cambios", delete: "Eliminar", rename: "Renombrar", create: "Crear", continue: "Continuar", install: "Instalar", loading: "Cargando...", local: "Local", server: "Servidor", all: "Todo", selectedCount: "{count} seleccionado(s)", filesCountLabel: "Archivos: {done}/{total}", dir: "〈DIR〉", light: "Claro", dark: "Oscuro" },
    settings: { title: "Ajustes", license: "Licencia", fullVersionActivated: "Versión completa activada", activate: "Activar", appearance: "Apariencia", language: "Idioma" },
    toolbar: { newConnection: "Nueva conexión", refresh: "Recargar", disconnect: "Desconectar", upload: "Subir", download: "Descargar", folder: "Carpeta", rename: "Renombrar", delete: "Eliminar", search: "Buscar", compare: "Comparar", openArchive: "Abrir archivo", createArchive: "Crear archivo", settings: "Ajustes", about: "Acerca de" },
    about: { version: "Versión {version}", description: "Cliente FTP/SFTP de escritorio para macOS centrado en la gestión rápida de archivos y transferencias.", eula: "Términos de licencia", terms: "Términos comerciales", privacy: "Privacidad", updates: "Actualizaciones", checking: "Comprobando...", check: "Comprobar", latest: "Última versión", updateAvailable: "Disponible: v{version}", installing: "Instalando... {percent} %", updateError: "Error de actualización", notChecked: "No comprobado", updatesNotConfigured: "Las actualizaciones no están configuradas" },
    driveSelector: { volumes: "Discos", cloud: "Nube", servers: "Servidores", quickAccess: "Acceso rápido", home: "Carpeta personal", desktop: "Escritorio", downloads: "Descargas", free: "libre" },
    search: { title: "Buscar archivos", searchIn: "Buscar en:", fileName: "Nombre de archivo (glob)", containingText: "Que contiene texto", subfolders: "Subcarpetas", caseSensitive: "Distinguir mayúsculas", search: "Buscar", searching: "Buscando...", found: "Encontrado:", results: "resultados", noResults: "Sin resultados" },
    shareware: { version: "Versión 1.0.0", body: "Esta aplicación es shareware. Todas las funciones están totalmente disponibles. Tras activar la licencia, esta ventana dejará de mostrarse.", activateLicense: "Activar licencia", buyLicense: "Comprar licencia" },
    purchase: { doneTitle: "Pago abierto en el navegador", doneBody: "Complete el pago en su navegador. Tras un pago correcto, la clave de licencia se enviará a {email}.", doneHint: "Introduzca el código en Ajustes -> Código de activación.", title: "Comprar versión completa", securePayment: "Pago seguro", lifetimeLicense: "Licencia LoFTP (de por vida)", email: "Correo electrónico (para enviar la licencia)", redirectNotice: "Será redirigido a la página segura de pago de Stripe.", openPayment: "Continuar al pago" },
    editor: { unsupported: "Este archivo no se puede editar (archivo binario).", unsavedConfirm: "El archivo no se ha guardado. ¿Cerrar de todos modos?", saving: "Guardando...", save: "Guardar", loadingFile: "Cargando archivo...", lines: "{count} líneas", unsaved: "Sin guardar", saveShortcut: "Ctrl+S para guardar" },
    transferDialog: { uploadTitle: "Subir archivos", downloadTitle: "Descargar archivos", archiveExtractTitle: "Copiar del archivo", copyTitle: "Copiar archivos", transferMode: "Modo de transferencia", auto: "Automático", binary: "Binario", overwriteExisting: "Cuando el archivo existe", ask: "Preguntar", overwrite: "Sobrescribir", overwriteOlder: "Sobrescribir más antiguos", skip: "Omitir", rename: "Renombrar", options: "Opciones", resume: "Reanudar transferencia interrumpida", preserveTimestamps: "Preservar marcas de tiempo", preservePermissions: "Preservar permisos", followSymlinks: "Seguir enlaces simbólicos", createDirs: "Crear directorios", verify: "Verificar tras transferencia", extract: "Extraer", copy: "Copiar", fileOne: "archivo", fileFew: "archivos", fileMany: "archivos", moreFiles: "más archivos", advancedOptions: "Opciones avanzadas" },
    transferStatus: { transferring: "Transfiriendo", done: "Completado", error: "Error de transferencia", paused: "Pausado", queued: "En cola", files: "Archivos", active: "Activo", pending: "Pendiente", completed: "{count} archivos completados", errors: "{count} errores", cancelAll: "Cancelar todas las transferencias" },
    transferQueue: { title: "Cola de transferencias", active: "Activo", pending: "Pendiente", done: "Hecho", errors: "Errores", retry: "Reintentar", moveUp: "Mover arriba", cancel: "Cancelar" },
    functionKeys: { view: "Ver", edit: "Editar", copy: "Copiar", move: "Mover", folder: "Carpeta", delete: "Eliminar", search: "Buscar" },
    contextMenu: { copyPath: "Copiar ruta", copyName: "Copiar nombre", openInFinder: "Abrir en Finder", openInVsCode: "Abrir en VS Code", openArchive: "Abrir archivo", createArchive: "Crear archivo", chmod: "Cambiar permisos", properties: "Propiedades", rename: "Renombrar", delete: "Eliminar" },
    hostingTabs: { empty: 'No hay hostings guardados. Haz clic en "Nuevo+" para añadir uno.', editAria: "Editar {name}", deleteAria: "Eliminar {name}", deleteTitle: "¿Eliminar acceso guardado?", deleteMessage: 'La cuenta "{name}" se eliminará de las conexiones guardadas, incluida la contraseña.', deleteFallback: "Esta acción elimina el acceso guardado." },
    archive: { filesAndDirs: "{files} archivos, {dirs} carpetas", total: "Total: {size}", extracting: "Extrayendo...", extractSelected: "Extraer seleccionados", extractAll: "Extraer todo" },
    properties: { title: "Propiedades", name: "Nombre", path: "Ruta", type: "Tipo", folder: "Carpeta", file: "Archivo", size: "Tamaño", modified: "Modificado", permissions: "Permisos" },
    dialogs: { newFolderTitle: "Nueva carpeta", newFolderLabel: "Nombre de la carpeta:", renameTitle: "Renombrar", renameLabel: "Nuevo nombre:", createArchiveTitle: "Crear archivo", createArchiveLabel: "Nombre del archivo ZIP:", deleteTitle: "Eliminar", deleteMessage: "¿Eliminar {count} elementos?" },
    toasts: { archiveCreated: "Archivo creado", archiveCreateFailed: "No se pudo crear el archivo", folderOpenFailed: "No se pudo abrir la carpeta", onedrivePickFailed: "No se pudo seleccionar la carpeta de OneDrive", onedriveOpenedStored: "OneDrive se abrió mediante la ruta guardada.", onedriveOpenedPicker: "OneDrive se abrió mediante el selector del sistema.", connectionFailed: "La conexión falló" },
    notFound: { message: "Ups. Página no encontrada", backHome: "Volver al inicio" },
    legal: esLegal,
  }),
};

export const languages = [
  { value: "cs", label: "🇨🇿", code: "CS" },
  { value: "en", label: "🇬🇧", code: "EN" },
  { value: "de", label: "🇩🇪", code: "DE" },
  { value: "sk", label: "🇸🇰", code: "SK" },
  { value: "pl", label: "🇵🇱", code: "PL" },
  { value: "es", label: "🇪🇸", code: "ES" },
] as const satisfies ReadonlyArray<{ value: Locale; label: string; code: string }>;
