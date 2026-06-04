import {useState, type FormEvent} from 'react'
import {Button} from '../../../shared/ui'


interface AvailabilityFilterProps {
	onApply: (startsAt: string, endsAt: string) => void
	onReset: () => void
	loading?: boolean
	// true — сейчас показаны только свободные (фильтр активен). Источник истины — `filter`
	// на странице; компонент не держит свою копию режима (Single Source of Truth).
	filterActive?: boolean
}

function defaultStart() {
	const d = new Date()
	d.setMinutes(0, 0, 0)
	d.setHours(d.getHours() + 1)
	return toLocalInput(d)
}

function defaultEnd() {
	const d = new Date()
	d.setMinutes(0, 0, 0)
	d.setHours(d.getHours() + 2)
	return toLocalInput(d)
}

function toLocalInput(d: Date): string {
	// <input type="datetime-local"> ожидает 'YYYY-MM-DDTHH:mm' БЕЗ TZ.
	// new Date().toISOString() даёт UTC — на UI лучше показывать локально.
	const pad = (n: number) => n.toString().padStart(2, '0')
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AvailabilityFilter({onApply, onReset, loading, filterActive}: AvailabilityFilterProps) {
	const [startsAt, setStartsAt] = useState(defaultStart())
	const [endsAt, setEndsAt] = useState(defaultEnd())

	const onSubmit = (e: FormEvent) => {
		e.preventDefault()
		// Парсим local-input как локальную дату, конвертим в ISO (с TZ).
		onApply(new Date(startsAt).toISOString(), new Date(endsAt).toISOString())
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-lg border">
			<label className="flex flex-col text-sm">
				<span className="text-gray-600 mb-1">Начало</span>
				<input
					type="datetime-local"
					value={startsAt}
					onChange={(e) => setStartsAt(e.target.value)}
					className="px-2 py-1 border rounded"
				/>
			</label>
			<label className="flex flex-col text-sm">
				<span className="text-gray-600 mb-1">Конец</span>
				<input
					type="datetime-local"
					value={endsAt}
					onChange={(e) => setEndsAt(e.target.value)}
					className="px-2 py-1 border rounded"
				/>
			</label>
			<Button type="submit" disabled={loading || filterActive}>
				{'Показать свободные'}
			</Button>
			<Button type="button" variant="secondary" onClick={onReset} disabled={loading || !filterActive}>
				Все места
			</Button>
		</form>
	)
}
