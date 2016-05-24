import {Worker} from './Observable';
export interface Subscriber {
	unsubscribe: Function;
}

export class Subscription implements Subscriber {
	public isUnsubscribed: boolean;
	public isCompleted: boolean;
	private destructorPromise: Promise;

	constructor(work:Worker, onNext:(data?: any) => any|void, onError: (err?: any) => any|void, onComplete: () => any|void) {
		this.isUnsubscribed = false;
		this.isCompleted = false;
		
		this.destructorPromise = new Promise((resolve) => {
			setTimeout(() => {
				resolve(work((data) => {
					if (!this.isUnsubscribed)
						if (onNext)
							onNext(data);
				}, (err) => {
					if (!this.isUnsubscribed) {
						this.unsubscribe();
						if (onError)
							onError(err);
					}
				}, () => {
					if (!this.isUnsubscribed) {
						this.unsubscribe();
						if (onComplete)
							onComplete();
					}
					this.isCompleted = true;
				}));
			}, 0);
		});
	}

	unsubscribe() {
		if (!this.isUnsubscribed) {
			this.destructorPromise
				.then((destructor) => {
					if (destructor)
						destructor();
				});
			this.isUnsubscribed = true;
		}
	}
}
