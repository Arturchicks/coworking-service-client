import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {AuthGate, AuthProvider} from './features/auth'
import {PageTransition} from './shared/ui'
import {Header} from './widgets/header'
import {WorkspacesPage} from './pages/workspaces'
import {MyBookingsPage} from './pages/my-bookings'
import {PlansPage} from './pages/plans'
import {MySubscriptionsPage} from './pages/my-subscriptions'
import {ProfilePage} from './pages/profile'


export function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<AuthGate>
					{/* pt-20 ≈ 80px — компенсация под высоту fixed-header'а (py-4 + line-height).
					    Без этого контент уезжал бы под прозрачный header. Trade-off:
					    магическое число. Альтернатива — измерять header useResizeObserver'ом,
					    но это over-engineering: header статичной высоты. */}
					<div className="bg-gray-50 min-h-screen pt-20">
						<Header />
						<PageTransition>
							<Routes>
								<Route path="/" element={<WorkspacesPage />} />
								<Route path="/my" element={<MyBookingsPage />} />
								<Route path="/plans" element={<PlansPage />} />
								<Route path="/subscriptions" element={<MySubscriptionsPage />} />
								<Route path="/profile" element={<ProfilePage />} />
								<Route path="*" element={<Navigate to="/" replace />} />
							</Routes>
						</PageTransition>
					</div>
				</AuthGate>
			</BrowserRouter>
		</AuthProvider>
	)
}
