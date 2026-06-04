// DTO — плоский контракт use case → внешний мир.
// Это позволяет переиспользовать use case под другим транспортом (CLI, gRPC) без правок.
export interface LivenessDto {
	status: 'ok'
	uptimeSeconds: number
	timestamp: string
}

// Use Case = Application Service в DDD: оркестрирует под одну пользовательскую задачу.
// Liveness в k8s-семантике = "процесс жив". Отличается от Readiness ("готов принимать трафик"):
// liveness не зависит от БД — иначе временный сбой БД вызовет каскадный рестарт всех инстансов.
//
// На MVP домена нет — use case тривиален (process.uptime + new Date). Это OK:
// слой application существует как место для будущей логики, а не ради текущей.
export class GetLivenessUseCase {
	execute(): LivenessDto {
		return {
			status: 'ok',
			// process.uptime() — float секунды от старта процесса. Math.floor — целое.
			uptimeSeconds: Math.floor(process.uptime()),
			timestamp: new Date().toISOString(),
		}
	}
}
