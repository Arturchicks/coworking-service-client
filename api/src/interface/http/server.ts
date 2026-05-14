import cookieParser from 'cookie-parser'
import express, {Express} from 'express'
import {ChangePasswordUseCase} from '../../application/auth/ChangePasswordUseCase'
import {LoginUseCase} from '../../application/auth/LoginUseCase'
import {MeUseCase} from '../../application/auth/MeUseCase'
import {RegisterUseCase} from '../../application/auth/RegisterUseCase'
import {UpdateProfileUseCase} from '../../application/auth/UpdateProfileUseCase'
import {CancelBookingUseCase} from '../../application/bookings/CancelBookingUseCase'
import {CreateBookingUseCase} from '../../application/bookings/CreateBookingUseCase'
import {ListMyBookingsUseCase} from '../../application/bookings/ListMyBookingsUseCase'
import {GetLivenessUseCase} from '../../application/healthcheck/GetLivenessUseCase'
import {ListPlansUseCase} from '../../application/plans/ListPlansUseCase'
import {ListMySubscriptionsUseCase} from '../../application/subscriptions/ListMySubscriptionsUseCase'
import {PurchasePlanUseCase} from '../../application/subscriptions/PurchasePlanUseCase'
import {CheckAvailabilityUseCase} from '../../application/workspaces/CheckAvailabilityUseCase'
import {ListWorkspacesUseCase} from '../../application/workspaces/ListWorkspacesUseCase'
import {BcryptPasswordHasher} from '../../infrastructure/auth/BcryptPasswordHasher'
import {JoseJwtTokenIssuer} from '../../infrastructure/auth/JoseJwtTokenIssuer'
import env from '../../infrastructure/config/env'
import {pool} from '../../infrastructure/db/pool'
import {MockPaymentProvider} from '../../infrastructure/payments/MockPaymentProvider'
import {PgBookingRepository} from '../../infrastructure/persistence/PgBookingRepository'
import {PgPaymentRepository} from '../../infrastructure/persistence/PgPaymentRepository'
import {PgPlanRepository} from '../../infrastructure/persistence/PgPlanRepository'
import {PgSubscriptionRepository} from '../../infrastructure/persistence/PgSubscriptionRepository'
import {PgUserRepository} from '../../infrastructure/persistence/PgUserRepository'
import {PgWorkspaceRepository} from '../../infrastructure/persistence/PgWorkspaceRepository'
import {createAuthMiddleware, createOptionalAuthMiddleware} from '../middleware/authMiddleware'
import {errorHandler} from '../middleware/errorHandler'
import {createAuthRouter} from './routes/authRouter'
import {createBookingsRouter} from './routes/bookingsRouter'
import {createHealthRouter} from './routes/healthRouter'
import {createPlansRouter} from './routes/plansRouter'
import {createSubscriptionsRouter} from './routes/subscriptionsRouter'
import {createWorkspacesRouter} from './routes/workspacesRouter'


export function createServer(): Express {
	const app = express()

	app.use(cookieParser())
	app.use(express.json())

	// ── Infrastructure adapters ────────────────────────────────────────────
	const passwordHasher = new BcryptPasswordHasher()
	const tokenIssuer = new JoseJwtTokenIssuer(env.jwtSecret, env.jwtTtlSeconds)
	const paymentProvider = new MockPaymentProvider(/* failureMode */ false)

	const userRepo = new PgUserRepository(pool)
	const workspaceRepo = new PgWorkspaceRepository(pool)
	const bookingRepo = new PgBookingRepository(pool)
	const planRepo = new PgPlanRepository(pool)
	const subRepo = new PgSubscriptionRepository(pool)
	const paymentRepo = new PgPaymentRepository(pool)

	// ── Application: use cases ────────────────────────────────────────────
	const registerUC = new RegisterUseCase(userRepo, passwordHasher, tokenIssuer)
	const loginUC = new LoginUseCase(userRepo, passwordHasher, tokenIssuer)
	const meUC = new MeUseCase(userRepo)
	const updateProfileUC = new UpdateProfileUseCase(userRepo)
	const changePasswordUC = new ChangePasswordUseCase(userRepo, passwordHasher)

	const listWorkspaces = new ListWorkspacesUseCase(workspaceRepo)
	const checkAvailability = new CheckAvailabilityUseCase(workspaceRepo)
	const createBooking = new CreateBookingUseCase(bookingRepo, workspaceRepo, subRepo)
	const listMyBookings = new ListMyBookingsUseCase(bookingRepo)
	const cancelBooking = new CancelBookingUseCase(bookingRepo)
	const getLiveness = new GetLivenessUseCase()

	const listPlans = new ListPlansUseCase(planRepo)
	const purchasePlan = new PurchasePlanUseCase(planRepo, subRepo, paymentRepo, paymentProvider)
	const listMySubs = new ListMySubscriptionsUseCase(subRepo)

	// ── Middlewares ───────────────────────────────────────────────────────
	const optionalAuth = createOptionalAuthMiddleware(tokenIssuer)
	const requireAuth = createAuthMiddleware(tokenIssuer)

	// ── Routers ───────────────────────────────────────────────────────────
	app.use('/auth', optionalAuth, createAuthRouter({
		register: registerUC,
		login: loginUC,
		me: meUC,
		updateProfile: updateProfileUC,
		changePassword: changePasswordUC,
		authRequired: requireAuth,
	}))
	app.use('/', createHealthRouter({getLiveness}))
	app.use('/workspaces', createWorkspacesRouter({listWorkspaces, checkAvailability}))
	app.use('/bookings', createBookingsRouter({
		createBooking, listMyBookings, cancelBooking, authRequired: requireAuth,
	}))
	app.use('/plans', createPlansRouter({listPlans, purchasePlan, authRequired: requireAuth}))
	app.use('/subscriptions', createSubscriptionsRouter({listMine: listMySubs, authRequired: requireAuth}))

	app.use(errorHandler)
	return app
}
