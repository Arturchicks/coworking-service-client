// Inline SVG-иконка "warning" (восклицательный знак в круге).
// Inline вместо lucide-react/иконок-библиотеки — не тащим dependency ради одного знака.
// 24×24 viewBox — стандарт Material/Heroicons; масштабируется через className width/height.
// `currentColor` для stroke позволяет наследовать цвет от родителя (text-amber-500 и т.п.).
export function WarningIcon({className}: {className?: string}) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="8" x2="12" y2="12" />
			<line x1="12" y1="16" x2="12.01" y2="16" />
		</svg>
	)
}
