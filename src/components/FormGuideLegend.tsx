/**
 * Legend explaining the team form guide symbols.
 * - Circle shape = Home game
 * - Square shape = Away game
 * - Green = Win, Red = Loss, Blue = Draw
 */
export function FormGuideLegend() {
  return (
    <div className="px-4 md:px-6 pt-3 pb-2 text-xs text-gray-600 flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1">
      <span className="font-semibold self-center">Key:</span>
      {/* Home Win */}
      <span className="flex items-center gap-1">
        <div className="w-5 h-5 flex items-center justify-center border-2 rounded-full border-green-500">
          <span className="text-xs font-bold leading-none text-green-600">W</span>
        </div>
        = Home Win
      </span>
      {/* Home Loss */}
      <span className="flex items-center gap-1">
        <div className="w-5 h-5 flex items-center justify-center border-2 rounded-full border-red-500">
          <span className="text-xs font-bold leading-none text-red-600">L</span>
        </div>
        = Home Loss
      </span>
      {/* Home Draw */}
      <span className="flex items-center gap-1">
        <div className="w-5 h-5 flex items-center justify-center border-2 rounded-full border-blue-500">
          <span className="text-xs font-bold leading-none text-blue-600">D</span>
        </div>
        = Home Draw
      </span>
      {/* Away Win */}
      <span className="flex items-center gap-1">
        <div className="w-5 h-5 flex items-center justify-center border-2 rounded-sm border-green-500">
          <span className="text-xs font-bold leading-none text-green-600">W</span>
        </div>
        = Away Win
      </span>
      {/* Away Loss */}
      <span className="flex items-center gap-1">
        <div className="w-5 h-5 flex items-center justify-center border-2 rounded-sm border-red-500">
          <span className="text-xs font-bold leading-none text-red-600">L</span>
        </div>
        = Away Loss
      </span>
      {/* Away Draw */}
      <span className="flex items-center gap-1">
        <div className="w-5 h-5 flex items-center justify-center border-2 rounded-sm border-blue-500">
          <span className="text-xs font-bold leading-none text-blue-600">D</span>
        </div>
        = Away Draw
      </span>
    </div>
  );
}
