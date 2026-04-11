import { lazy, Suspense } from 'react';

/**
 * TOOL_REGISTRY — Maps node slugs to their interactive Spark tool components.
 * Add new tools here as they're built. Lazy-loaded for code splitting.
 */
const TOOL_REGISTRY = {
    'mixtures-alligation': lazy(() => import('./MixturesSparkTool')),
    'seating-circular': lazy(() => import('./SeatingCircularSparkTool')),
    'seating-linear': lazy(() => import('./SeatingLinearSparkTool')),
    'blood-relations': lazy(() => import('./BloodRelationsSparkTool')),
    'time-speed-distance': lazy(() => import('./SpeedDistanceSparkTool')),
    // Future tools:
    // 'ratio-proportion': lazy(() => import('./RatioSparkTool')),
    // 'clocks': lazy(() => import('./ClocksSparkTool')),
};

/**
 * InteractiveSpark — Framework wrapper that loads the correct interactive tool
 * for a given node. Returns null if no tool is registered.
 *
 * Props:
 *   node           — the aptitude node object
 *   unitMeta       — {icon, color, gradient, label, slug}
 *   onConceptMastered — (boolean) => void — called when mastery state changes
 */
export default function InteractiveSpark({ node, unitMeta, onConceptMastered }) {
    const ToolComponent = TOOL_REGISTRY[node.slug];

    if (!ToolComponent) return null;

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${unitMeta.color}40`, borderTopColor: unitMeta.color }} />
            </div>
        }>
            <div className="interactive-spark-container">
                <ToolComponent node={node} unitMeta={unitMeta} onConceptMastered={onConceptMastered} />
            </div>
        </Suspense>
    );
}

/** Check if a node has a registered interactive tool */
InteractiveSpark.hasToolFor = (slug) => slug in TOOL_REGISTRY;
