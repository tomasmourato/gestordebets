# Selection Detail and Card Motion Design

- Known selection outcomes use only the existing green/red/neutral selection-card tint; their text badges are removed.
- `DESCONHECIDO` keeps its amber badge and explicit label.
- Desktop bet cards keep the checkbox absolutely positioned. Their inner content gains `44px` left padding in selection mode, animated over `180ms` with Motion; reduced-motion users get an immediate state change.
- No mobile behavior, financial calculations, selection logic, or card dimensions change.

