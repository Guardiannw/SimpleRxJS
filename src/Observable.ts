import {Subscription} from "./Subscription";

type Worker = (next: Function, error?: Function, complete?: Function) => Function;

interface Subscribable {
	subscribe: (onNext: (data?: any) => void, onError?: Function, onComplete?: Function) => Subscription;
}

export class Observable implements Subscribable{
	static create (work: Worker) : Observable {
		return new Observable(work);
	}

	static interval (interval: number) : Observable {
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

	constructor (private work: Worker) { }

	public subscribe (onNext: (data?: any) => void, onError?: Function, onComplete?: Function) : Subscription {
		return new Subscription(this.work(onNext, onError, onComplete));
	}

	public map (projection: Function) {
		return Observable.create((next, error, complete) => {
			let subscription = this.subscribe((data?: any) => projection(next(data)), error, complete);
			return () => {
				subscription.unsubscribe();
			}
		});
	}

	public retry (maxRetries: number = -1) {
		return Observable.create((next, error, complete) => {
			let subscription = null;
			let reSubscribe = (err?: Error) => {
				if (subscription)
					subscription.unsubscribe();
				if (maxRetries === 0)
					error(err);
				else {
					if (maxRetries > 0)
						maxRetries--;
					this.subscribe(next, reSubscribe, complete);
				}
			};

			reSubscribe();

			return () => {
				subscription.unsubscribe();
			}
		});
	}

	public flatMap (projection: Function) {
		return Observable.create((next, error, complete) => {
			let innerSubscriptions: Array<Subscription> = [];
			let subscription = this.subscribe((data?: any) => {
				let innerSubscription = projection(data).subscribe(next, error, () => {
					innerSubscription.unsubscribe();
					innerSubscriptions.splice(innerSubscriptions.indexOf(innerSubscription), 1);
				});
				innerSubscriptions.push(innerSubscription);
			}, error, complete);

			return () => {
				subscription.unsubscribe();
				innerSubscriptions.filter((subscription) => !subscription.isUnsubscribed)
					.forEach((subscription) => subscription.unsubscribe());
			}
		});
	}

	public exhaustMap (projection: Function) {
		return Observable.create((next, error, complete) => {
			let innerSubscription;
			let subscription = this.subscribe((data?: any) => {
				if (!innerSubscription || innerSubscription.isUnsubscribed)
					innerSubscription = projection(data).subscribe(next, error, () => {
						innerSubscription.unsubscribe();
					});
			}, error, complete);

			return () => {
				subscription.unsubscribe();
				if (innerSubscription && !innerSubscription.isUnsubscribed)
					innerSubscription.unsubscribe();
			}
		});
	}

	public switchMap (projection: Function) {
		return Observable.create((next, error, complete) => {
			let innerSubscription;
			let subscription = this.subscribe((data?: any) => {
				if (innerSubscription && !innerSubscription.isUnsubscribed)
					innerSubscription.unsubscribe();
				innerSubscription = projection(data).subscribe(next, error, () => {
					innerSubscription.unsubscribe();
				});
			}, error, complete);

			return () => {
				subscription.unsubscribe();
				if (innerSubscription && !innerSubscription.isUnsubscribed)
					innerSubscription.unsubscribe();
			}
		});

	}
}
