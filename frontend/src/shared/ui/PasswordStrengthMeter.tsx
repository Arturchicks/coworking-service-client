import {cn} from '../lib'
import type {StrengthResult} from '../lib'


interface PasswordStrengthMeterProps {
	result: StrengthResult
	// Если пароль ещё не введён — не показывать meter (избегаем визуального шума).
	hideWhenEmpty?: boolean
}

// Цвета и ширины сегментов по score'у.
const SEGMENTS = 4

const COLOR_BY_SCORE: Record<0 | 1 | 2 | 3 | 4, string> = {
	0: 'bg-red-500',
	1: 'bg-red-500',
	2: 'bg-amber-500',
	3: 'bg-lime-500',
	4: 'bg-emerald-500',
}

const LABEL_COLOR_BY_SCORE: Record<0 | 1 | 2 | 3 | 4, string> = {
	0: 'text-red-600',
	1: 'text-red-600',
	2: 'text-amber-600',
	3: 'text-lime-700',
	4: 'text-emerald-700',
}

export function PasswordStrengthMeter({result, hideWhenEmpty = true}: PasswordStrengthMeterProps) {
	if (hideWhenEmpty && result.label === '') return null

	return (
		<div className="space-y-2 mt-2">
			{/* Прогресс из 4 сегментов: каждый отдельным div'ом, заполненные — цветные.
			    Visual feedback "колба заполняется" быстрее цепляет глаз, чем число/процент. */}
			<div className="flex gap-1" aria-label="Уровень пароля">
				{Array.from({length: SEGMENTS}).map((_, i) => (
					<div
						key={i}
						className={cn(
							'h-1.5 flex-1 rounded-full transition-colors',
							i < result.score ? COLOR_BY_SCORE[result.score] : 'bg-gray-200',
						)}
					/>
				))}
			</div>

			{result.label && (
				<div className={cn('text-xs font-medium', LABEL_COLOR_BY_SCORE[result.score])}>
					Уровень: {result.label}
				</div>
			)}

			{/* Чек-лист критериев — учит юзера, что именно делает пароль сильнее.
			    Принцип "Recognition over recall" (Nielsen heuristic #6) — не нужно помнить правила. */}
			<ul className="text-xs space-y-0.5">
				{result.criteria.map((c, i) => (
					<li key={i} className={c.met ? 'text-green-700' : 'text-gray-500'}>
						<span aria-hidden="true">{c.met ? '✓' : '○'}</span> {c.text}
					</li>
				))}
			</ul>
		</div>
	)
}
