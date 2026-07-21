import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  X,
  ClipboardPaste
} from "lucide-react";
import { Bet, Selection, BetStatus, BetType, FreebetType } from "../types";
import { AVAILABLE_BOOKMAKERS, calculateBetReturnAndProfit } from "../utils";
import { defaultFreebetTypeFor } from "../lib/bookmakers";
import { authFetch, parseJsonResponse } from "../lib/authApi";
import { matchBookmaker, matchStatus } from "../lib/screenshotMatch";

interface ScreenshotImporterProps {
  currency: string;
  onAddBet: (bet: Bet) => void;
}

/** Marca os campos que foram pré-preenchidos automaticamente pela IA. */
function AiChip() {
  return (
    <span
      title="Preenchido automaticamente pela IA — confirma antes de gravar"
      className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900 px-1 py-0.5 rounded-xs"
    >
      <Sparkles size={8} /> IA
    </span>
  );
}

export default function ScreenshotImporter({ currency, onAddBet }: ScreenshotImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parsed Bet state for verification step
  const [parsedBet, setParsedBet] = useState<{
    bookmaker: string;
    type: string;
    status: string;
    isFreebet: boolean;
    stake: number;
    odd: number;
    potentialReturn: number;
    cashoutReturn: number;
    dateTime: string;
    selections: Array<{
      event: string;
      market: string;
      choice: string;
      odd: number;
    }>;
  } | null>(null);

  // Form edit states during verification
  const [editBookmaker, setEditBookmaker] = useState("");
  const [editType, setEditType] = useState<BetType>("SIMPLES");
  const [editStatus, setEditStatus] = useState<BetStatus>("POR_LIQUIDAR");
  const [editStake, setEditStake] = useState<string>("10.00");
  const [editCashoutReturn, setEditCashoutReturn] = useState<string>("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSelections, setEditSelections] = useState<Array<{
    event: string;
    market: string;
    choice: string;
    odd: string;
  }>>([]);
  const [isFreebet, setIsFreebet] = useState(false);
  const [editFreebetType, setEditFreebetType] = useState<FreebetType>("SNR");

  // Fila de boletins detetados no mesmo screenshot (G1). Revemos um de cada vez
  // reutilizando o formulário de edição; `detectedIndex` é o que está a ser revisto.
  const [detectedBets, setDetectedBets] = useState<any[]>([]);
  const [detectedIndex, setDetectedIndex] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle manual select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // O servidor aceita payloads JSON até 4MB; em base64 a imagem cresce ~37%,
  // por isso o ficheiro original não pode passar dos ~3MB.
  const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

  // Convert file and send to backend
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor, seleciona apenas ficheiros de imagem (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("A imagem excede 3MB. Recorta o screenshot ou reduz a resolução e tenta novamente.");
      return;
    }

    setErrorMessage(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      analyzeWithGemini(base64String);
    };
  };

  // Colar com Ctrl+V / Cmd+V: apanha a primeira imagem da área de
  // transferência e envia-a para análise, tal como um upload normal.
  // Só está ativo enquanto não há um boletim por confirmar nem análise a decorrer.
  useEffect(() => {
    if (parsedBet || isLoading) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [parsedBet, isLoading]);

  // Carrega um boletim detetado para os campos de edição do formulário.
  const loadDetectedBet = (data: any) => {
    setParsedBet(data);
    const matchedBk = matchBookmaker(data.bookmaker);
    setEditBookmaker(matchedBk);
    setEditFreebetType(defaultFreebetTypeFor(matchedBk));
    setEditType((data.type === "SIMPLES" || data.type === "MULTIPLA") ? data.type : "SIMPLES");
    const status = matchStatus(data.status);
    setEditStatus(status);
    setIsFreebet(data.isFreebet === true);
    setEditStake(data.stake ? data.stake.toString() : "10.00");
    setEditCashoutReturn(
      status === "CASHOUT"
        ? String(data.cashoutReturn ?? data.finalReturn ?? "")
        : ""
    );
    setEditDateTime(data.dateTime || new Date().toISOString().replace("T", " ").slice(0, 16));
    setEditSelections((data.selections || []).map((s: any) => ({
      event: s.event || "",
      market: s.market || "",
      choice: s.choice || "",
      odd: s.odd ? s.odd.toString() : "1.50",
    })));
    setEditNotes("Importado automaticamente via Inteligência Artificial.");
  };

  // Call the server API
  const analyzeWithGemini = async (imageBase64: string) => {
    setIsLoading(true);
    setParsedBet(null);
    setLoadingStep("A carregar imagem e a otimizar para envio...");

    try {
      // Step simulation for good UX
      setTimeout(() => {
        setLoadingStep("A estabelecer ligação com os serviços do Gemini AI...");
      }, 1500);

      setTimeout(() => {
        setLoadingStep("A analisar layout e a extrair seleções do boletim de apostas...");
      }, 3500);

      // authFetch injeta o header Authorization — a rota /api/parse-screenshot
      // é protegida por authenticateToken no servidor.
      const response = await authFetch("/api/parse-screenshot", {
        method: "POST",
        body: JSON.stringify({ imageBase64 }),
      });

      const resData = await parseJsonResponse(response);

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Não foi possível extrair os dados da imagem.");
      }

      // A IA devolve agora TODOS os boletins da imagem em data.bets (G1).
      // Aceitamos o formato antigo (bet único) por compatibilidade.
      const betsArr: any[] = Array.isArray(resData.data?.bets)
        ? resData.data.bets
        : resData.data
          ? [resData.data]
          : [];

      if (betsArr.length === 0) {
        throw new Error("Nenhum boletim de apostas foi detetado na imagem.");
      }

      setDetectedBets(betsArr);
      setDetectedIndex(0);
      setImportedCount(0);
      loadDetectedBet(betsArr[0]);

    } catch (error: any) {
      console.error("Error analyzing image:", error);
      setErrorMessage(error.message || "Ocorreu um erro ao comunicar com a IA do Gemini.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  // Re-calculate total odd in the verification step
  const calculatedTotalOdd = React.useMemo(() => {
    let multiplier = 1;
    let count = 0;
    editSelections.forEach(s => {
      const parsed = parseFloat(s.odd);
      if (!isNaN(parsed) && parsed > 0) {
        multiplier *= parsed;
        count++;
      }
    });
    return count > 0 ? Number(multiplier.toFixed(2)) : 1.00;
  }, [editSelections]);

  // Retorno/lucro em tempo real na caixa de simulação, já a respeitar o
  // estado detetado e as regras de freebet.
  const previewReturns = React.useMemo(
    () =>
      calculateBetReturnAndProfit(
        parseFloat(editStake) || 0,
        calculatedTotalOdd,
        editStatus,
        isFreebet,
        parseFloat(editCashoutReturn) || 0,
        editFreebetType
      ),
    [editStake, calculatedTotalOdd, editStatus, isFreebet, editCashoutReturn, editFreebetType]
  );

  // Submit verified bet
  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault();

    const stakeNum = parseFloat(editStake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setErrorMessage("Por favor insira uma stake válida.");
      return;
    }

    // Map selections
    const finalSelections: Selection[] = [];
    let isValid = true;

    editSelections.forEach((s, idx) => {
      const oddNum = parseFloat(s.odd);
      if (!s.event.trim() || !s.market.trim() || !s.choice.trim() || isNaN(oddNum) || oddNum <= 1) {
        isValid = false;
      }
      finalSelections.push({
        id: `sel-import-${idx}-${Date.now()}`,
        event: s.event.trim(),
        market: s.market.trim(),
        choice: s.choice.trim(),
        odd: oddNum
      });
    });

    if (!isValid) {
      setErrorMessage("Por favor confirma todas as seleções. Os valores devem ser válidos e as odds superiores a 1.0.");
      return;
    }

    setErrorMessage(null);

    // Perform calculations based on status and freebet rules using central utility function
    const { potentialReturn, finalReturn, netProfit } = calculateBetReturnAndProfit(
      stakeNum,
      calculatedTotalOdd,
      editStatus,
      isFreebet,
      parseFloat(editCashoutReturn) || 0,
      editFreebetType
    );

    const confirmedBet: Bet = {
      id: "bet-" + Date.now(),
      type: editType,
      status: editStatus,
      selections: finalSelections,
      stake: stakeNum,
      odd: calculatedTotalOdd,
      isFreebet,
      freebetType: isFreebet ? editFreebetType : undefined,
      potentialReturn: Number(potentialReturn.toFixed(2)),
      finalReturn: Number(finalReturn.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      bookmaker: editBookmaker === "Outra" ? parsedBet?.bookmaker || "Betano" : editBookmaker,
      dateTime: editDateTime,
      notes: editNotes.trim() || undefined,
      origin: "SCREENSHOT",
      metadata: {
        screenshotConfidence: 0.90,
        detectedFields: ["bookmaker", "selections", "stake", "odd", "status", "isFreebet"],
        correctedFields: [],
        isCashout: editStatus === "CASHOUT",
        cashoutReturn: editStatus === "CASHOUT" ? finalReturn : null,
      }
    };

    onAddBet(confirmedBet);
    const savedSoFar = importedCount + 1;
    setImportedCount(savedSoFar);

    // Se ainda há boletins detetados por rever, avança para o próximo em vez
    // de fechar (G1 — vários boletins no mesmo screenshot).
    const nextIndex = detectedIndex + 1;
    if (nextIndex < detectedBets.length) {
      setDetectedIndex(nextIndex);
      loadDetectedBet(detectedBets[nextIndex]);
      setSuccessMessage(`Aposta ${savedSoFar} gravada. A rever a próxima (${nextIndex + 1}/${detectedBets.length})…`);
      setTimeout(() => setSuccessMessage(null), 4000);
      return;
    }

    // Terminou a fila — limpa tudo.
    setParsedBet(null);
    setSelectedImage(null);
    setImageFileName("");
    setDetectedBets([]);
    setDetectedIndex(0);
    setSuccessMessage(
      savedSoFar > 1
        ? `${savedSoFar} apostas importadas e gravadas com sucesso!`
        : "Aposta importada e gravada com sucesso!"
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Salta o boletim atual sem o gravar e passa ao próximo (ou termina).
  const skipDetectedBet = () => {
    const nextIndex = detectedIndex + 1;
    if (nextIndex < detectedBets.length) {
      setDetectedIndex(nextIndex);
      loadDetectedBet(detectedBets[nextIndex]);
    } else {
      handleResetImport();
    }
  };

  // Selection inputs edit
  const handleSelectionEdit = (idx: number, field: string, val: string) => {
    const updated = [...editSelections];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditSelections(updated);
  };

  const addSelection = () => {
    setEditSelections([...editSelections, { event: "", market: "", choice: "", odd: "1.50" }]);
  };

  const removeSelection = (idx: number) => {
    if (editSelections.length > 1) {
      setEditSelections(editSelections.filter((_, i) => i !== idx));
    }
  };

  const handleResetImport = () => {
    setSelectedImage(null);
    setParsedBet(null);
    setImageFileName("");
    setErrorMessage(null);
    setIsFreebet(false);
    setEditStatus("POR_LIQUIDAR");
    setDetectedBets([]);
    setDetectedIndex(0);
    setImportedCount(0);
  };

  return (
    <div className="space-y-6" id="import-tab">
      
      {/* Intro Header */}
      <div className="relative overflow-hidden bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 dark:border-zinc-800 border-l-2 border-l-emerald-500 rounded-sm p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <h4 className="text-lg font-semibold tracking-tight font-display flex items-center gap-1.5">
            <Sparkles size={18} className="text-emerald-400" /> Importador Inteligente de Apostas
          </h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Tira um screenshot ao teu boletim na Betano, Betclic ou Placard, cola-o com Ctrl+V ou faz o upload — o Gemini AI extrai as seleções, odds, stake, casa de apostas, estado e freebet por ti.
          </p>
        </div>
        <div className="relative text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-300 px-3 py-2 rounded-sm border border-emerald-500/25 shrink-0">
          Powered by <strong>Gemini 2.5 Flash</strong>
        </div>
      </div>

      {!parsedBet && !isLoading && (
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/30"
                : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-emerald-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
            }`}
            id="drag-drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleChange}
            />

            <div className="flex flex-col items-center">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-sm mb-4">
                <Upload size={30} />
              </div>
              <h5 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm sm:text-base">Arrasta o screenshot para aqui</h5>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Ou clica para pesquisar nos teus ficheiros</p>

              {/* Atalho de colagem (apenas relevante em desktop) */}
              <p className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 mt-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 px-3 py-1.5 rounded-sm">
                <ClipboardPaste size={12} className="shrink-0" />
                Podes colar diretamente com
                <kbd className="font-mono font-bold bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xs px-1">Ctrl</kbd>
                +
                <kbd className="font-mono font-bold bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xs px-1">V</kbd>
              </p>

              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-sm">PNG, JPG ou WEBP até 3MB</p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-sm flex items-center gap-2.5 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-sm flex items-center gap-2.5 text-xs font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

        </div>
      )}

      {/* Loading State with simulated progressive steps */}
      {isLoading && (
        <div className="max-w-md mx-auto p-10 bg-white dark:bg-zinc-900 rounded-sm border border-zinc-300 dark:border-zinc-700 text-center space-y-6" id="loading-import">
          <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-100 dark:border-emerald-900 animate-pulse" />
            <RefreshCw className="text-emerald-600 dark:text-emerald-400 animate-spin" size={20} />
          </div>
          <div className="space-y-1.5">
            <h5 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">O Gemini está a analisar o teu boletim...</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto animate-pulse">{loadingStep}</p>
          </div>
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-400 dark:text-zinc-500">
            Falta muito pouco. O processamento com visão computacional demora cerca de 5-10 segundos.
          </div>
        </div>
      )}

      {/* Verification Step (Progressive confirmation) */}
      {parsedBet && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="verification-step">
          
          {/* Left Panel: Preview Image */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-bold text-zinc-700 dark:text-zinc-300 text-[10px] uppercase tracking-wider">Screenshot Fornecido</h5>
                <button
                  onClick={handleResetImport}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} /> Remover
                </button>
              </div>
              {selectedImage && (
                <div className="rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-[420px] bg-zinc-900 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Screenshot do boletim"
                    className="max-w-full max-h-[420px] object-contain"
                  />
                </div>
              )}
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 text-center truncate">{imageFileName}</p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 rounded-sm flex gap-2.5 text-xs leading-normal">
              <CheckCircle2 size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Confirmação Obrigatória</strong>
                A IA detetou os dados do teu boletim, incluindo a casa de apostas, o estado da aposta e se foi usada uma freebet. Verifica e corrige qualquer imprecisão nas caixas ao lado antes de confirmar a gravação definitiva.
              </div>
            </div>
          </div>

          {/* Right Panel: Progressive Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleConfirmAndSave} className="bg-white dark:bg-zinc-900 rounded-sm p-6 border border-zinc-200 dark:border-zinc-800 space-y-5 text-xs">

              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-1.5">
                  <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" /> Validar Dados Extraídos
                </h5>
                {detectedBets.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
                      Boletim {detectedIndex + 1} de {detectedBets.length}
                    </span>
                    <button
                      type="button"
                      onClick={skipDetectedBet}
                      className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 uppercase tracking-wider cursor-pointer"
                    >
                      Saltar
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">Sucesso</span>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 flex items-center gap-2 font-medium">
                  <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Bookmaker & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                    Casa de Apostas
                    <AiChip />
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-zinc-800 dark:text-zinc-100 font-medium"
                    value={editBookmaker}
                    onChange={(e) => setEditBookmaker(e.target.value)}
                  >
                    {AVAILABLE_BOOKMAKERS.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                    <option value="Outra">Outra ({parsedBet.bookmaker})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Tipo de Aposta</label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-zinc-800 dark:text-zinc-100 font-medium"
                    value={editType}
                    onChange={(e) => {
                      const newType = e.target.value as BetType;
                      setEditType(newType);
                      if (newType === "SIMPLES" && editSelections.length > 1) {
                        setEditSelections([editSelections[0]]);
                      }
                    }}
                  >
                    <option value="SIMPLES">Simples</option>
                    <option value="MULTIPLA">Múltipla</option>
                  </select>
                </div>
              </div>

              {/* Stake & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Valor Apostado (Stake)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-zinc-800 dark:text-zinc-100 font-mono font-bold"
                    value={editStake}
                    onChange={(e) => setEditStake(e.target.value)}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                    Estado de Liquidação
                    <AiChip />
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-zinc-800 dark:text-zinc-100"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as BetStatus)}
                  >
                    <option value="POR_LIQUIDAR">Por Liquidar (Pendente)</option>
                    <option value="GANHA">Ganha (Liquidar total)</option>
                    <option value="PERDIDA">Perdida (Liquidar perda)</option>
                    <option value="ANULADA">Anulada (Reembolsar)</option>
                    <option value="MEIO_GANHA">Meio Ganha</option>
                    <option value="MEIO_PERDIDA">Meio Perdida</option>
                    <option value="CASHOUT">Cashout</option>
                  </select>
                </div>
              </div>

              {/* Cashout: valor recebido ao encerrar antecipadamente */}
              {editStatus === "CASHOUT" && (
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                    Valor do Cashout ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded-sm border border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-800 focus:outline-none focus:border-violet-500 text-zinc-800 dark:text-zinc-100 font-mono font-bold"
                    placeholder="0.00"
                    value={editCashoutReturn}
                    onChange={(e) => setEditCashoutReturn(e.target.value)}
                  />
                </div>
              )}

              {/* Freebet Checkbox + tipo */}
              <div className="p-3.5 bg-emerald-50/30 dark:bg-emerald-950/30 rounded-sm border border-emerald-100 dark:border-emerald-900 space-y-2.5">
                <label className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    checked={isFreebet}
                    onChange={(e) => setIsFreebet(e.target.checked)}
                  />
                  <span>Esta aposta usa saldo de Freebet?</span>
                  <AiChip />
                </label>

                {isFreebet && (
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-800 dark:text-zinc-100 text-[11px]"
                    value={editFreebetType}
                    onChange={(e) => setEditFreebetType(e.target.value as FreebetType)}
                  >
                    <option value="SNR">Stake não devolvida — SNR</option>
                    <option value="SR">Stake devolvida — SR (Betclic)</option>
                  </select>
                )}
              </div>

              {/* Selections Extraction Form */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-500 dark:text-zinc-400 font-semibold">Seleções Detetadas ({editSelections.length})</label>
                  {editType === "MULTIPLA" && (
                    <button
                      type="button"
                      onClick={addSelection}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      <PlusCircle size={12} /> Adicionar Seleção
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {editSelections.map((sel, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-sm border border-zinc-200 dark:border-zinc-700 space-y-2 relative"
                    >
                      {editSelections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSelection(idx)}
                          className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-rose-600 cursor-pointer"
                        >
                          <MinusCircle size={12} />
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Evento</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm text-[11px] text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
                            value={sel.event}
                            onChange={(e) => handleSelectionEdit(idx, "event", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Mercado Detetado</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm text-[11px] text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
                            value={sel.market}
                            onChange={(e) => handleSelectionEdit(idx, "market", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Escolha</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm text-[11px] text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
                            value={sel.choice}
                            onChange={(e) => handleSelectionEdit(idx, "choice", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Odd</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1.01"
                            required
                            className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm text-[11px] text-zinc-800 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-600"
                            value={sel.odd}
                            onChange={(e) => handleSelectionEdit(idx, "odd", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations review */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Data de Registo</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
                    value={editDateTime}
                    onChange={(e) => setEditDateTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Notas adicionais</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 text-[11px]"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Simulation Result preview */}
              <div className="p-4 bg-zinc-900 dark:bg-zinc-950 dark:border dark:border-zinc-800 text-zinc-100 rounded-sm flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Resultado da Validação</p>
                  <p className="text-xs font-semibold mt-1">
                    Odd Total: <span className="font-mono text-emerald-300 font-bold">@{calculatedTotalOdd.toFixed(2)}</span>
                  </p>
                  {isFreebet && (
                    <p className="text-[9px] text-amber-300 font-bold uppercase tracking-wider mt-1">Freebet — a stake não conta para o lucro</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
                    {editStatus === "POR_LIQUIDAR" ? "Retorno Potencial" : "Lucro Líquido"}
                  </p>
                  <p className={`text-base font-bold font-mono mt-0.5 ${
                    editStatus === "POR_LIQUIDAR"
                      ? "text-emerald-400"
                      : previewReturns.netProfit > 0
                        ? "text-emerald-400"
                        : previewReturns.netProfit < 0
                          ? "text-rose-400"
                          : "text-zinc-300"
                  }`}>
                    {editStatus === "POR_LIQUIDAR"
                      ? `${previewReturns.potentialReturn.toFixed(2)}${currency}`
                      : `${previewReturns.netProfit >= 0 ? "+" : ""}${previewReturns.netProfit.toFixed(2)}${currency}`}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleResetImport}
                  className="px-4 py-2 rounded-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Check size={14} /> {detectedIndex + 1 < detectedBets.length ? "Gravar e Seguinte" : "Confirmar e Gravar Aposta"}
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}
