import {useCallback, useEffect, useState} from 'react'
import {WorkspaceCard} from '../../../entities/workspace'
import {AvailabilityFilter, useWorkspaces} from '../../../features/list-workspaces'
import {BookButton} from '../../../features/book-workspace'
import {Button, Modal, WarningIcon} from '../../../shared/ui'


function formatLocal(iso: string): string {
	return new Intl.DateTimeFormat('ru-RU', {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(iso))
}

const EXIT_ANIMATION_MS = 250

export function WorkspacesPage() {
	const {workspaces, loading, error, filter, loadAll, loadAvailable} = useWorkspaces()
	// id-ы карточек, которые сейчас проигрывают exit-анимацию. Класс `animate-card-out`
	// проигрывает fade + slide-right + collapse max-height. После окончания мы вызываем
	// loadAvailable, который обновит список — карточка пропадёт из реального state.
	const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

	// Модалка "ничего не найдено" — открывается, когда фильтр применён, ответ успешный
	// и список пуст. Не открывается при ошибке (для неё — error-баннер).
	// CS-принцип: Separation of Concerns — UI разделяет 3 разных состояния
	// (loading / error / empty-after-filter), а не смешивает их в одну плашку.
	const [showEmpty, setShowEmpty] = useState(false)
	useEffect(() => {
		// Защита от срабатывания в момент загрузки (пока true) и при ошибке.
		// Откроется только когда: фильтр применён, ответ пришёл успешно, и пусто.
		if (filter && !loading && !error && workspaces.length === 0) {
			setShowEmpty(true)
		}
	}, [filter, loading, error, workspaces.length])

	const handleBooked = useCallback((workspaceId: string) => {
		setExitingIds((prev) => {
			const next = new Set(prev)
			next.add(workspaceId)
			return next
		})
		window.setTimeout(() => {
			if (filter) void loadAvailable(filter.startsAt, filter.endsAt)
			else void loadAll()
			setExitingIds(new Set())
		}, EXIT_ANIMATION_MS)
	}, [filter, loadAvailable, loadAll])

	return (
		<main className="max-w-3xl mx-auto p-8 space-y-6">
			<header>
				<h1 className="text-2xl font-bold">Места и переговорки</h1>
				<p className="text-sm text-gray-600 mt-1">
					Выберите интервал — увидите только свободные места. Без интервала — весь каталог.
				</p>
			</header>

			<AvailabilityFilter
				onApply={loadAvailable}
				onReset={loadAll}
				loading={loading}
				filterActive={Boolean(filter)}
			/>

			{/* loading и error имеют приоритет над banner'ами с количеством. */}
			{loading && (
				<div className="p-3 rounded-lg bg-gray-100 text-sm text-gray-600">Загрузка…</div>
			)}
			{!loading && error && (
				<div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
					<div className="font-medium">Не удалось загрузить</div>
					<div className="text-sm mt-1">{error}</div>
					<div className="mt-3">
						<Button
							variant="secondary"
							onClick={() => filter ? loadAvailable(filter.startsAt, filter.endsAt) : loadAll()}
						>
							Повторить
						</Button>
					</div>
				</div>
			)}
			{!loading && !error && filter && (
				<div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
					Свободно с <b>{formatLocal(filter.startsAt)}</b> до <b>{formatLocal(filter.endsAt)}</b>:{' '}
					{workspaces.length} {workspaces.length === 1 ? 'место' : 'мест(а)'}
				</div>
			)}
			{!loading && !error && !filter && (
				<div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
					Весь каталог: {workspaces.length} мест(а). Выберите интервал, чтобы оставить только свободные.
				</div>
			)}

			{/* key={filter ? 'filtered' : 'all'} — форсит remount всех карточек ТОЛЬКО
			    при смене ON/OFF фильтра. На refetch без смены filter (после успешной
			    брони) ключ тот же — карточки переиспользуются, лишних анимаций нет.
			    CS-принцип: минимальная инвалидация state — React reconciliation точно
			    знает, когда mount-with-animation, а когда in-place update. */}
			<section key={filter ? 'filtered' : 'all'} className="space-y-3">
				{workspaces.map((w) => (
					<WorkspaceCard
						key={w.id}
						workspace={w}
						highlight={Boolean(filter)}
						className={
							exitingIds.has(w.id)
								? 'animate-card-out pointer-events-none'
								: 'animate-card-in'
						}
						actions={
							<BookButton
								workspaceId={w.id}
								startsAt={filter?.startsAt ?? null}
								endsAt={filter?.endsAt ?? null}
								onBooked={() => handleBooked(w.id)}
							/>
						}
					/>
				))}
			</section>

			<Modal
				open={showEmpty}
				onClose={() => setShowEmpty(false)}
				title="Свободных мест нет"
				icon={<WarningIcon className="w-6 h-6 text-amber-500" />}
			>
				<p className="text-sm text-gray-700">
					На интервал{' '}
					{filter && (
						<>
							<b>{formatLocal(filter.startsAt)}</b> — <b>{formatLocal(filter.endsAt)}</b>
						</>
					)}{' '}
					все места и переговорки заняты. Попробуйте другой интервал или сбросьте фильтр.
				</p>
				<div className="pt-3 flex justify-end gap-2">
					<Button
						variant="secondary"
						onClick={() => {
							setShowEmpty(false)
							void loadAll()
						}}
					>
						Сбросить фильтр
					</Button>
					<Button onClick={() => setShowEmpty(false)}>Понятно</Button>
				</div>
			</Modal>
		</main>
	)
}
