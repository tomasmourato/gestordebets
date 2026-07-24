import { motion, useReducedMotion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import { type Bet } from "../types";
import { calculateFilteredBetsSummary } from "../utils";

interface FilteredBetsSummaryProps {
    bets: Bet[];
    currency: string;
    freebetOnly: boolean;
    footer?: ReactNode;
    fixedSelectionHeight?: boolean;
}

const money = (value: number, currency: string) =>
    `${value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency}`;

function FreebetAsterisk() {
    const tooltipId = useId();
    const [open, setOpen] = useState(false);

    return (
        <span className="group relative inline-flex align-baseline">
            <button
                type="button"
                aria-label="Explicar montante de freebet"
                aria-describedby={tooltipId}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                onBlur={() => setOpen(false)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                }}
                className="relative inline-flex cursor-help items-center justify-center font-bold text-violet-700 outline-none after:absolute after:-inset-2.5 hover:text-violet-800 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 dark:text-violet-300 dark:hover:text-violet-200 dark:focus-visible:ring-offset-zinc-900"
            >
                *
            </button>
            <span
                id={tooltipId}
                role="tooltip"
                className={`pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-0 z-30 whitespace-nowrap rounded-sm border border-violet-200 bg-white/60 px-2.5 py-1.5 font-sans text-[10px] font-semibold normal-case tracking-normal text-violet-800 shadow-lg shadow-violet-950/10 transition-opacity duration-150 dark:border-violet-800 dark:bg-zinc-950/60 dark:text-violet-200 dark:shadow-black/30 ${
                    open
                        ? "visible opacity-100"
                        : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                }`}
            >
                Valor utilizado em freebets
            </span>
        </span>
    );
}

function AnimatedMetricValue({
    valueKey,
    children,
}: {
    valueKey: string;
    children: ReactNode;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <span className="relative block min-h-5" aria-live="polite">
            <motion.span
                key={valueKey}
                data-motion-value={valueKey}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="block"
            >
                {children}
            </motion.span>
        </span>
    );
}

export default function FilteredBetsSummary({
    bets,
    currency,
    freebetOnly,
    footer,
    fixedSelectionHeight = false,
}: FilteredBetsSummaryProps) {
    const summary = calculateFilteredBetsSummary(bets);
    const reduceMotion = useReducedMotion();
    const compactMetrics = Boolean(footer);
    const profitClass =
        summary.netProfit > 0
            ? "text-emerald-600 dark:text-emerald-400"
            : summary.netProfit < 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-zinc-700 dark:text-zinc-200";

    const stakeValue: ReactNode = (
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {!freebetOnly && (
                <span className="text-zinc-900 dark:text-zinc-100">
                    {money(summary.settledStake, currency)}
                </span>
            )}
            {(freebetOnly || summary.freebetStake > 0) && (
                <span className="whitespace-nowrap text-violet-700 dark:text-violet-300">
                    {!freebetOnly && "("}
                    <FreebetAsterisk />
                    {money(summary.freebetStake, currency)}
                    {!freebetOnly && ")"}
                </span>
            )}
            {summary.pendingStake > 0 && (
                <span className="whitespace-nowrap text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    (+{money(summary.pendingStake, currency)} por liquidar)
                </span>
            )}
        </span>
    );

    const items = [
        {
            label: "Total apostado",
            value: stakeValue,
            valueKey: `${summary.settledStake}:${summary.freebetStake}:${summary.pendingStake}:${freebetOnly}`,
            className: "",
        },
        {
            label: "Total recebido",
            value: money(summary.totalReturn, currency),
            valueKey: String(summary.totalReturn),
            className: "text-zinc-900 dark:text-zinc-100",
        },
        {
            label: "Resultado líquido",
            value: `${summary.netProfit > 0 ? "+" : ""}${money(summary.netProfit, currency)}`,
            valueKey: String(summary.netProfit),
            className: profitClass,
        },
        {
            label: "Apostas consideradas",
            value: String(summary.betCount),
            valueKey: String(summary.betCount),
            className: "text-zinc-900 dark:text-zinc-100",
        },
    ];

    return (
        <section
            aria-label="Resumo financeiro das apostas filtradas"
            data-summary-compact={compactMetrics ? "true" : "false"}
            data-summary-fixed-height={
                fixedSelectionHeight ? "true" : undefined
            }
            className={`overflow-visible rounded-sm border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${
                fixedSelectionHeight ? "md:flex md:h-36 md:flex-col" : ""
            }`}
        >
            {fixedSelectionHeight && footer ? (
                <motion.div
                    data-summary-selection-rail
                    data-summary-selection-divider
                    data-summary-rail-motion="fade"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: reduceMotion ? 0 : 0.18,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="hidden items-center overflow-visible border-b border-zinc-200 px-4 dark:border-zinc-800 md:flex md:h-[3.625rem] md:flex-none"
                >
                    <div className="w-full">{footer}</div>
                </motion.div>
            ) : null}
            <div
                data-summary-metrics-state={
                    compactMetrics ? "compact" : "expanded"
                }
                className={`grid grid-cols-2 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 md:grid-cols-4 md:divide-y-0 ${
                    fixedSelectionHeight
                        ? compactMetrics
                            ? "md:h-[5.375rem] md:flex-none"
                            : "md:flex-1"
                        : ""
                }`}
            >
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={`min-w-0 px-3 py-3 md:flex md:flex-col md:justify-center md:px-4 ${
                            fixedSelectionHeight
                                ? compactMetrics
                                    ? "md:items-start md:text-left"
                                    : "md:items-center md:text-center"
                                : ""
                        }`}
                    >
                        <motion.p
                            initial={false}
                            animate={{
                                "--summary-label-size": fixedSelectionHeight
                                    ? compactMetrics
                                        ? "0.625rem"
                                        : "0.75rem"
                                    : "0.625rem",
                            }}
                            transition={{
                                duration: reduceMotion ? 0 : 0.18,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:text-[length:var(--summary-label-size)] dark:text-zinc-400"
                        >
                            {item.label}
                        </motion.p>
                        <motion.p
                            data-summary-metric-size={
                                compactMetrics ? "compact" : "normal"
                            }
                            initial={false}
                            animate={{
                                "--summary-metric-size": fixedSelectionHeight
                                    ? compactMetrics
                                        ? "1rem"
                                        : "1.5rem"
                                    : "0.875rem",
                                "--summary-metric-line-height":
                                    fixedSelectionHeight
                                        ? compactMetrics
                                            ? "1.5rem"
                                            : "2rem"
                                        : "1.25rem",
                            }}
                            transition={{
                                duration: reduceMotion ? 0 : 0.18,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className={`mt-1 text-sm font-mono font-bold tabular-nums md:text-[length:var(--summary-metric-size)] md:leading-[length:var(--summary-metric-line-height)] ${item.className}`}
                        >
                            <AnimatedMetricValue valueKey={item.valueKey}>
                                {item.value}
                            </AnimatedMetricValue>
                        </motion.p>
                    </div>
                ))}
            </div>
            {!fixedSelectionHeight && footer ? (
                <div
                    data-summary-footer
                    className="border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800 md:px-4"
                >
                    {footer}
                </div>
            ) : null}
        </section>
    );
}
