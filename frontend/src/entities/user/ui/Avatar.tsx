import {useState} from 'react'
import {cn} from '../../../shared/lib'


type Size = 'sm' | 'md' | 'lg'

interface AvatarProps {
	avatarUrl: string | null
	email: string
	displayName?: string | null
	size?: Size
	className?: string
}

// Размеры в пикселях — нужны как атрибуты <img width/height>, чтобы браузер знал
// intrinsic-размер ДО загрузки картинки. Без них в момент загрузки <img> показывает
// natural-size (например 800×400 от внешнего URL) и кадрирует ПОСЛЕ application'а CSS —
// layout-shift, мерцание. С явными width/height браузер сразу reserve'ит box.
//
// Источник: Web.dev — "Optimize Cumulative Layout Shift", всегда задавать width/height на img.
const SIZE_PX: Record<Size, number> = {
	sm: 32,
	md: 40,
	lg: 80,
}

const SIZE_CLASS: Record<Size, string> = {
	sm: 'w-8 h-8 text-xs',
	md: 'w-10 h-10 text-sm',
	lg: 'w-20 h-20 text-2xl',
}

function initials(email: string, displayName?: string | null): string {
	const source = displayName?.trim() || email
	const parts = source.split(/[\s@.]+/).filter(Boolean)
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
	return source.slice(0, 2).toUpperCase()
}

function hueFromEmail(email: string): number {
	let h = 0
	for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0
	return h % 360
}

export function Avatar({avatarUrl, email, displayName, size = 'md', className}: AvatarProps) {
	const [imgFailed, setImgFailed] = useState(false)

	const px = SIZE_PX[size]

	if (avatarUrl && !imgFailed) {
		return (
			<img
				src={avatarUrl}
				alt={displayName ?? email}
				width={px}
				height={px}
				draggable={false}
				onError={() => setImgFailed(true)}
				className={cn(
					// block — убирает baseline-зазор от inline-img.
					'block rounded-full select-none',
					// aspect-square — гарантия квадратной пропорции, даже если parent flex/grid решит "потянуть" img.
					// shrink-0 — flex-родитель не имеет права сжимать (например в Header при tight viewport).
					'aspect-square shrink-0',
					// object-cover + object-center — реальный resize: картинка ЗАПОЛНЯЕТ круг,
					// лишнее обрезается по центру (стандарт avatar).
					'object-cover object-center',
					SIZE_CLASS[size],
					className,
				)}
			/>
		)
	}

	const hue = hueFromEmail(email)
	return (
		<div
			className={cn(
				'rounded-full flex items-center justify-center font-semibold text-white select-none',
				'aspect-square shrink-0',
				SIZE_CLASS[size],
				className,
			)}
			style={{backgroundColor: `hsl(${hue} 60% 50%)`}}
			aria-label={displayName ?? email}
		>
			{initials(email, displayName)}
		</div>
	)
}
