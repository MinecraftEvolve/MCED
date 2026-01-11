!macro customHeader
  ; Custom branding
  BrandingText "Minecraft Config Editor v${VERSION}"
  
  ; Smoother appearance
  XPStyle on
  ShowInstDetails show
!macroend

!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
!macroend

!macro customInstall
  # Create desktop shortcut
  CreateShortCut "$DESKTOP\Minecraft Config Editor.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  
  # Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\Minecraft Config Editor"
  CreateShortCut "$SMPROGRAMS\Minecraft Config Editor\Minecraft Config Editor.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  CreateShortCut "$SMPROGRAMS\Minecraft Config Editor\Uninstall.lnk" "$INSTDIR\Uninstall ${PRODUCT_NAME}.exe"
!macroend

!macro customUnInstall
  # Remove desktop shortcut
  Delete "$DESKTOP\Minecraft Config Editor.lnk"
  
  # Remove start menu shortcuts
  Delete "$SMPROGRAMS\Minecraft Config Editor\Minecraft Config Editor.lnk"
  Delete "$SMPROGRAMS\Minecraft Config Editor\Uninstall.lnk"
  RMDir "$SMPROGRAMS\Minecraft Config Editor"
!macroend
