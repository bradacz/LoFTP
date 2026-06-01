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
  filePanel: {
    name: string;
    type: string;
    size: string;
    modified: string;
    folder: string;
    file: string;
    filesAndDirs: string;
    resizeColumn: string;
  };
  settings: {
    title: string;
    license: string;
    fullVersionActivated: string;
    activate: string;
    deactivateLicense: string;
    licenseExpired: string;
    licenseRevoked: string;
    licenseLimitExceeded: string;
    licenseInvalid: string;
    licenseExpiredDesc: string;
    licenseRevokedDesc: string;
    licenseLimitExceededDesc: string;
    appearance: string;
    language: string;
    tabGeneral: string;
    tabAi: string;
    contextMenu: string;
    contextMenuDesc: string;
    contextMenuOpen: string;
    contextMenuClipboard: string;
    contextMenuSelection: string;
    contextMenuFileOps: string;
    contextMenuArchive: string;
    contextMenuProps: string;
    contextMenuAdvanced: string;
    contextMenuDestructive: string;
    contextMenuResetAll: string;
    ai: string;
    aiEnable: string;
    aiEnableDesc: string;
    aiOn: string;
    aiOff: string;
    aiResetSection: string;
    aiResetDesc: string;
    aiReset: string;
    aiProviders: string;
    aiApiKey: string;
    aiApiKeyConfigured: string;
    aiApiKeyMissing: string;
    aiApiKeyPlaceholder: string;
    aiRemoveSecret: string;
    aiConfigured: string;
    aiMissing: string;
    integrations: string;
    appearanceLightPanelsHint: string;
    contextMenuShowShortcuts: string;
    aiModel: string;
    aiBaseUrl: string;
    aiModelPlaceholder: string;
    aiBaseUrlPlaceholder: string;
    aiTest: string;
    codexBridgeEnable: string;
    codexBridgePort: string;
    codexBridgeHint: string;
    codexBridgeStatus: string;
    codexBridgeRunning: string;
    codexBridgeStopped: string;
    codexSessionToken: string;
    codexSessionTokenReveal: string;
    codexSessionTokenHide: string;
    codexConnector: string;
    codexConnectorDesc: string;
    codexConnectorInstall: string;
    codexConnectorInstalled: string;
    codexConnectorReady: string;
    codexConnectorMissing: string;
    codexConnectorBridge: string;
    codexConnectorPath: string;
    codexConnectorNode: string;
    codexConnectorServer: string;
    codexConnectorConfig: string;
    codexConnectorMcpConfig: string;
    codexConnectorMcpCommand: string;
    codexConnectorMcpSmoke: string;
    codexConnectorNotTested: string;
    codexConnectorMarketplace: string;
    codexConnectorSecurityNote: string;
    codexConnectorTest: string;
    codexConnectorTestOk: string;
    codexConnectorTestFailed: string;
    codexConnectorStatusReady: string;
    codexConnectorStatusNeedsRepair: string;
    codexConnectorStatusNeedsConfig: string;
    codexConnectorStatusNeedsBridge: string;
    codexConnectorStatusMissingNode: string;
    codexConnectorStatusMcpFailed: string;
    codexAvailableProfiles: string;
    codexNoProfiles: string;
    licenseTransfer: string;
    activationFailed: string;
    integrationAiApi: string;
    integrationCodexBridge: string;
  };
  toolbar: {
    menu: string;
    menuConnection: string;
    menuTransfers: string;
    menuFile: string;
    menuSelection: string;
    menuArchives: string;
    menuTools: string;
    menuApplication: string;
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
    endpoint: string;
    storageZoneName: string;
    accessKey: string;
    pullZoneUrl: string;
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
    aiSearch: string;
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
    aiReview: string;
    aiSyncToRemote: string;
    aiSyncToLocal: string;
    syncToRemote: string;
    syncToLocal: string;
  };
  shareware: {
    version: string;
    body: string;
    expiredBody: string;
    revokedBody: string;
    limitExceededBody: string;
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
  ai: {
    outputTitle: string;
    jsonTitle: string;
    guardrails: string;
    notConfigured: string;
  };
  codex: {
    title: string;
    bridge: string;
    bridgeNotRunning: string;
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
    copyBaseName: string;
    copyFiles: string;
    pasteFiles: string;
    openInFinder: string;
    openInVsCode: string;
    openNatively: string;
    openWith: string;
    openAsArchive: string;
    openArchive: string;
    createArchive: string;
    extractHere: string;
    extractTo: string;
    copyTo: string;
    moveTo: string;
    chmod: string;
    changeDate: string;
    calculateChecksum: string;
    batchRename: string;
    newFile: string;
    newFolder: string;
    splitFile: string;
    combineFiles: string;
    selectAll: string;
    deselectAll: string;
    invertSelection: string;
      selectByExtension: string;
      selectByPattern: string;
      compareFolders: string;
      aiExplainFile: string;
      codexExplainFile: string;
      properties: string;
      rename: string;
      delete: string;
    refresh: string;
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
    chmodTitle: string;
    chmodLabel: string;
    chmodOwner: string;
    chmodGroup: string;
    chmodOther: string;
    chmodRead: string;
    chmodWrite: string;
    chmodExecute: string;
    chmodOctal: string;
    changeDateTitle: string;
    changeDateLabel: string;
    checksumTitle: string;
    checksumAlgorithm: string;
    checksumResult: string;
    checksumCopy: string;
    targetFolder: string;
    batchRenamePrefix: string;
    splitChunkSizeMb: string;
    combineOutputFile: string;
    localFilesOnly: string;
    localPanelOnly: string;
    remoteNotConnected: string;
  };
  toasts: {
    archiveCreated: string;
    archiveCreateFailed: string;
    folderOpenFailed: string;
    onedrivePickFailed: string;
    onedriveOpenedStored: string;
    onedriveOpenedPicker: string;
    connectionFailed: string;
    contextMenuNoItems: string;
    contextMenuOpenFailed: string;
    aiLocalTextOnly: string;
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
        "These terms govern the use of the LoFTP application and related support services provided by Localio Labs s.r.o.",
        "By installing, launching or otherwise using the application, you confirm that you have read these terms.",
      ],
    },
    {
      heading: "Project and Application Use",
      paragraphs: [
        "LoFTP is a publicly shared project and its source code is available on GitHub.",
        "The application remains fully usable without activation. Payment in the application is a voluntary contribution to ongoing development and optional activation services.",
      ],
    },
    {
      heading: "Restrictions and Prohibited Conduct",
      paragraphs: [
        "You may not abuse the payment, activation or update infrastructure of the application, including attempts to disrupt it or generate activation codes automatically.",
        "If you use activation keys or related services, you may not use them in a way that harms the project or third parties.",
      ],
    },
    {
      heading: "Updates and Services",
      paragraphs: [
        "Localio Labs reserves the right to update, extend or modify the application over time. Updates may be distributed automatically and may be required to preserve full functionality.",
        "Some services, including voluntary payments, activation services and update downloads, require an active internet connection. The provider does not guarantee uninterrupted availability of these services.",
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
        "You may stop using the application at any time by uninstalling it from your device.",
        "If activation or payment-related services are abused, the provider may restrict or terminate access to those services.",
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
        "These commercial terms govern voluntary payments and related support services for LoFTP provided by Localio Labs s.r.o.",
        "They apply to the payment process, electronic delivery of activation details and related customer communication.",
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
        "The activation key is delivered electronically to the email address entered during payment.",
        "Delivery usually takes place immediately after successful payment, but may be delayed in justified technical cases.",
      ],
    },
    {
      heading: "Refunds and Complaints",
      paragraphs: [
        "If the delivered activation key is defective or cannot be activated due to a provider-side issue, the customer may request a remedy or replacement.",
        "Because the product is digital content delivered without a physical medium, withdrawal rights may be limited once delivery begins, where permitted by applicable law.",
      ],
    },
    {
      heading: "Support and Contact",
      paragraphs: [
        "Questions about payments, invoices, activation delivery or complaints may be sent through the contact form on www.mylocalio.com.",
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
        "For voluntary payments and optional activation, we process your email address, activation key, payment or activation record type, unique installation identifier and basic technical metadata such as application version and operating system.",
        "The application stores server connection settings locally, including login credentials. Passwords are protected through the system key store where available. This data does not leave your device.",
      ],
    },
    {
      heading: "Purpose and Legal Basis",
      paragraphs: [
        "Your data is processed for handling voluntary payments, issuing and delivering activation keys, customer support, update distribution and protection of related services against abuse.",
        "The legal basis includes performance of a contract, compliance with legal obligations and, where justified, the controller's legitimate interest.",
      ],
    },
    {
      heading: "Recipients and Processors",
      paragraphs: [
        "Payments are processed through Stripe, Inc. or another payment processor acting as an independent controller of payment data. The provider does not access payment card details.",
        "Activation delivery and supporting services may be handled by contractual processors bound by confidentiality and appropriate security measures.",
        "FTP/SFTP credentials remain exclusively on your device and are not shared with third parties.",
      ],
    },
    {
      heading: "Retention Period",
      paragraphs: [
        "Data related to payment or activation is retained for the duration of the contractual relationship and subsequently for the period required by accounting, tax and archival regulations.",
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
  copyrightNotice: "© 2026 Localio Labs s.r.o. LoFTP ist ein öffentlich geteiltes Projekt.",
  eulaTitle: "Open-Source-Lizenz",
  termsTitle: "Support- und Zahlungsbedingungen",
  privacyTitle: "Datenschutz und DSGVO",
  eulaSections: [
    { heading: "Einleitung", paragraphs: ["Diese Vereinbarung regelt Ihre Nutzung von LoFTP und wird durch Installation oder Nutzung der Anwendung akzeptiert."] },
    { heading: "Projekt", paragraphs: ["LoFTP ist ein öffentlich geteiltes Projekt. Die Anwendung bleibt ohne Aktivierung nutzbar; Zahlungen sind freiwillige Beiträge zur Weiterentwicklung."] },
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
  copyrightNotice: "© 2026 Localio Labs s.r.o. LoFTP je verejne zdieľaný projekt.",
  eulaTitle: "Open-source licencia",
  termsTitle: "Podmienky podpory a platieb",
  privacyTitle: "Ochrana súkromia a GDPR",
  eulaSections: [
    { heading: "Úvod", paragraphs: ["Táto dohoda upravuje používanie aplikácie LoFTP a prijímate ju inštaláciou alebo používaním aplikácie."] },
    { heading: "Projekt", paragraphs: ["LoFTP je verejne zdieľaný projekt. Aplikácia zostáva použiteľná aj bez aktivácie; platby sú dobrovoľné príspevky na ďalší vývoj."] },
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
  copyrightNotice: "© 2026 Localio Labs s.r.o. LoFTP jest publicznie udostępnianym projektem.",
  eulaTitle: "Licencja open source",
  termsTitle: "Warunki wsparcia i płatności",
  privacyTitle: "Prywatność i RODO",
  eulaSections: [
    { heading: "Wprowadzenie", paragraphs: ["Niniejsza umowa reguluje korzystanie z LoFTP i zostaje zaakceptowana przez instalację lub używanie aplikacji."] },
    { heading: "Projekt", paragraphs: ["LoFTP jest publicznie udostępnianym projektem. Aplikacja pozostaje używalna bez aktywacji; płatności są dobrowolnym wsparciem dalszego rozwoju."] },
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
  copyrightNotice: "© 2026 Localio Labs s.r.o. LoFTP es un proyecto compartido públicamente.",
  eulaTitle: "Licencia open source",
  termsTitle: "Términos de soporte y pagos",
  privacyTitle: "Privacidad y RGPD",
  eulaSections: [
    { heading: "Introducción", paragraphs: ["Este acuerdo regula el uso de LoFTP y se acepta al instalar o utilizar la aplicación."] },
    { heading: "Proyecto", paragraphs: ["LoFTP es un proyecto compartido públicamente. La aplicación sigue siendo utilizable sin activación; los pagos son contribuciones voluntarias para su desarrollo."] },
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
    filePanel: {
      name: "Name",
      type: "Type",
      size: "Size",
      modified: "Modified",
      folder: "Folder",
      file: "File",
      filesAndDirs: "{files} files, {dirs} folders",
      resizeColumn: "Resize column",
    },
    settings: {
      title: "Settings",
      license: "License",
      fullVersionActivated: "Full version activated",
      activate: "Activate",
      deactivateLicense: "Deactivate license",
      licenseExpired: "License expired",
      licenseRevoked: "License revoked",
      licenseLimitExceeded: "Device limit exceeded",
      licenseInvalid: "Invalid license",
      licenseExpiredDesc: "Your activation has expired. The app still works, but the contribution notice will continue to appear until you activate again.",
      licenseRevokedDesc: "Your license has been revoked. Contact support for assistance.",
      licenseLimitExceededDesc: "The maximum number of devices for this activation has been reached. Deactivate another device or use a different activation.",
      appearance: "Appearance",
      language: "Language",
      tabGeneral: "General",
      tabAi: "AI",
      contextMenu: "Context Menu",
      contextMenuDesc: "Choose which items appear in the right-click menu",
      contextMenuOpen: "Open",
      contextMenuClipboard: "Clipboard",
      contextMenuSelection: "Selection",
      contextMenuFileOps: "File Operations",
      contextMenuArchive: "Archives",
      contextMenuProps: "Properties & Attributes",
      contextMenuAdvanced: "Advanced",
      contextMenuDestructive: "Delete",
      contextMenuResetAll: "Reset all",
      ai: "AI",
      aiEnable: "Enable AI layer",
      aiEnableDesc: "Prepare LoFTP for AI-assisted workflows, model routing, and provider configuration.",
      aiOn: "On",
      aiOff: "Off",
      aiResetSection: "Reset AI settings",
      aiResetDesc: "Restore the default provider presets and policy values for the current device.",
      aiReset: "Reset AI",
      aiProviders: "Providers",
      aiApiKey: "API key",
      aiApiKeyConfigured: "Stored securely in the system keychain.",
      aiApiKeyMissing: "No API key is stored for this provider.",
      aiApiKeyPlaceholder: "Paste API key",
      aiRemoveSecret: "Remove",
      aiConfigured: "Configured",
      aiMissing: "Missing",
      integrations: "Integrations",
      appearanceLightPanelsHint: "In light mode, file panels stay white for readability.",
      contextMenuShowShortcuts: "Show keyboard shortcuts",
      aiModel: "Model",
      aiBaseUrl: "Base URL",
      aiModelPlaceholder: "for example gpt-4.1 / claude / gemini",
      aiBaseUrlPlaceholder: "only if the provider requires it",
      aiTest: "Test",
      codexBridgeEnable: "Enable local Codex bridge",
      codexBridgePort: "Localhost port",
      codexBridgeHint: "Codex uses saved FTP/SFTP profiles through LoFTP. Passwords and API keys are not returned to the conversation.",
      codexBridgeStatus: "Status",
      codexBridgeRunning: "Running on 127.0.0.1",
      codexBridgeStopped: "Stopped",
      codexSessionToken: "Session token",
      codexSessionTokenReveal: "Reveal",
      codexSessionTokenHide: "Hide",
      codexConnector: "Bundled Codex connector",
      codexConnectorDesc: "Install or repair the connector included with LoFTP. It configures Codex without manual token copying.",
      codexConnectorInstall: "Install / repair connector",
      codexConnectorInstalled: "Codex connector is installed.",
      codexConnectorReady: "Installed",
      codexConnectorMissing: "Not installed",
      codexConnectorBridge: "Bridge",
      codexConnectorPath: "Plugin path",
      codexConnectorNode: "Node runtime",
      codexConnectorServer: "MCP server",
      codexConnectorConfig: "Config",
      codexConnectorMcpConfig: "MCP config",
      codexConnectorMcpCommand: "MCP command",
      codexConnectorMcpSmoke: "MCP test",
      codexConnectorNotTested: "Not tested",
      codexConnectorMarketplace: "Marketplace",
      codexConnectorSecurityNote: "Codex receives profile metadata and file listings only. Passwords, API keys and SSH material stay in LoFTP.",
      codexConnectorTest: "Test connector",
      codexConnectorTestOk: "Codex connector is ready.",
      codexConnectorTestFailed: "Codex connector needs attention.",
      codexConnectorStatusReady: "Ready",
      codexConnectorStatusNeedsRepair: "Needs repair",
      codexConnectorStatusNeedsConfig: "Needs config",
      codexConnectorStatusNeedsBridge: "Bridge stopped",
      codexConnectorStatusMissingNode: "Node missing",
      codexConnectorStatusMcpFailed: "MCP test failed",
      codexAvailableProfiles: "Available profiles",
      codexNoProfiles: "No profiles saved.",
      licenseTransfer: "Transfer license to this computer",
      activationFailed: "Activation failed.",
      integrationAiApi: "AI through user API",
      integrationCodexBridge: "Codex through local bridge",
    },
    toolbar: {
      menu: "Menu",
      menuConnection: "Connection",
      menuTransfers: "Transfers",
      menuFile: "File",
      menuSelection: "Selection",
      menuArchives: "Archives",
      menuTools: "Tools",
      menuApplication: "Application",
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
      eula: "Open-source license",
      terms: "Support terms",
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
      endpoint: "Endpoint",
      storageZoneName: "Storage zone name",
      accessKey: "Access key / zone password",
      pullZoneUrl: "Pull zone URL (optional)",
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
      aiSearch: "AI search",
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
      aiReview: "Codex review",
      aiSyncToRemote: "Codex ->",
      aiSyncToLocal: "<- Codex",
      syncToRemote: "Sync ->",
      syncToLocal: "<- Sync",
    },
    shareware: {
      version: "Version 1.0.0",
      body: "LoFTP is a publicly shared project. All features are fully available. Activation is optional and mainly confirms your contribution to development.",
      expiredBody: "Your activation has expired. All features remain available. Activate again if you want to remove this contribution notice.",
      revokedBody: "Your license has been revoked. Contact support for assistance.",
      limitExceededBody: "The device limit for your license has been reached. Deactivate another device or purchase a new license.",
      activateLicense: "Activate code",
      buyLicense: "Support development",
    },
    purchase: {
      doneTitle: "Payment opened in browser",
      doneBody: "Complete the payment in your browser. After a successful payment, the activation key will be sent to {email}.",
      doneHint: "Enter the code in Settings -> Activation code.",
      title: "Support LoFTP development",
      securePayment: "Secure payment",
      lifetimeLicense: "Open-source project contribution",
      email: "Email (for activation delivery)",
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
    ai: {
      outputTitle: "Output",
      jsonTitle: "Structured JSON",
      guardrails: "Guardrails",
      notConfigured: "AI is not configured yet. Open Settings -> AI and add your provider.",
    },
    codex: {
      title: "Codex",
      bridge: "Local Codex bridge",
      bridgeNotRunning: "Codex bridge is not running yet. Open Settings -> Codex to enable it.",
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
      copyBaseName: "Copy name without extension",
      copyFiles: "Copy files",
      pasteFiles: "Paste files",
      openInFinder: "Open in Finder",
      openInVsCode: "Open in VS Code",
      openNatively: "Open in system",
      openWith: "Open with…",
      openAsArchive: "Open as archive…",
      openArchive: "Open archive",
      createArchive: "Create archive…",
      extractHere: "Extract here",
      extractTo: "Extract to…",
      copyTo: "Copy to…",
      moveTo: "Move to…",
      chmod: "Change permissions…",
      changeDate: "Change date…",
      calculateChecksum: "Calculate checksum…",
      batchRename: "Batch rename…",
      newFile: "New file",
      newFolder: "New folder",
      splitFile: "Split file…",
      combineFiles: "Combine files…",
      selectAll: "Select all",
      deselectAll: "Deselect all",
      invertSelection: "Invert selection",
      selectByExtension: "Select by extension",
      selectByPattern: "Select by pattern…",
      compareFolders: "Compare folders",
      aiExplainFile: "AI explain file",
      codexExplainFile: "Codex explain file",
      properties: "Properties",
      rename: "Rename",
      delete: "Delete",
      refresh: "Refresh",
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
      chmodTitle: "Change permissions",
      chmodLabel: "Set permissions for:",
      chmodOwner: "Owner",
      chmodGroup: "Group",
      chmodOther: "Other",
      chmodRead: "Read",
      chmodWrite: "Write",
      chmodExecute: "Execute",
      chmodOctal: "Octal",
      changeDateTitle: "Change date",
      changeDateLabel: "Set modification date for:",
      checksumTitle: "Calculate checksum",
      checksumAlgorithm: "Algorithm",
      checksumResult: "Checksum",
      checksumCopy: "Copy",
      targetFolder: "Target folder",
      batchRenamePrefix: "Prefix",
      splitChunkSizeMb: "Part size in MB",
      combineOutputFile: "Output file",
      localFilesOnly: "This operation is available for local files only.",
      localPanelOnly: "Pasting files is available for a local panel only.",
      remoteNotConnected: "Remote panel is not connected.",
    },
    toasts: {
      archiveCreated: "Archive created",
      archiveCreateFailed: "Failed to create archive",
      folderOpenFailed: "Failed to open folder",
      onedrivePickFailed: "Failed to select OneDrive folder",
      onedriveOpenedStored: "OneDrive was opened via the stored path.",
      onedriveOpenedPicker: "OneDrive was opened via the system folder picker.",
      connectionFailed: "Connection failed",
      contextMenuNoItems: "No context menu item is enabled in settings.",
      contextMenuOpenFailed: "Context menu could not be opened.",
      aiLocalTextOnly: "AI file explanation is available for local text files only.",
    },
    notFound: {
      message: "Oops! Page not found",
      backHome: "Return home",
    },
    legal: {
      copyrightNotice: "© 2026 Localio Labs s.r.o. LoFTP is a publicly shared project.",
      eulaTitle: "Open-source license",
      termsTitle: "Support and payment terms",
      privacyTitle: "Privacy and GDPR",
      eulaSections: legalTemplate.eulaSections,
      termsSections: legalTemplate.termsSections,
      privacySections: legalTemplate.privacySections,
    },
  };
}

const baseEn = createMessages("English");

type MessageOverrides = { [K in keyof Messages]?: Partial<Messages[K]> };

function withMeta(localeName: string, overrides: MessageOverrides = {}): Messages {
  return {
    ...baseEn,
    ...overrides,
    meta: { nativeName: localeName },
    common: { ...baseEn.common, ...(overrides.common ?? {}) },
    filePanel: { ...baseEn.filePanel, ...(overrides.filePanel ?? {}) },
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
    ai: { ...baseEn.ai, ...(overrides.ai ?? {}) },
    codex: { ...baseEn.codex, ...(overrides.codex ?? {}) },
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
    filePanel: {
      name: "Název",
      type: "Typ",
      size: "Velikost",
      modified: "Změněno",
      folder: "Složka",
      file: "Soubor",
      filesAndDirs: "{files} souborů, {dirs} složek",
      resizeColumn: "Změnit šířku sloupce",
    },
    settings: {
      title: "Nastavení",
      license: "Licence",
      fullVersionActivated: "Plná verze aktivována",
      activate: "Aktivovat",
      deactivateLicense: "Deaktivovat licenci",
      licenseExpired: "Licence vypršela",
      licenseRevoked: "Licence zrušena",
      licenseLimitExceeded: "Překročen limit zařízení",
      licenseInvalid: "Neplatná licence",
      licenseExpiredDesc: "Vaše aktivace vypršela. Aplikace dál funguje, ale bez nové aktivace se bude dál zobrazovat informační okno o podpoře projektu.",
      licenseRevokedDesc: "Vaše licence byla zrušena. Kontaktujte podporu.",
      licenseLimitExceededDesc: "Byl překročen maximální počet zařízení pro tuto aktivaci. Deaktivujte jiné zařízení nebo použijte jinou aktivaci.",
      appearance: "Vzhled",
      language: "Jazyk",
      tabGeneral: "Obecné",
      tabAi: "AI",
      contextMenu: "Kontextová nabídka",
      contextMenuDesc: "Zvolte, které položky se zobrazí v nabídce pravého tlačítka",
      contextMenuOpen: "Otevřít",
      contextMenuClipboard: "Schránka",
      contextMenuSelection: "Výběr",
      contextMenuFileOps: "Souborové operace",
      contextMenuArchive: "Archivy",
      contextMenuProps: "Vlastnosti a atributy",
      contextMenuAdvanced: "Pokročilé",
      contextMenuDestructive: "Smazat",
      contextMenuResetAll: "Obnovit vše",
      ai: "AI",
      aiEnable: "Zapnout AI vrstvu",
      aiEnableDesc: "Připraví LoFTP na AI asistované workflow, routing modelů a konfiguraci providerů.",
      aiOn: "Zapnuto",
      aiOff: "Vypnuto",
      aiResetSection: "Obnovit AI nastavení",
      aiResetDesc: "Vrátí výchozí presety providerů a policy hodnoty pro toto zařízení.",
      aiReset: "Reset AI",
      aiProviders: "Provideři",
      aiApiKey: "API klíč",
      aiApiKeyConfigured: "Bezpečně uložený v systémovém keychainu.",
      aiApiKeyMissing: "Pro tohoto providera není uložený žádný API klíč.",
      aiApiKeyPlaceholder: "Vložit API klíč",
      aiRemoveSecret: "Odebrat",
      aiConfigured: "Nastaveno",
      aiMissing: "Chybí",
      integrations: "Integrace",
      appearanceLightPanelsHint: "Ve světlém režimu zůstávají panely se soubory bílé kvůli čitelnosti.",
      contextMenuShowShortcuts: "Zobrazovat klávesové zkratky",
      aiModel: "Model",
      aiBaseUrl: "Base URL",
      aiModelPlaceholder: "např. gpt-4.1 / claude / gemini",
      aiBaseUrlPlaceholder: "jen pokud provider vyžaduje",
      aiTest: "Test",
      codexBridgeEnable: "Zapnout lokální Codex bridge",
      codexBridgePort: "Localhost port",
      codexBridgeHint: "Codex používá uložené FTP/SFTP profily přes LoFTP. Hesla a API klíče se nevrací do konverzace.",
      codexBridgeStatus: "Stav",
      codexBridgeRunning: "Běží na 127.0.0.1",
      codexBridgeStopped: "Zastaveno",
      codexSessionToken: "Session token",
      codexSessionTokenReveal: "Zobrazit",
      codexSessionTokenHide: "Skrýt",
      codexConnector: "Přibalený Codex connector",
      codexConnectorDesc: "Nainstaluje nebo opraví connector dodaný s LoFTP. Codex se nastaví bez ručního kopírování tokenu.",
      codexConnectorInstall: "Nainstalovat / opravit connector",
      codexConnectorInstalled: "Codex connector je nainstalovaný.",
      codexConnectorReady: "Nainstalováno",
      codexConnectorMissing: "Nenainstalováno",
      codexConnectorBridge: "Bridge",
      codexConnectorPath: "Cesta pluginu",
      codexConnectorNode: "Node runtime",
      codexConnectorServer: "MCP server",
      codexConnectorConfig: "Konfigurace",
      codexConnectorMcpConfig: "MCP konfigurace",
      codexConnectorMcpCommand: "MCP příkaz",
      codexConnectorMcpSmoke: "MCP test",
      codexConnectorNotTested: "Netestováno",
      codexConnectorMarketplace: "Marketplace",
      codexConnectorSecurityNote: "Codex dostává jen metadata profilů a výpisy souborů. Hesla, API klíče a SSH materiál zůstávají v LoFTP.",
      codexConnectorTest: "Otestovat connector",
      codexConnectorTestOk: "Codex connector je připravený.",
      codexConnectorTestFailed: "Codex connector vyžaduje pozornost.",
      codexConnectorStatusReady: "Připraveno",
      codexConnectorStatusNeedsRepair: "Vyžaduje opravu",
      codexConnectorStatusNeedsConfig: "Chybí konfigurace",
      codexConnectorStatusNeedsBridge: "Bridge neběží",
      codexConnectorStatusMissingNode: "Chybí Node",
      codexConnectorStatusMcpFailed: "MCP test selhal",
      codexAvailableProfiles: "Dostupné profily",
      codexNoProfiles: "Nejsou uložené žádné profily.",
      licenseTransfer: "Převést licenci na tento počítač",
      activationFailed: "Aktivace se nepodařila.",
      integrationAiApi: "AI přes uživatelské API",
      integrationCodexBridge: "Codex přes lokální bridge",
    },
    toolbar: {
      menu: "Menu",
      menuConnection: "Připojení",
      menuTransfers: "Přenosy",
      menuFile: "Soubor",
      menuSelection: "Výběr",
      menuArchives: "Archivy",
      menuTools: "Nástroje",
      menuApplication: "Aplikace",
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
      eula: "Open-source licence",
      terms: "Podmínky podpory",
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
      endpoint: "Endpoint",
      storageZoneName: "Název Storage Zone",
      accessKey: "Access key / heslo zóny",
      pullZoneUrl: "Pull zone URL (volitelné)",
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
      aiSearch: "AI hledání",
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
      aiReview: "Codex review",
      aiSyncToRemote: "Codex ->",
      aiSyncToLocal: "<- Codex",
      syncToRemote: "Sync ->",
      syncToLocal: "<- Sync",
    },
    shareware: {
      version: "Verze 1.0.0",
      body: "LoFTP je veřejně sdílený projekt. Všechny funkce jsou plně dostupné. Aktivace je volitelná a slouží hlavně jako potvrzení příspěvku na vývoj.",
      expiredBody: "Vaše aktivace vypršela. Všechny funkce zůstávají dostupné. Aktivujte znovu, pokud chcete toto informační okno odstranit.",
      revokedBody: "Vaše licence byla zrušena. Kontaktujte podporu pro pomoc.",
      limitExceededBody: "Byl překročen limit zařízení pro vaši licenci. Deaktivujte jiné zařízení nebo zakupte další licenci.",
      activateLicense: "Aktivovat kód",
      buyLicense: "Podpořit vývoj",
    },
    purchase: {
      doneTitle: "Platba otevřena v prohlížeči",
      doneBody: "Dokončete platbu v prohlížeči. Po úspěšné platbě obdržíte aktivační klíč na {email}.",
      doneHint: "Kód zadejte v Nastavení -> Aktivační kód.",
      title: "Podpořit vývoj LoFTP",
      securePayment: "Zabezpečená platba",
      lifetimeLicense: "Příspěvek na open-source projekt",
      email: "E-mail (pro zaslání aktivace)",
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
    ai: {
      outputTitle: "Výstup",
      jsonTitle: "Strukturovaný JSON",
      guardrails: "Guardraily",
      notConfigured: "AI ještě není nastavená. Otevřete Nastavení -> AI a doplňte providera.",
    },
    codex: {
      title: "Codex",
      bridge: "Lokální Codex bridge",
      bridgeNotRunning: "Codex bridge zatím neběží. Otevřete Nastavení -> Codex a zapněte ho.",
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
      copyBaseName: "Kopírovat název bez přípony",
      copyFiles: "Kopírovat soubory",
      pasteFiles: "Vložit soubory",
      openInFinder: "Otevřít ve Finderu",
      openInVsCode: "Otevřít ve VS Code",
      openNatively: "Otevřít v systému",
      openWith: "Otevřít pomocí…",
      openAsArchive: "Otevřít jako archiv…",
      openArchive: "Otevřít archiv",
      createArchive: "Vytvořit archiv…",
      extractHere: "Rozbalit sem",
      extractTo: "Rozbalit do…",
      copyTo: "Kopírovat do…",
      moveTo: "Přesunout do…",
      chmod: "Změnit oprávnění…",
      changeDate: "Změnit datum…",
      calculateChecksum: "Vypočítat checksum…",
      batchRename: "Hromadné přejmenování…",
      newFile: "Nový soubor",
      newFolder: "Nová složka",
      splitFile: "Rozdělit soubor…",
      combineFiles: "Spojit soubory…",
      selectAll: "Vybrat vše",
      deselectAll: "Zrušit výběr",
      invertSelection: "Invertovat výběr",
      selectByExtension: "Vybrat podle přípony",
      selectByPattern: "Vybrat podle vzoru…",
      compareFolders: "Porovnat složky",
      aiExplainFile: "AI vysvětlit soubor",
      codexExplainFile: "Codex vysvětlit soubor",
      properties: "Vlastnosti",
      rename: "Přejmenovat",
      delete: "Smazat",
      refresh: "Obnovit",
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
      chmodTitle: "Změnit oprávnění",
      chmodLabel: "Nastavit oprávnění pro:",
      chmodOwner: "Vlastník",
      chmodGroup: "Skupina",
      chmodOther: "Ostatní",
      chmodRead: "Čtení",
      chmodWrite: "Zápis",
      chmodExecute: "Spuštění",
      chmodOctal: "Osmičkově",
      changeDateTitle: "Změnit datum",
      changeDateLabel: "Nastavit datum úpravy pro:",
      checksumTitle: "Vypočítat kontrolní součet",
      checksumAlgorithm: "Algoritmus",
      checksumResult: "Kontrolní součet",
      checksumCopy: "Kopírovat",
      targetFolder: "Cílová složka",
      batchRenamePrefix: "Prefix",
      splitChunkSizeMb: "Velikost části v MB",
      combineOutputFile: "Výstupní soubor",
      localFilesOnly: "Tato operace je dostupná jen pro lokální soubory.",
      localPanelOnly: "Vkládání souborů je dostupné jen pro lokální panel.",
      remoteNotConnected: "Vzdálený panel není připojený.",
    },
    toasts: {
      archiveCreated: "Archiv vytvořen",
      archiveCreateFailed: "Vytvoření archivu selhalo",
      folderOpenFailed: "Nepodařilo se otevřít složku",
      onedrivePickFailed: "Nepodařilo se vybrat složku OneDrive",
      onedriveOpenedStored: "OneDrive byl otevřen přes uloženou cestu.",
      onedriveOpenedPicker: "OneDrive byl otevřen přes systémový výběr složky.",
      connectionFailed: "Připojení selhalo",
      contextMenuNoItems: "V nastavení kontextového menu není povolená žádná položka.",
      contextMenuOpenFailed: "Kontextové menu se nepodařilo otevřít.",
      aiLocalTextOnly: "AI vysvětlení souboru je dostupné jen pro lokální textové soubory.",
    },
    legal: {
      copyrightNotice: "© 2026 Localio Labs s.r.o. LoFTP je veřejně sdílený projekt.",
      eulaTitle: "Open-source licence",
      termsTitle: "Podmínky podpory a plateb",
      privacyTitle: "Ochrana soukromí a GDPR",
      eulaSections: [
        {
          heading: "Úvodní ustanovení",
          paragraphs: [
            "Tyto podmínky upravují používání aplikace LoFTP a souvisejících podpůrných služeb poskytovaných společností Localio Labs s.r.o.",
            "Instalací, spuštěním nebo jakýmkoli užíváním aplikace potvrzujete, že jste se s těmito podmínkami seznámili.",
          ],
        },
        {
          heading: "Projekt a používání aplikace",
          paragraphs: [
            "LoFTP je veřejně sdílený projekt a jeho zdrojový kód je dostupný na GitHubu.",
            "Aplikace zůstává plně použitelná i bez aktivace. Platba v aplikaci je dobrovolným příspěvkem na další vývoj projektu a doprovodné aktivační služby.",
          ],
        },
        {
          heading: "Omezení",
          paragraphs: [
            "Zakázáno je zneužívání platební, aktivační nebo aktualizační infrastruktury aplikace.",
            "Sdílení aktivačních údajů nebo pokus o narušení souvisejících služeb může vést k jejich omezení nebo ukončení.",
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
            "Tyto obchodní podmínky upravují dobrovolné platby a související podpůrné služby pro LoFTP od společnosti Localio Labs s.r.o.",
            "Vztahují se na proces platby, elektronické doručení aktivace a související komunikaci se zákazníkem.",
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
            "Aktivační klíč je doručen elektronicky na e-mailovou adresu zadanou při platbě.",
            "Doručení zpravidla probíhá bezprostředně po úspěšné platbě, ve výjimečných technických případech však může dojít k prodlení.",
          ],
        },
        {
          heading: "Reklamace a vrácení",
          paragraphs: [
            "Pokud je dodaný aktivační klíč vadný nebo jej nelze z důvodu na straně poskytovatele aktivovat, může zákazník požádat o nápravu nebo náhradní plnění.",
            "Jelikož jde o digitální obsah dodávaný bez hmotného nosiče, může být právo na odstoupení po zahájení plnění omezeno v rozsahu připouštěném platnými právními předpisy.",
          ],
        },
        {
          heading: "Podpora a kontakt",
          paragraphs: [
            "Dotazy k platbám, fakturám, doručení aktivace nebo reklamacím lze zaslat prostřednictvím kontaktního formuláře na www.mylocalio.com.",
            "Poskytovatel vyřizuje zákaznické požadavky bez zbytečného odkladu a oprávněné reklamace se snaží řešit v přiměřené lhůtě.",
          ],
        },
      ],
      privacySections: [
        {
          heading: "Správce údajů",
          paragraphs: [
            "Správcem vašich osobních údajů je společnost Localio Labs s.r.o. v souvislosti s platbami, aktivací a podporou.",
          ],
        },
        {
          heading: "Rozsah údajů",
          paragraphs: [
            "Při dobrovolné platbě a případné aktivaci můžeme zpracovávat e-mailovou adresu, aktivační klíč, typ záznamu o platbě nebo aktivaci, identifikátor instalace a technická metadata.",
            "FTP/SFTP přihlašovací údaje zůstávají uložené lokálně na vašem zařízení a aplikace je nepředává třetím stranám.",
          ],
        },
        {
          heading: "Účel zpracování",
          paragraphs: [
            "Údaje jsou zpracovávány za účelem zpracování dobrovolné platby, vydání aktivace, poskytování aktualizací, zákaznické podpory a ochrany souvisejících služeb před zneužitím.",
          ],
        },
        {
          heading: "Doba uchování a práva",
          paragraphs: [
            "Údaje související s platbou nebo aktivací uchováváme po dobu vyžadovanou smluvními a právními povinnostmi.",
            "V souladu s právními předpisy můžete požadovat přístup, opravu, výmaz, omezení zpracování nebo vznést námitku.",
          ],
        },
      ],
    },
  }),
  de: withMeta("Deutsch", {
    common: { close: "Schließen", cancel: "Abbrechen", save: "Speichern", saveChanges: "Änderungen speichern", delete: "Löschen", rename: "Umbenennen", create: "Erstellen", continue: "Fortfahren", install: "Installieren", loading: "Wird geladen...", local: "Lokal", server: "Server", all: "Alle", selectedCount: "{count} ausgewählt", filesCountLabel: "Dateien: {done}/{total}", dir: "〈VERZ〉", light: "Hell", dark: "Dunkel" },
    settings: { title: "Einstellungen", license: "Lizenz", fullVersionActivated: "Vollversion aktiviert", activate: "Aktivieren", deactivateLicense: "Lizenz deaktivieren", licenseExpired: "Lizenz abgelaufen", licenseRevoked: "Lizenz widerrufen", licenseLimitExceeded: "Gerätelimit überschritten", licenseInvalid: "Ungültige Lizenz", licenseExpiredDesc: "Ihre Aktivierung ist abgelaufen. Die App funktioniert weiter, aber der Hinweis auf die Projektunterstützung bleibt sichtbar.", licenseRevokedDesc: "Ihre Lizenz wurde widerrufen. Kontaktieren Sie den Support.", licenseLimitExceededDesc: "Die maximale Anzahl an Geräten für diese Aktivierung wurde erreicht. Deaktivieren Sie ein anderes Gerät oder verwenden Sie eine andere Aktivierung.", appearance: "Darstellung", language: "Sprache", tabGeneral: "Allgemein", tabAi: "AI", contextMenu: "Kontextmenü", contextMenuDesc: "Wählen Sie, welche Elemente im Rechtsklick-Menü angezeigt werden", contextMenuOpen: "Öffnen", contextMenuClipboard: "Zwischenablage", contextMenuSelection: "Auswahl", contextMenuFileOps: "Dateioperationen", contextMenuArchive: "Archive", contextMenuProps: "Eigenschaften und Attribute", contextMenuAdvanced: "Erweitert", contextMenuDestructive: "Löschen", contextMenuResetAll: "Alles zurücksetzen", ai: "AI", aiEnable: "AI-Ebene aktivieren", aiEnableDesc: "Bereitet LoFTP auf AI-gestützte Workflows, Modellrouting und Provider-Konfiguration vor.", aiOn: "An", aiOff: "Aus", aiResetSection: "AI-Einstellungen zurücksetzen", aiResetDesc: "Stellt die Standard-Provider-Presets und Richtlinienwerte für dieses Gerät wieder her.", aiReset: "AI zurücksetzen", aiProviders: "Provider", aiApiKey: "API key", aiApiKeyConfigured: "Stored securely in the system keychain.", aiApiKeyMissing: "No API key is stored for this provider.", aiApiKeyPlaceholder: "Paste API key", aiRemoveSecret: "Remove", aiConfigured: "Configured", aiMissing: "Missing" },
    toolbar: { newConnection: "Neue Verbindung", refresh: "Neu laden", disconnect: "Trennen", upload: "Hochladen", download: "Herunterladen", folder: "Ordner", rename: "Umbenennen", delete: "Löschen", search: "Suchen", compare: "Vergleichen", openArchive: "Archiv öffnen", createArchive: "Archiv erstellen", settings: "Einstellungen", about: "Über die App" },
    about: { version: "Version {version}", description: "Desktop-FTP/SFTP-Client für macOS mit Fokus auf schnelle Datei- und Transferverwaltung.", eula: "Lizenzbedingungen", terms: "Geschäftsbedingungen", privacy: "Datenschutz", updates: "Updates", checking: "Prüfe...", check: "Prüfen", latest: "Neueste Version", updateAvailable: "Verfügbar: v{version}", installing: "Installiere... {percent} %", updateError: "Update-Fehler", notChecked: "Nicht geprüft", updatesNotConfigured: "Updates sind nicht konfiguriert" },
    hostingDialog: { editTitle: "Hosting bearbeiten", newTitle: "Neues Hosting", name: "Name", namePlaceholder: "Mein Server", host: "Host", port: "Port", protocol: "Protokoll", user: "Benutzer", password: "Passwort", endpoint: "Endpoint", storageZoneName: "Storage-Zone-Name", accessKey: "Access Key / Zonenpasswort", pullZoneUrl: "Pull-Zone-URL (optional)", ftps: "FTPS (TLS/SSL)", sshKey: "SSH-Schlüssel (optional)", chooseKey: "Auswählen", chooseKeyTitle: "SSH-Schlüssel auswählen", testConnection: "Verbindung testen", testing: "Teste...", connectionOk: "Verbindung ist in Ordnung", connectionOkDescription: "Anmeldung und Root-Listing waren erfolgreich.", connectionFailed: "Verbindungstest fehlgeschlagen" },
    driveSelector: { volumes: "Laufwerke", cloud: "Cloud", servers: "Server", quickAccess: "Schnellzugriff", home: "Home-Ordner", desktop: "Schreibtisch", downloads: "Downloads", free: "frei" },
    search: { title: "Dateien suchen", searchIn: "Suchen in:", fileName: "Dateiname (Glob)", containingText: "Text enthält", subfolders: "Unterordner", caseSensitive: "Groß-/Kleinschreibung beachten", search: "Suchen", searching: "Suche...", found: "Gefunden:", results: "Ergebnisse", noResults: "Keine Ergebnisse", aiSearch: "AI-Suche" },
    transferDialog: { uploadTitle: "Dateien hochladen", downloadTitle: "Dateien herunterladen", archiveExtractTitle: "Aus Archiv kopieren", copyTitle: "Dateien kopieren", transferMode: "Transfermodus", auto: "Automatisch", binary: "Binär", overwriteExisting: "Wenn Datei existiert", ask: "Fragen", overwrite: "Überschreiben", overwriteOlder: "Ältere überschreiben", skip: "Überspringen", rename: "Umbenennen", options: "Optionen", resume: "Unterbrochenen Transfer fortsetzen", preserveTimestamps: "Zeitstempel beibehalten", preservePermissions: "Berechtigungen beibehalten", followSymlinks: "Symbolischen Links folgen", createDirs: "Verzeichnisse erstellen", verify: "Nach Transfer prüfen", extract: "Extrahieren", copy: "Kopieren", fileOne: "Datei", fileFew: "Dateien", fileMany: "Dateien", moreFiles: "weitere Dateien", advancedOptions: "Erweiterte Optionen" },
    compare: { title: "Vergleich:", newer: "neuer", older: "älter", differs: "abweichend", localOnly: "nur lokal", remoteOnly: "nur Server", same: "identisch", aiReview: "Codex-Prüfung", aiSyncToRemote: "Codex ->", aiSyncToLocal: "<- Codex", syncToRemote: "Sync ->", syncToLocal: "<- Sync" },
    shareware: { version: "Version 1.0.0", body: "LoFTP ist ein öffentlich geteiltes Projekt. Alle Funktionen sind vollständig verfügbar. Die Aktivierung ist optional und bestätigt vor allem Ihren Beitrag zur Weiterentwicklung.", expiredBody: "Ihre Aktivierung ist abgelaufen. Alle Funktionen bleiben verfügbar. Aktivieren Sie erneut, wenn Sie diesen Hinweis entfernen möchten.", revokedBody: "Ihre Lizenz wurde widerrufen. Kontaktieren Sie den Support.", limitExceededBody: "Das Gerätelimit für Ihre Aktivierung wurde erreicht. Deaktivieren Sie ein anderes Gerät oder verwenden Sie eine andere Aktivierung.", activateLicense: "Code aktivieren", buyLicense: "Entwicklung unterstützen" },
    purchase: { doneTitle: "Zahlung im Browser geöffnet", doneBody: "Schließen Sie die Zahlung in Ihrem Browser ab. Nach erfolgreicher Zahlung wird der Aktivierungsschlüssel an {email} gesendet.", doneHint: "Geben Sie den Code unter Einstellungen -> Aktivierungscode ein.", title: "LoFTP-Entwicklung unterstützen", securePayment: "Sichere Zahlung", lifetimeLicense: "Beitrag zum Open-Source-Projekt", email: "E-Mail (für Aktivierungszustellung)", redirectNotice: "Sie werden zur sicheren Stripe-Zahlungsseite weitergeleitet.", openPayment: "Zur Zahlung fortfahren" },
    editor: { unsupported: "Diese Datei kann nicht bearbeitet werden (Binärdatei).", unsavedConfirm: "Datei wurde nicht gespeichert. Trotzdem schließen?", saving: "Speichere...", save: "Speichern", loadingFile: "Datei wird geladen...", lines: "{count} Zeilen", unsaved: "Nicht gespeichert", saveShortcut: "Ctrl+S zum Speichern" },
    quickView: { loading: "Wird geladen...", imageTooLarge: "Bild ist für die Vorschau zu groß ({size})", pdfTooLarge: "PDF ist für die Vorschau zu groß ({size})", lines: "{count} Zeilen" },
    ai: { outputTitle: "Ausgabe", jsonTitle: "Strukturiertes JSON", guardrails: "Schutzregeln", notConfigured: "AI ist noch nicht konfiguriert." },
    transferStatus: { transferring: "Übertragung läuft", done: "Fertig", error: "Übertragungsfehler", paused: "Pausiert", queued: "In Warteschlange", files: "Dateien", active: "Aktiv", pending: "Ausstehend", completed: "{count} Dateien abgeschlossen", errors: "{count} Fehler", cancelAll: "Alle Transfers abbrechen" },
    transferQueue: { title: "Transferwarteschlange", active: "Aktiv", pending: "Wartend", done: "Fertig", errors: "Fehler", retry: "Erneut versuchen", moveUp: "Nach oben", cancel: "Abbrechen" },
    functionKeys: { view: "Anzeigen", edit: "Bearbeiten", copy: "Kopieren", move: "Verschieben", folder: "Ordner", delete: "Löschen", search: "Suchen" },
    contextMenu: { copyPath: "Pfad kopieren", copyName: "Name kopieren", copyBaseName: "Name ohne Erweiterung kopieren", copyFiles: "Dateien kopieren", pasteFiles: "Dateien einfügen", openInFinder: "Im Finder öffnen", openInVsCode: "In VS Code öffnen", openNatively: "Im System öffnen", openWith: "Öffnen mit…", openAsArchive: "Als Archiv öffnen…", openArchive: "Archiv öffnen", createArchive: "Archiv erstellen…", extractHere: "Hier entpacken", extractTo: "Entpacken nach…", copyTo: "Kopieren nach…", moveTo: "Verschieben nach…", chmod: "Berechtigungen ändern…", changeDate: "Datum ändern…", calculateChecksum: "Prüfsumme berechnen…", batchRename: "Stapel-Umbenennung…", newFile: "Neue Datei", newFolder: "Neuer Ordner", splitFile: "Datei teilen…", combineFiles: "Dateien zusammenführen…", selectAll: "Alle auswählen", deselectAll: "Auswahl aufheben", invertSelection: "Auswahl umkehren", selectByExtension: "Nach Erweiterung auswählen", selectByPattern: "Nach Muster auswählen…", compareFolders: "Ordner vergleichen", aiExplainFile: "AI-Datei erklären", codexExplainFile: "Mit Codex erklären", properties: "Eigenschaften", rename: "Umbenennen", delete: "Löschen", refresh: "Aktualisieren" },
    hostingTabs: { empty: 'Keine gespeicherten Hostings. Klicken Sie auf "Neu+", um eines hinzuzufügen.', editAria: "{name} bearbeiten", deleteAria: "{name} löschen", deleteTitle: "Gespeicherten Zugang wirklich löschen?", deleteMessage: 'Das Konto "{name}" wird mitsamt Passwort aus den gespeicherten Verbindungen entfernt.', deleteFallback: "Diese Aktion entfernt den gespeicherten Zugang." },
    archive: { filesAndDirs: "{files} Dateien, {dirs} Ordner", total: "Gesamt: {size}", extracting: "Entpacke...", extractSelected: "Auswahl entpacken", extractAll: "Alles entpacken" },
    properties: { title: "Eigenschaften", name: "Name", path: "Pfad", type: "Typ", folder: "Ordner", file: "Datei", size: "Größe", modified: "Geändert", permissions: "Berechtigungen" },
    dialogs: { newFolderTitle: "Neuer Ordner", newFolderLabel: "Ordnername:", renameTitle: "Umbenennen", renameLabel: "Neuer Name:", createArchiveTitle: "Archiv erstellen", createArchiveLabel: "Name des ZIP-Archivs:", deleteTitle: "Löschen", deleteMessage: "{count} Elemente wirklich löschen?", chmodTitle: "Berechtigungen ändern", chmodLabel: "Berechtigungen festlegen für:", chmodOwner: "Eigentümer", chmodGroup: "Gruppe", chmodOther: "Andere", chmodRead: "Lesen", chmodWrite: "Schreiben", chmodExecute: "Ausführen", chmodOctal: "Oktal", changeDateTitle: "Datum ändern", changeDateLabel: "Änderungsdatum festlegen für:", checksumTitle: "Prüfsumme berechnen", checksumAlgorithm: "Algorithmus", checksumResult: "Prüfsumme", checksumCopy: "Kopieren" },
    toasts: { archiveCreated: "Archiv erstellt", archiveCreateFailed: "Archiv konnte nicht erstellt werden", folderOpenFailed: "Ordner konnte nicht geöffnet werden", onedrivePickFailed: "OneDrive-Ordner konnte nicht ausgewählt werden", onedriveOpenedStored: "OneDrive wurde über den gespeicherten Pfad geöffnet.", onedriveOpenedPicker: "OneDrive wurde über den Systemdialog geöffnet.", connectionFailed: "Verbindung fehlgeschlagen" },
    notFound: { message: "Ups! Seite nicht gefunden", backHome: "Zur Startseite" },
    legal: {
      copyrightNotice: "© 2026 Localio Labs s.r.o. LoFTP ist ein öffentlich geteiltes Projekt.",
      eulaTitle: "Open-Source-Lizenz",
      termsTitle: "Support- und Zahlungsbedingungen",
      privacyTitle: "Datenschutz und DSGVO",
      eulaSections: [
        { heading: "Einleitung", paragraphs: ["Diese Bedingungen regeln die Nutzung der Anwendung LoFTP und der zugehörigen Unterstützungsdienste von Localio Labs s.r.o.", "Durch Installation, Start oder sonstige Nutzung der Anwendung bestätigen Sie, dass Sie diese Bedingungen gelesen haben."] },
        { heading: "Projekt und Nutzung der Anwendung", paragraphs: ["LoFTP ist ein öffentlich geteiltes Projekt und der Quellcode ist auf GitHub verfügbar.", "Die Anwendung bleibt auch ohne Aktivierung vollständig nutzbar. Zahlungen in der Anwendung sind freiwillige Beiträge zur Weiterentwicklung und zu optionalen Aktivierungsdiensten."] },
        { heading: "Beschränkungen", paragraphs: ["Untersagt ist der Missbrauch der Zahlungs-, Aktivierungs- oder Update-Infrastruktur der Anwendung.", "Das Teilen von Aktivierungsdaten oder Versuche, die zugehörigen Dienste zu kompromittieren, können zu einer Einschränkung oder Beendigung dieser Dienste führen."] },
        { heading: "Updates und Dienste", paragraphs: ["Localio Labs behält sich das Recht vor, die Anwendung fortlaufend zu aktualisieren, zu erweitern oder zu ändern. Updates können automatisch verteilt werden.", "Einige Dienste, einschließlich freiwilliger Zahlungen, Aktivierungsdiensten und Update-Downloads, erfordern eine aktive Internetverbindung."] },
        { heading: "Haftungsausschluss", paragraphs: ['Die Anwendung wird "wie besehen" bereitgestellt, ohne ausdrückliche oder stillschweigende Gewährleistungen.', "Sie tragen die volle Verantwortung für Zugangsdaten, Transferkonfiguration und regelmäßige Backups Ihrer Daten."] },
        { heading: "Beendigung", paragraphs: ["Sie können die Nutzung der Anwendung jederzeit durch Deinstallation beenden.", "Bei Missbrauch aktivierungs- oder zahlungsbezogener Dienste kann der Anbieter den Zugang zu diesen Diensten einschränken oder beenden."] },
        { heading: "Anwendbares Recht", paragraphs: ["Diese Vereinbarung unterliegt dem Recht der Tschechischen Republik. Streitigkeiten werden von den zuständigen Gerichten der Tschechischen Republik entschieden."] },
      ],
      termsSections: [
        { heading: "Anbieter und Umfang", paragraphs: ["Diese Bedingungen regeln freiwillige Zahlungen und zugehörige Unterstützungsdienste für LoFTP von Localio Labs s.r.o.", "Sie gelten für den Zahlungsvorgang, die elektronische Zustellung der Aktivierung und die damit verbundene Kundenkommunikation."] },
        { heading: "Bestellung und Vertragsschluss", paragraphs: ["Eine Bestellung entsteht durch Ausfüllen des Checkout-Formulars und Bestätigung der Zahlung über das Zahlungsportal.", "Der Kaufvertrag kommt mit erfolgreicher Autorisierung der Zahlung und Annahme der Bestellung durch den Anbieter zustande."] },
        { heading: "Preis und Zahlung", paragraphs: ["Alle Preise werden vor Abschluss der Bestellung angezeigt. Die Zahlung wird über Stripe oder einen anderen benannten Zahlungsdienstleister verarbeitet.", "Der Anbieter speichert keine vollständigen Kartendaten."] },
        { heading: "Lieferung digitaler Inhalte", paragraphs: ["Der Aktivierungsschlüssel wird elektronisch an die bei der Zahlung angegebene E-Mail-Adresse geliefert.", "Die Zustellung erfolgt in der Regel sofort nach erfolgreicher Zahlung, kann sich in begründeten technischen Fällen jedoch verzögern."] },
        { heading: "Reklamationen und Rückerstattungen", paragraphs: ["Ist der gelieferte Aktivierungsschlüssel fehlerhaft oder kann er aufgrund eines Problems auf Seiten des Anbieters nicht aktiviert werden, kann der Kunde Abhilfe verlangen.", "Da es sich um digitale Inhalte ohne physischen Datenträger handelt, kann das Widerrufsrecht nach Beginn der Lieferung eingeschränkt sein, soweit dies gesetzlich zulässig ist."] },
        { heading: "Support und Kontakt", paragraphs: ["Fragen zu Zahlungen, Rechnungen, Aktivierungszustellung oder Reklamationen können über das Kontaktformular auf www.mylocalio.com gesendet werden.", "Der Anbieter bearbeitet Kundenanfragen ohne unnötige Verzögerung."] },
      ],
      privacySections: [
        { heading: "Verantwortlicher", paragraphs: ["Verantwortlicher für Ihre personenbezogenen Daten ist Localio Labs s.r.o. mit Sitz in der Tschechischen Republik. Fragen zur Verarbeitung können über www.mylocalio.com gestellt werden."] },
        { heading: "Umfang der verarbeiteten Daten", paragraphs: ["Bei freiwilliger Zahlung und optionaler Aktivierung verarbeiten wir Ihre E-Mail-Adresse, den Aktivierungsschlüssel, die Art des Zahlungs- oder Aktivierungseintrags, die Installationskennung und technische Metadaten.", "Die Anwendung speichert Verbindungseinstellungen lokal auf Ihrem Gerät, einschließlich Zugangsdaten."] },
        { heading: "Zweck und Rechtsgrundlage", paragraphs: ["Ihre Daten werden zur Abwicklung freiwilliger Zahlungen, zur Zustellung des Aktivierungsschlüssels, für Support, Updates und zum Schutz der zugehörigen Dienste vor Missbrauch verarbeitet.", "Rechtsgrundlagen sind Vertragserfüllung, gesetzliche Pflichten und in begründeten Fällen berechtigte Interessen."] },
        { heading: "Empfänger und Auftragsverarbeiter", paragraphs: ["Zahlungen werden über Stripe, Inc. oder einen anderen Zahlungsdienstleister verarbeitet, der als unabhängiger Verantwortlicher auftritt.", "Zugangsdaten zu FTP/SFTP-Servern verbleiben ausschließlich auf Ihrem Gerät."] },
        { heading: "Speicherdauer", paragraphs: ["Zahlungs- oder aktivierungsbezogene Daten werden für die Dauer des Vertragsverhältnisses und anschließend entsprechend gesetzlicher Aufbewahrungspflichten gespeichert.", "Lokal gespeicherte Daten verbleiben auf Ihrem Gerät, bis Sie sie manuell entfernen oder die Anwendung deinstallieren."] },
        { heading: "Ihre Rechte", paragraphs: ["Nach geltendem Datenschutzrecht, einschließlich DSGVO, haben Sie Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit und Widerspruch.", "Zur Ausübung Ihrer Rechte kontaktieren Sie uns über www.mylocalio.com."] },
      ],
    },
  }),
  sk: withMeta("Slovenčina", {
    common: { close: "Zavrieť", cancel: "Zrušiť", save: "Uložiť", saveChanges: "Uložiť zmeny", delete: "Zmazať", rename: "Premenovať", create: "Vytvoriť", continue: "Pokračovať", install: "Nainštalovať", loading: "Načítavam...", local: "Miestne", server: "Server", all: "Všetko", selectedCount: "{count} vybrané", filesCountLabel: "Súbory: {done}/{total}", dir: "〈ADR〉", light: "Svetlá", dark: "Tmavá" },
    settings: { title: "Nastavenia", license: "Licencia", fullVersionActivated: "Plná verzia aktivovaná", activate: "Aktivovať", deactivateLicense: "Deaktivovať licenciu", licenseExpired: "Licencia vypršala", licenseRevoked: "Licencia zrušená", licenseLimitExceeded: "Prekročený limit zariadení", licenseInvalid: "Neplatná licencia", licenseExpiredDesc: "Vaša aktivácia vypršala. Aplikácia ďalej funguje, ale informačné okno o podpore projektu zostane zobrazené.", licenseRevokedDesc: "Vaša licencia bola zrušená. Kontaktujte podporu.", licenseLimitExceededDesc: "Bol prekročený maximálny počet zariadení pre túto aktiváciu. Deaktivujte iné zariadenie alebo použite inú aktiváciu.", appearance: "Vzhľad", language: "Jazyk", tabGeneral: "Všeobecné", tabAi: "AI", contextMenu: "Kontextová ponuka", contextMenuDesc: "Zvoľte, ktoré položky sa zobrazia v ponuke pravého tlačidla", contextMenuOpen: "Otvoriť", contextMenuClipboard: "Schránka", contextMenuSelection: "Výber", contextMenuFileOps: "Súborové operácie", contextMenuArchive: "Archívy", contextMenuProps: "Vlastnosti a atribúty", contextMenuAdvanced: "Pokročilé", contextMenuDestructive: "Zmazať", contextMenuResetAll: "Obnoviť všetko", ai: "AI", aiEnable: "Zapnúť AI vrstvu", aiEnableDesc: "Pripraví LoFTP na AI asistované workflow, routing modelov a konfiguráciu providerov.", aiOn: "Zapnuté", aiOff: "Vypnuté", aiResetSection: "Obnoviť AI nastavenia", aiResetDesc: "Vráti predvolené presety providerov a policy hodnoty pre toto zariadenie.", aiReset: "Reset AI", aiProviders: "Provideri", aiApiKey: "API kľúč", aiApiKeyConfigured: "Bezpečne uložený v systémovom keychaine.", aiApiKeyMissing: "Pre tohto providera nie je uložený žiadny API kľúč.", aiApiKeyPlaceholder: "Vložiť API kľúč", aiRemoveSecret: "Odobrať", aiConfigured: "Nastavené", aiMissing: "Chýba" },
    toolbar: { newConnection: "Nové pripojenie", refresh: "Obnoviť", disconnect: "Odpojiť", upload: "Nahrať", download: "Stiahnuť", folder: "Priečinok", rename: "Premenovať", delete: "Zmazať", search: "Hľadať", compare: "Porovnať", openArchive: "Otvoriť archív", createArchive: "Vytvoriť archív", settings: "Nastavenia", about: "O aplikácii" },
    ai: { outputTitle: "Výstup", jsonTitle: "Štruktúrovaný JSON", guardrails: "Guardraily", notConfigured: "AI ešte nie je nastavená." },
    about: { version: "Verzia {version}", description: "Desktop FTP/SFTP klient pre macOS so zameraním na rýchlu správu súborov a prenosov.", eula: "Licenčné podmienky", terms: "Obchodné podmienky", privacy: "Ochrana súkromia", updates: "Aktualizácie", checking: "Kontrolujem...", check: "Skontrolovať", latest: "Najnovšia verzia", updateAvailable: "K dispozícii v{version}", installing: "Inštalujem... {percent} %", updateError: "Chyba aktualizácie", notChecked: "Neskontrolované", updatesNotConfigured: "Aktualizácie nie sú nakonfigurované" },
    driveSelector: { volumes: "Disky", cloud: "Cloud", servers: "Servery", quickAccess: "Rýchly prístup", home: "Domovský priečinok", desktop: "Plocha", downloads: "Stiahnuté súbory", free: "voľné" },
    search: { title: "Hľadať súbory", searchIn: "Hľadať v:", fileName: "Názov súboru (glob)", containingText: "Obsahuje text", subfolders: "Podpriečinky", caseSensitive: "Rozlišovať veľkosť písmen", search: "Hľadať", searching: "Hľadám...", found: "Nájdené:", results: "výsledkov", noResults: "Žiadne výsledky", aiSearch: "AI hľadanie" },
    shareware: { version: "Verzia 1.0.0", body: "LoFTP je verejne zdieľaný projekt. Všetky funkcie sú plne dostupné. Aktivácia je voliteľná a slúži hlavne ako potvrdenie príspevku na vývoj.", expiredBody: "Vaša aktivácia vypršala. Všetky funkcie zostávajú dostupné. Aktivujte znovu, ak chcete toto informačné okno odstrániť.", revokedBody: "Vaša licencia bola zrušená. Kontaktujte podporu pre pomoc.", limitExceededBody: "Bol prekročený limit zariadení pre vašu aktiváciu. Deaktivujte iné zariadenie alebo použite inú aktiváciu.", activateLicense: "Aktivovať kód", buyLicense: "Podporiť vývoj" },
    purchase: { doneTitle: "Platba otvorená v prehliadači", doneBody: "Dokončite platbu v prehliadači. Po úspešnej platbe dostanete aktivačný kľúč na {email}.", doneHint: "Kód zadajte v Nastavenia -> Aktivačný kód.", title: "Podporiť vývoj LoFTP", securePayment: "Bezpečná platba", lifetimeLicense: "Príspevok na open-source projekt", email: "E-mail (na doručenie aktivácie)", redirectNotice: "Budete presmerovaní na zabezpečenú platobnú stránku Stripe.", openPayment: "Pokračovať k platbe" },
    editor: { unsupported: "Tento súbor nemožno upravovať (binárny súbor).", unsavedConfirm: "Súbor nebol uložený. Naozaj zavrieť?", saving: "Ukladám...", save: "Uložiť", loadingFile: "Načítavam súbor...", lines: "{count} riadkov", unsaved: "Neuložené", saveShortcut: "Ctrl+S na uloženie" },
    transferDialog: { uploadTitle: "Nahrať súbory", downloadTitle: "Stiahnuť súbory", archiveExtractTitle: "Kopírovať z archívu", copyTitle: "Kopírovať súbory", transferMode: "Režim prenosu", auto: "Automaticky", binary: "Binárny", overwriteExisting: "Keď súbor existuje", ask: "Opýtať sa", overwrite: "Prepísať", overwriteOlder: "Prepísať staršie", skip: "Preskočiť", rename: "Premenovať", options: "Možnosti", resume: "Pokračovať v prerušenom prenose", preserveTimestamps: "Zachovať časové pečiatky", preservePermissions: "Zachovať oprávnenia", followSymlinks: "Sledovať symbolické odkazy", createDirs: "Vytvárať adresáre", verify: "Overiť po prenose", extract: "Rozbaliť", copy: "Kopírovať", fileOne: "súbor", fileFew: "súbory", fileMany: "súborov", moreFiles: "ďalších súborov", advancedOptions: "Pokročilé možnosti" },
    transferStatus: { transferring: "Prenáša sa", done: "Dokončené", error: "Chyba prenosu", paused: "Pozastavené", queued: "Vo fronte", files: "Súbory", active: "Aktívne", pending: "Čaká", completed: "Dokončených {count} súborov", errors: "{count} chýb", cancelAll: "Zrušiť všetky prenosy" },
    transferQueue: { title: "Front prenosov", active: "Aktívne", pending: "Čaká", done: "Hotovo", errors: "Chyby", retry: "Skúsiť znova", moveUp: "Presunúť vyššie", cancel: "Zrušiť" },
    functionKeys: { view: "Zobraziť", edit: "Upraviť", copy: "Kopírovať", move: "Presunúť", folder: "Priečinok", delete: "Zmazať", search: "Hľadať" },
    contextMenu: { copyPath: "Kopírovať cestu", copyName: "Kopírovať názov", copyBaseName: "Kopírovať názov bez prípony", copyFiles: "Kopírovať súbory", pasteFiles: "Vložiť súbory", openInFinder: "Otvoriť vo Finderi", openInVsCode: "Otvoriť vo VS Code", openNatively: "Otvoriť v systéme", openWith: "Otvoriť pomocou…", openAsArchive: "Otvoriť ako archív…", openArchive: "Otvoriť archív", createArchive: "Vytvoriť archív…", extractHere: "Rozbaliť sem", extractTo: "Rozbaliť do…", copyTo: "Kopírovať do…", moveTo: "Presunúť do…", chmod: "Zmeniť oprávnenia…", changeDate: "Zmeniť dátum…", calculateChecksum: "Vypočítať kontrolný súčet…", batchRename: "Hromadné premenovanie…", newFile: "Nový súbor", newFolder: "Nový priečinok", splitFile: "Rozdeliť súbor…", combineFiles: "Spojiť súbory…", selectAll: "Vybrať všetko", deselectAll: "Zrušiť výber", invertSelection: "Invertovať výber", selectByExtension: "Vybrať podľa prípony", selectByPattern: "Vybrať podľa vzoru…", compareFolders: "Porovnať priečinky", aiExplainFile: "AI vysvetliť súbor", codexExplainFile: "Vysvetliť cez Codex", properties: "Vlastnosti", rename: "Premenovať", delete: "Zmazať", refresh: "Obnoviť" },
    hostingTabs: { empty: 'Žiadne uložené hostingy. Kliknite na "Nový+" pre pridanie.', editAria: "Upraviť {name}", deleteAria: "Zmazať {name}", deleteTitle: "Naozaj zmazať uložený prístup?", deleteMessage: 'Účet "{name}" bude odstránený z uložených pripojení vrátane hesla.', deleteFallback: "Táto akcia odstráni uložený prístup." },
    archive: { filesAndDirs: "{files} súborov, {dirs} priečinkov", total: "Spolu: {size}", extracting: "Rozbaľujem...", extractSelected: "Rozbaliť vybrané", extractAll: "Rozbaliť všetko" },
    properties: { title: "Vlastnosti", name: "Názov", path: "Cesta", type: "Typ", folder: "Priečinok", file: "Súbor", size: "Veľkosť", modified: "Zmenené", permissions: "Oprávnenia" },
    dialogs: { newFolderTitle: "Nový priečinok", newFolderLabel: "Názov priečinka:", renameTitle: "Premenovať", renameLabel: "Nový názov:", createArchiveTitle: "Vytvoriť archív", createArchiveLabel: "Názov ZIP archívu:", deleteTitle: "Zmazať", deleteMessage: "Naozaj zmazať {count} položiek?", chmodTitle: "Zmeniť oprávnenia", chmodLabel: "Nastaviť oprávnenia pre:", chmodOwner: "Vlastník", chmodGroup: "Skupina", chmodOther: "Ostatní", chmodRead: "Čítanie", chmodWrite: "Zápis", chmodExecute: "Spustenie", chmodOctal: "Osmičkovo", changeDateTitle: "Zmeniť dátum", changeDateLabel: "Nastaviť dátum úpravy pre:", checksumTitle: "Vypočítať kontrolný súčet", checksumAlgorithm: "Algoritmus", checksumResult: "Kontrolný súčet", checksumCopy: "Kopírovať" },
    toasts: { archiveCreated: "Archív vytvorený", archiveCreateFailed: "Vytvorenie archívu zlyhalo", folderOpenFailed: "Nepodarilo sa otvoriť priečinok", onedrivePickFailed: "Nepodarilo sa vybrať priečinok OneDrive", onedriveOpenedStored: "OneDrive bol otvorený cez uloženú cestu.", onedriveOpenedPicker: "OneDrive bol otvorený cez systémový výber priečinka.", connectionFailed: "Pripojenie zlyhalo" },
    notFound: { message: "Ups! Stránka sa nenašla", backHome: "Späť domov" },
    legal: skLegal,
  }),
  pl: withMeta("Polski", {
    common: { close: "Zamknij", cancel: "Anuluj", save: "Zapisz", saveChanges: "Zapisz zmiany", delete: "Usuń", rename: "Zmień nazwę", create: "Utwórz", continue: "Kontynuuj", install: "Zainstaluj", loading: "Ładowanie...", local: "Lokalne", server: "Serwer", all: "Wszystko", selectedCount: "Wybrano: {count}", filesCountLabel: "Pliki: {done}/{total}", dir: "〈KAT〉", light: "Jasny", dark: "Ciemny" },
    settings: { title: "Ustawienia", license: "Licencja", fullVersionActivated: "Pełna wersja aktywowana", activate: "Aktywuj", deactivateLicense: "Dezaktywuj licencję", licenseExpired: "Licencja wygasła", licenseRevoked: "Licencja cofnięta", licenseLimitExceeded: "Przekroczono limit urządzeń", licenseInvalid: "Nieprawidłowa licencja", licenseExpiredDesc: "Twoja aktywacja wygasła. Aplikacja nadal działa, ale informacja o wsparciu projektu pozostanie widoczna.", licenseRevokedDesc: "Twoja licencja została cofnięta. Skontaktuj się z pomocą techniczną.", licenseLimitExceededDesc: "Osiągnięto maksymalną liczbę urządzeń dla tej aktywacji. Dezaktywuj inne urządzenie lub użyj innej aktywacji.", appearance: "Wygląd", language: "Język", tabGeneral: "Ogólne", tabAi: "AI", contextMenu: "Menu kontekstowe", contextMenuDesc: "Wybierz, które elementy pojawią się w menu prawego przycisku", contextMenuOpen: "Otwórz", contextMenuClipboard: "Schowek", contextMenuSelection: "Zaznaczenie", contextMenuFileOps: "Operacje na plikach", contextMenuArchive: "Archiwa", contextMenuProps: "Właściwości i atrybuty", contextMenuAdvanced: "Zaawansowane", contextMenuDestructive: "Usuń", contextMenuResetAll: "Resetuj wszystko", ai: "AI", aiEnable: "Włącz warstwę AI", aiEnableDesc: "Przygotowuje LoFTP do workflow wspieranych przez AI, routingu modeli i konfiguracji providerów.", aiOn: "Włączone", aiOff: "Wyłączone", aiResetSection: "Reset ustawień AI", aiResetDesc: "Przywraca domyślne presety providerów i wartości policy dla tego urządzenia.", aiReset: "Reset AI", aiProviders: "Providerzy", aiApiKey: "Klucz API", aiApiKeyConfigured: "Bezpiecznie zapisany w systemowym keychainie.", aiApiKeyMissing: "Dla tego providera nie zapisano żadnego klucza API.", aiApiKeyPlaceholder: "Wklej klucz API", aiRemoveSecret: "Usuń", aiConfigured: "Skonfigurowano", aiMissing: "Brak" },
    toolbar: { newConnection: "Nowe połączenie", refresh: "Odśwież", disconnect: "Rozłącz", upload: "Prześlij", download: "Pobierz", folder: "Folder", rename: "Zmień nazwę", delete: "Usuń", search: "Szukaj", compare: "Porównaj", openArchive: "Otwórz archiwum", createArchive: "Utwórz archiwum", settings: "Ustawienia", about: "O aplikacji" },
    ai: { outputTitle: "Wynik", jsonTitle: "Strukturalny JSON", guardrails: "Guardraile", notConfigured: "AI nie jest jeszcze skonfigurowana." },
    about: { version: "Wersja {version}", description: "Desktopowy klient FTP/SFTP dla macOS skoncentrowany na szybkiej obsłudze plików i transferów.", eula: "Warunki licencji", terms: "Warunki handlowe", privacy: "Prywatność", updates: "Aktualizacje", checking: "Sprawdzanie...", check: "Sprawdź", latest: "Najnowsza wersja", updateAvailable: "Dostępna: v{version}", installing: "Instalowanie... {percent} %", updateError: "Błąd aktualizacji", notChecked: "Nie sprawdzono", updatesNotConfigured: "Aktualizacje nie są skonfigurowane" },
    driveSelector: { volumes: "Dyski", cloud: "Chmura", servers: "Serwery", quickAccess: "Szybki dostęp", home: "Folder domowy", desktop: "Pulpit", downloads: "Pobrane", free: "wolne" },
    search: { title: "Szukaj plików", searchIn: "Szukaj w:", fileName: "Nazwa pliku (glob)", containingText: "Zawiera tekst", subfolders: "Podfoldery", caseSensitive: "Uwzględniaj wielkość liter", search: "Szukaj", searching: "Szukanie...", found: "Znaleziono:", results: "wyników", noResults: "Brak wyników", aiSearch: "AI search" },
    shareware: { version: "Wersja 1.0.0", body: "LoFTP jest publicznie udostępnianym projektem. Wszystkie funkcje są w pełni dostępne. Aktywacja jest opcjonalna i głównie potwierdza wsparcie dalszego rozwoju.", expiredBody: "Twoja aktywacja wygasła. Wszystkie funkcje pozostają dostępne. Aktywuj ponownie, jeśli chcesz usunąć to okno informacyjne.", revokedBody: "Twoja licencja została cofnięta. Skontaktuj się z pomocą techniczną.", limitExceededBody: "Osiągnięto limit urządzeń dla Twojej aktywacji. Dezaktywuj inne urządzenie lub użyj innej aktywacji.", activateLicense: "Aktywuj kod", buyLicense: "Wesprzyj rozwój" },
    purchase: { doneTitle: "Płatność otwarta w przeglądarce", doneBody: "Dokończ płatność w przeglądarce. Po udanej płatności klucz aktywacyjny zostanie wysłany na {email}.", doneHint: "Wpisz kod w Ustawienia -> Kod aktywacyjny.", title: "Wesprzyj rozwój LoFTP", securePayment: "Bezpieczna płatność", lifetimeLicense: "Wkład w projekt open source", email: "E-mail (do wysyłki aktywacji)", redirectNotice: "Zostaniesz przekierowany na bezpieczną stronę płatności Stripe.", openPayment: "Przejdź do płatności" },
    editor: { unsupported: "Tego pliku nie można edytować (plik binarny).", unsavedConfirm: "Plik nie został zapisany. Na pewno zamknąć?", saving: "Zapisywanie...", save: "Zapisz", loadingFile: "Ładowanie pliku...", lines: "{count} wierszy", unsaved: "Niezapisane", saveShortcut: "Ctrl+S, aby zapisać" },
    transferDialog: { uploadTitle: "Prześlij pliki", downloadTitle: "Pobierz pliki", archiveExtractTitle: "Kopiuj z archiwum", copyTitle: "Kopiuj pliki", transferMode: "Tryb transferu", auto: "Automatycznie", binary: "Binarny", overwriteExisting: "Gdy plik istnieje", ask: "Zapytaj", overwrite: "Nadpisz", overwriteOlder: "Nadpisz starsze", skip: "Pomiń", rename: "Zmień nazwę", options: "Opcje", resume: "Wznów przerwany transfer", preserveTimestamps: "Zachowaj znaczniki czasu", preservePermissions: "Zachowaj uprawnienia", followSymlinks: "Podążaj za dowiązaniami", createDirs: "Twórz katalogi", verify: "Weryfikuj po transferze", extract: "Rozpakuj", copy: "Kopiuj", fileOne: "plik", fileFew: "pliki", fileMany: "plików", moreFiles: "więcej plików", advancedOptions: "Zaawansowane opcje" },
    transferStatus: { transferring: "Trwa przesyłanie", done: "Zakończono", error: "Błąd transferu", paused: "Wstrzymano", queued: "W kolejce", files: "Pliki", active: "Aktywne", pending: "Oczekuje", completed: "Ukończono {count} plików", errors: "{count} błędów", cancelAll: "Anuluj wszystkie transfery" },
    transferQueue: { title: "Kolejka transferów", active: "Aktywne", pending: "Oczekuje", done: "Gotowe", errors: "Błędy", retry: "Ponów", moveUp: "Przesuń wyżej", cancel: "Anuluj" },
    functionKeys: { view: "Podgląd", edit: "Edytuj", copy: "Kopiuj", move: "Przenieś", folder: "Folder", delete: "Usuń", search: "Szukaj" },
    contextMenu: { copyPath: "Kopiuj ścieżkę", copyName: "Kopiuj nazwę", copyBaseName: "Kopiuj nazwę bez rozszerzenia", copyFiles: "Kopiuj pliki", pasteFiles: "Wklej pliki", openInFinder: "Otwórz w Finderze", openInVsCode: "Otwórz w VS Code", openNatively: "Otwórz w systemie", openWith: "Otwórz za pomocą…", openAsArchive: "Otwórz jako archiwum…", openArchive: "Otwórz archiwum", createArchive: "Utwórz archiwum…", extractHere: "Rozpakuj tutaj", extractTo: "Rozpakuj do…", copyTo: "Kopiuj do…", moveTo: "Przenieś do…", chmod: "Zmień uprawnienia…", changeDate: "Zmień datę…", calculateChecksum: "Oblicz sumę kontrolną…", batchRename: "Zbiorcza zmiana nazwy…", newFile: "Nowy plik", newFolder: "Nowy folder", splitFile: "Podziel plik…", combineFiles: "Połącz pliki…", selectAll: "Zaznacz wszystko", deselectAll: "Odznacz wszystko", invertSelection: "Odwróć zaznaczenie", selectByExtension: "Zaznacz wg rozszerzenia", selectByPattern: "Zaznacz wg wzorca…", compareFolders: "Porównaj foldery", aiExplainFile: "AI wyjaśnij plik", codexExplainFile: "Wyjaśnij przez Codex", properties: "Właściwości", rename: "Zmień nazwę", delete: "Usuń", refresh: "Odśwież" },
    hostingTabs: { empty: 'Brak zapisanych hostingów. Kliknij "Nowy+", aby dodać.', editAria: "Edytuj {name}", deleteAria: "Usuń {name}", deleteTitle: "Usunąć zapisany dostęp?", deleteMessage: 'Konto "{name}" zostanie usunięte z zapisanych połączeń wraz z hasłem.', deleteFallback: "Ta akcja usunie zapisany dostęp." },
    archive: { filesAndDirs: "{files} plików, {dirs} folderów", total: "Razem: {size}", extracting: "Rozpakowywanie...", extractSelected: "Rozpakuj wybrane", extractAll: "Rozpakuj wszystko" },
    properties: { title: "Właściwości", name: "Nazwa", path: "Ścieżka", type: "Typ", folder: "Folder", file: "Plik", size: "Rozmiar", modified: "Zmodyfikowano", permissions: "Uprawnienia" },
    dialogs: { newFolderTitle: "Nowy folder", newFolderLabel: "Nazwa folderu:", renameTitle: "Zmień nazwę", renameLabel: "Nowa nazwa:", createArchiveTitle: "Utwórz archiwum", createArchiveLabel: "Nazwa archiwum ZIP:", deleteTitle: "Usuń", deleteMessage: "Usunąć {count} elementów?", chmodTitle: "Zmień uprawnienia", chmodLabel: "Ustaw uprawnienia dla:", chmodOwner: "Właściciel", chmodGroup: "Grupa", chmodOther: "Inni", chmodRead: "Odczyt", chmodWrite: "Zapis", chmodExecute: "Wykonanie", chmodOctal: "Ósemkowo", changeDateTitle: "Zmień datę", changeDateLabel: "Ustaw datę modyfikacji dla:", checksumTitle: "Oblicz sumę kontrolną", checksumAlgorithm: "Algorytm", checksumResult: "Suma kontrolna", checksumCopy: "Kopiuj" },
    toasts: { archiveCreated: "Archiwum utworzone", archiveCreateFailed: "Nie udało się utworzyć archiwum", folderOpenFailed: "Nie udało się otworzyć folderu", onedrivePickFailed: "Nie udało się wybrać folderu OneDrive", onedriveOpenedStored: "OneDrive otwarto z zapisanej ścieżki.", onedriveOpenedPicker: "OneDrive otwarto przez systemowy wybór folderu.", connectionFailed: "Połączenie nie powiodło się" },
    notFound: { message: "Ups! Nie znaleziono strony", backHome: "Powrót do strony głównej" },
    legal: plLegal,
  }),
  es: withMeta("Español", {
    common: { close: "Cerrar", cancel: "Cancelar", save: "Guardar", saveChanges: "Guardar cambios", delete: "Eliminar", rename: "Renombrar", create: "Crear", continue: "Continuar", install: "Instalar", loading: "Cargando...", local: "Local", server: "Servidor", all: "Todo", selectedCount: "{count} seleccionado(s)", filesCountLabel: "Archivos: {done}/{total}", dir: "〈DIR〉", light: "Claro", dark: "Oscuro" },
    settings: { title: "Ajustes", license: "Licencia", fullVersionActivated: "Versión completa activada", activate: "Activar", deactivateLicense: "Desactivar licencia", licenseExpired: "Licencia expirada", licenseRevoked: "Licencia revocada", licenseLimitExceeded: "Límite de dispositivos excedido", licenseInvalid: "Licencia no válida", licenseExpiredDesc: "Su activación ha expirado. La aplicación sigue funcionando, pero el aviso de apoyo al proyecto permanecerá visible.", licenseRevokedDesc: "Su licencia ha sido revocada. Contacte con soporte.", licenseLimitExceededDesc: "Se ha alcanzado el número máximo de dispositivos para esta activación. Desactive otro dispositivo o use otra activación.", appearance: "Apariencia", language: "Idioma", tabGeneral: "General", tabAi: "AI", contextMenu: "Menú contextual", contextMenuDesc: "Elija qué elementos aparecen en el menú del botón derecho", contextMenuOpen: "Abrir", contextMenuClipboard: "Portapapeles", contextMenuSelection: "Selección", contextMenuFileOps: "Operaciones de archivo", contextMenuArchive: "Archivos", contextMenuProps: "Propiedades y atributos", contextMenuAdvanced: "Avanzado", contextMenuDestructive: "Eliminar", contextMenuResetAll: "Restablecer todo", ai: "AI", aiEnable: "Activar capa AI", aiEnableDesc: "Prepara LoFTP para flujos asistidos por AI, routing de modelos y configuración de providers.", aiOn: "Activado", aiOff: "Desactivado", aiResetSection: "Restablecer AI", aiResetDesc: "Restaura los presets de providers y los valores de policy predeterminados para este dispositivo.", aiReset: "Reset AI", aiProviders: "Providers", aiApiKey: "Clave API", aiApiKeyConfigured: "Guardada de forma segura en el keychain del sistema.", aiApiKeyMissing: "No hay ninguna clave API guardada para este provider.", aiApiKeyPlaceholder: "Pegar clave API", aiRemoveSecret: "Eliminar", aiConfigured: "Configurado", aiMissing: "Falta" },
    toolbar: { newConnection: "Nueva conexión", refresh: "Recargar", disconnect: "Desconectar", upload: "Subir", download: "Descargar", folder: "Carpeta", rename: "Renombrar", delete: "Eliminar", search: "Buscar", compare: "Comparar", openArchive: "Abrir archivo", createArchive: "Crear archivo", settings: "Ajustes", about: "Acerca de" },
    ai: { outputTitle: "Salida", jsonTitle: "JSON estructurado", guardrails: "Guardrails", notConfigured: "AI aún no está configurada." },
    about: { version: "Versión {version}", description: "Cliente FTP/SFTP de escritorio para macOS centrado en la gestión rápida de archivos y transferencias.", eula: "Términos de licencia", terms: "Términos comerciales", privacy: "Privacidad", updates: "Actualizaciones", checking: "Comprobando...", check: "Comprobar", latest: "Última versión", updateAvailable: "Disponible: v{version}", installing: "Instalando... {percent} %", updateError: "Error de actualización", notChecked: "No comprobado", updatesNotConfigured: "Las actualizaciones no están configuradas" },
    driveSelector: { volumes: "Discos", cloud: "Nube", servers: "Servidores", quickAccess: "Acceso rápido", home: "Carpeta personal", desktop: "Escritorio", downloads: "Descargas", free: "libre" },
    search: { title: "Buscar archivos", searchIn: "Buscar en:", fileName: "Nombre de archivo (glob)", containingText: "Que contiene texto", subfolders: "Subcarpetas", caseSensitive: "Distinguir mayúsculas", search: "Buscar", searching: "Buscando...", found: "Encontrado:", results: "resultados", noResults: "Sin resultados", aiSearch: "Búsqueda AI" },
    shareware: { version: "Versión 1.0.0", body: "LoFTP es un proyecto compartido públicamente. Todas las funciones están totalmente disponibles. La activación es opcional y principalmente confirma su contribución al desarrollo.", expiredBody: "Su activación ha expirado. Todas las funciones siguen disponibles. Active de nuevo si quiere eliminar este aviso informativo.", revokedBody: "Su licencia ha sido revocada. Contacte con soporte para obtener ayuda.", limitExceededBody: "Se ha alcanzado el límite de dispositivos para su activación. Desactive otro dispositivo o use otra activación.", activateLicense: "Activar código", buyLicense: "Apoyar el desarrollo" },
    purchase: { doneTitle: "Pago abierto en el navegador", doneBody: "Complete el pago en su navegador. Tras un pago correcto, la clave de activación se enviará a {email}.", doneHint: "Introduzca el código en Ajustes -> Código de activación.", title: "Apoyar el desarrollo de LoFTP", securePayment: "Pago seguro", lifetimeLicense: "Contribución al proyecto open source", email: "Correo electrónico (para enviar la activación)", redirectNotice: "Será redirigido a la página segura de pago de Stripe.", openPayment: "Continuar al pago" },
    editor: { unsupported: "Este archivo no se puede editar (archivo binario).", unsavedConfirm: "El archivo no se ha guardado. ¿Cerrar de todos modos?", saving: "Guardando...", save: "Guardar", loadingFile: "Cargando archivo...", lines: "{count} líneas", unsaved: "Sin guardar", saveShortcut: "Ctrl+S para guardar" },
    transferDialog: { uploadTitle: "Subir archivos", downloadTitle: "Descargar archivos", archiveExtractTitle: "Copiar del archivo", copyTitle: "Copiar archivos", transferMode: "Modo de transferencia", auto: "Automático", binary: "Binario", overwriteExisting: "Cuando el archivo existe", ask: "Preguntar", overwrite: "Sobrescribir", overwriteOlder: "Sobrescribir más antiguos", skip: "Omitir", rename: "Renombrar", options: "Opciones", resume: "Reanudar transferencia interrumpida", preserveTimestamps: "Preservar marcas de tiempo", preservePermissions: "Preservar permisos", followSymlinks: "Seguir enlaces simbólicos", createDirs: "Crear directorios", verify: "Verificar tras transferencia", extract: "Extraer", copy: "Copiar", fileOne: "archivo", fileFew: "archivos", fileMany: "archivos", moreFiles: "más archivos", advancedOptions: "Opciones avanzadas" },
    transferStatus: { transferring: "Transfiriendo", done: "Completado", error: "Error de transferencia", paused: "Pausado", queued: "En cola", files: "Archivos", active: "Activo", pending: "Pendiente", completed: "{count} archivos completados", errors: "{count} errores", cancelAll: "Cancelar todas las transferencias" },
    transferQueue: { title: "Cola de transferencias", active: "Activo", pending: "Pendiente", done: "Hecho", errors: "Errores", retry: "Reintentar", moveUp: "Mover arriba", cancel: "Cancelar" },
    functionKeys: { view: "Ver", edit: "Editar", copy: "Copiar", move: "Mover", folder: "Carpeta", delete: "Eliminar", search: "Buscar" },
    contextMenu: { copyPath: "Copiar ruta", copyName: "Copiar nombre", copyBaseName: "Copiar nombre sin extensión", copyFiles: "Copiar archivos", pasteFiles: "Pegar archivos", openInFinder: "Abrir en Finder", openInVsCode: "Abrir en VS Code", openNatively: "Abrir en sistema", openWith: "Abrir con…", openAsArchive: "Abrir como archivo…", openArchive: "Abrir archivo", createArchive: "Crear archivo…", extractHere: "Extraer aquí", extractTo: "Extraer en…", copyTo: "Copiar a…", moveTo: "Mover a…", chmod: "Cambiar permisos…", changeDate: "Cambiar fecha…", calculateChecksum: "Calcular checksum…", batchRename: "Renombrar en lote…", newFile: "Nuevo archivo", newFolder: "Nueva carpeta", splitFile: "Dividir archivo…", combineFiles: "Combinar archivos…", selectAll: "Seleccionar todo", deselectAll: "Deseleccionar todo", invertSelection: "Invertir selección", selectByExtension: "Seleccionar por extensión", selectByPattern: "Seleccionar por patrón…", compareFolders: "Comparar carpetas", aiExplainFile: "AI explicar archivo", codexExplainFile: "Explicar con Codex", properties: "Propiedades", rename: "Renombrar", delete: "Eliminar", refresh: "Actualizar" },
    hostingTabs: { empty: 'No hay hostings guardados. Haz clic en "Nuevo+" para añadir uno.', editAria: "Editar {name}", deleteAria: "Eliminar {name}", deleteTitle: "¿Eliminar acceso guardado?", deleteMessage: 'La cuenta "{name}" se eliminará de las conexiones guardadas, incluida la contraseña.', deleteFallback: "Esta acción elimina el acceso guardado." },
    archive: { filesAndDirs: "{files} archivos, {dirs} carpetas", total: "Total: {size}", extracting: "Extrayendo...", extractSelected: "Extraer seleccionados", extractAll: "Extraer todo" },
    properties: { title: "Propiedades", name: "Nombre", path: "Ruta", type: "Tipo", folder: "Carpeta", file: "Archivo", size: "Tamaño", modified: "Modificado", permissions: "Permisos" },
    dialogs: { newFolderTitle: "Nueva carpeta", newFolderLabel: "Nombre de la carpeta:", renameTitle: "Renombrar", renameLabel: "Nuevo nombre:", createArchiveTitle: "Crear archivo", createArchiveLabel: "Nombre del archivo ZIP:", deleteTitle: "Eliminar", deleteMessage: "¿Eliminar {count} elementos?", chmodTitle: "Cambiar permisos", chmodLabel: "Establecer permisos para:", chmodOwner: "Propietario", chmodGroup: "Grupo", chmodOther: "Otros", chmodRead: "Lectura", chmodWrite: "Escritura", chmodExecute: "Ejecución", chmodOctal: "Octal", changeDateTitle: "Cambiar fecha", changeDateLabel: "Establecer fecha de modificación para:", checksumTitle: "Calcular checksum", checksumAlgorithm: "Algoritmo", checksumResult: "Checksum", checksumCopy: "Copiar" },
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
