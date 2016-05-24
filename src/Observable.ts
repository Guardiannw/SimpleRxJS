import {Subscription} from "./Subscription";

export type Worker = (next: (data?: any) => any|void, error?: (err?: any) => any|void, complete?: () => any|void) => (() => any)|void;

interface Subscribable {
	subscribe: (onNext: (data?: any) => any|void, onError?: (err?: any) => any|void, onComplete?: () => any|void) => Subscription;
}

export class Observable implements Subscribable {
	
	static create(work: Worker): Observable {
		return new Observable(work);
	}
	
	static interval(interval: number): Observable {
		return Observable.create((next, error, complete) => {
			let iterator = 0;
			let intervalId = setInterval(() => {
				next(++iterator);
			}, interval);
			
			return () => {
				clearInterval(intervalId);
				if (complete)
					complete();
			}
		});
	}
	
	constructor(private work: Worker) {
	}
	
	public subscribe(onNext?: (data?: any) => any, onError?: (err?: any) => any, onComplete?: () => any): any {
		return new Subscription(this.work, onNext, onError, onComplete);
	}
	
	public map(projection: Function) {
		return Observable.create((next: (data?: any) => any, error: (err?: any) => any, complete: () => any) => {
			let subscription = this.subscribe((data?: any) => next(projection(data)), error, complete);
			return () => {
				subscription.unsubscribe();
			}
		});
	}
	
	public retry(maxRetries: number = -1) {
		return Observable.create((next, error, complete) => {
			let subscription: Subscription;
			let reSubscribe = (err?: Error) => {
				if (subscription)
					subscription.unsubscribe();
				if (maxRetries === 0)
					error(err);
				else {
					if (maxRetries > 0)
						maxRetries--;
					subscription = this.subscribe(next, reSubscribe, complete);
				}
			};
			
			subscription = this.subscribe(next, reSubscribe, complete);
			
			return () => {
				subscription.unsubscribe();
			}
		});
	}
	
	public flatMap(projection: Function) {
		return Observable.create((next, error, complete) => {
			let innerSubscriptions: Array<Subscription> = [];
			let subscription = this.subscribe((data) => {
				let innerSubscription = projection(data).subscribe(next, error, () => {
					innerSubscription.unsubscribe();
					innerSubscriptions.splice(innerSubscriptions.indexOf(innerSubscription), 1);
					if (innerSubscriptions.filter((innerSub) => !innerSub.isCompleted).length === 0)
						complete();
				});
				innerSubscriptions.push(innerSubscription);
			}, error, () => {
				if (innerSubscriptions.filter((innerSub) => !innerSub.isCompleted).length === 0)
					complete();
			});
			
			return () => {
				subscription.unsubscribe();
				innerSubscriptions.filter((subscription) => !subscription.isUnsubscribed)
				.forEach((subscription) => subscription.unsubscribe());
			}
		});
	}
	
	public exhaustMap(projection: Function) {
		return Observable.create((next, error, complete) => {
			let innerSubscription: Subscription;
			let subscription = this.subscribe((data) => {
				if (!innerSubscription || innerSubscription.isUnsubscribed) {
					innerSubscription = projection(data).subscribe(next, error, () => {
						if (subscription && subscription.isCompleted)
							complete();
						else
							innerSubscription.unsubscribe();
					});
				}
			}, error, () => {
				if (innerSubscription.isCompleted)
					complete();
			});
			
			return () => {
				subscription.unsubscribe();
				if (innerSubscription && !innerSubscription.isUnsubscribed)
					innerSubscription.unsubscribe();
			}
		});
	}
	
	public switchMap(projection: Function) {
		return Observable.create((next, error, complete) => {
			let innerSubscription: Subscription;
			let subscription = this.subscribe((data) => {
				if (innerSubscription && !innerSubscription.isUnsubscribed)
					innerSubscription.unsubscribe();
				innerSubscription = projection(data).subscribe(next, error, () => {
					if (subscription && subscription.isCompleted)
						complete();
					else
						innerSubscription.unsubscribe();
				});
			}, error, () => {
				if (innerSubscription.isCompleted)
					complete();
			});
			
			return () => {
				subscription.unsubscribe();
				if (innerSubscription && !innerSubscription.isUnsubscribed)
					innerSubscription.unsubscribe();
			}
		});
		
	}
	
	public distinctUntilChanged() {
		return Observable.create((next, error, complete) => {
			let register: any;
			let subscription = this.subscribe((data) => {
				if (data !== register)
					next(register = data);
			}, error, complete);
			
			return () => {
				subscription.unsubscribe();
			}
		});
	}
	
	public startWith(value: any) {
		return Observable.create((next, error, complete) => {
			// Emit the first value
			next(value);
			
			let subscription = this.subscribe(next, error, complete);
			
			return () => {
				subscription.unsubscribe();
			}
		});
	}
	
	public delay(timeout: number) {
		return Observable.create((next, error, complete) => {
			let subscription: Subscription;
			let timeoutId = setTimeout(() => {
				subscription = this.subscribe(next, error, complete);
			}, timeout);
			
			return () => {
				clearTimeout(timeoutId);
				if (subscription)
					subscription.unsubscribe();
			}
		});
	}
	
	//TODO: Figure out how to implement this
	//public retryWhen(projection:Function) {
	//	return Observable.create((next, error, complete) => {
	//		let subscription:Subscription;
	//		let reSubscribe = () => {
	//			if (subscription)
	//				subscription.unsubscribe();
	//			subscription = projection(this).subscribe(next, reSubscribe, complete);
	//		};
	//
	//		subscription = this.subscribe(next, reSubscribe, complete);
	//
	//		return () => {
	//			subscription.unsubscribe();
	//		}
	//	});
	//}
}
