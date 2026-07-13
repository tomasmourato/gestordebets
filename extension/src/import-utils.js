function metadataOf(row) {
  const metadata = row?.metadata;
  if (!metadata) return {};
  if (typeof metadata === "object") return metadata;
  try {
    return JSON.parse(metadata);
  } catch (_) {
    return {};
  }
}

export function importKeyOf(row) {
  const metadata = metadataOf(row);
  if (metadata.importKey) return String(metadata.importKey);
  if (metadata.source && metadata.ref !== undefined && metadata.ref !== null) {
    return `${String(metadata.source).toLowerCase()}:${String(metadata.ref)}`;
  }
  return null;
}

export function indexExistingBets(rows) {
  const index = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = importKeyOf(row);
    if (key) index.set(key, row);
  }
  return index;
}

function comparableExisting(row) {
  return {
    type: row?.type,
    status: row?.status,
    stake: Number(row?.stake) || 0,
    odd: Number(row?.odd) || 0,
    isFreebet: row?.is_freebet === true || row?.isFreebet === true,
    potentialReturn: Number(row?.potential_return ?? row?.potentialReturn) || 0,
    finalReturn: Number(row?.final_return ?? row?.finalReturn) || 0,
    netProfit: Number(row?.net_profit ?? row?.netProfit) || 0,
    bookmaker: row?.bookmaker ?? "",
    dateTime: row?.date_time ?? row?.dateTime ?? "",
    selections: row?.selections ?? [],
    metadata: metadataOf(row),
  };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function importedBetChanged(existing, mapped) {
  const current = comparableExisting(existing);
  const next = {
    type: mapped.type,
    status: mapped.status,
    stake: mapped.stake,
    odd: mapped.odd,
    isFreebet: mapped.isFreebet,
    potentialReturn: mapped.potentialReturn,
    finalReturn: mapped.finalReturn,
    netProfit: mapped.netProfit,
    bookmaker: mapped.bookmaker,
    dateTime: mapped.dateTime,
    selections: mapped.selections ?? [],
    metadata: mapped.metadata ?? {},
  };
  return JSON.stringify(stable(current)) !== JSON.stringify(stable(next));
}

export function reconcileImportedBets(mappedBets, existingIndex) {
  const fresh = [];
  const updates = [];
  const skipped = [];
  for (const bet of mappedBets) {
    const key = importKeyOf(bet);
    const existing = key ? existingIndex.get(key) : null;
    if (!existing) fresh.push(bet);
    else if (importedBetChanged(existing, bet)) updates.push({ id: String(existing.id), bet });
    else skipped.push(bet);
  }
  return { fresh, updates, skipped };
}
