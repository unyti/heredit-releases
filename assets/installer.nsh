; installer.nsh — Heredit — Personnalisation installeur NSIS

!macro customUnInstall
  ; IfSilent = vrai si appelé avec /S (mise à jour automatique)
  ; → on ne pose JAMAIS la question lors d'une MAJ, seulement lors d'une désinstallation manuelle
  IfSilent end_uninstall

  MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 \
    "Désinstallation de Heredit$\n$\nSouhaitez-vous supprimer vos données personnelles ?$\n(investissements, profils, historique)$\n$\nChoisissez Non pour les conserver." \
    IDYES delete_data
  Goto end_uninstall

  delete_data:
    RMDir /r "$APPDATA\heredit"
    RMDir /r "$APPDATA\Heredit"

  end_uninstall:
!macroend
