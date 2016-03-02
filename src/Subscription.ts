import {Worker} from './Observable';
export interface Subscriber {
	unsubscribe: Function;
}

export class Subscription implements Subscriber {
	public isUnsubscribed: boolean;
	public isCompleted: boolean;
	private destructor: (() => any) | void;

	constructor(work:Worker, onNext:(data?: any) => any|void, onError: (err?: any) => any|void = (err) => {}, onComplete: () => any|void = () => {}) {
		this.isUnsubscribed = false;
		this.isCompleted = false;

		let completed = false;
		let unsubscribedBeforeCompleted = false;
		this.destructor = work((data) => {
			if (!this.isUnsubscribed && !unsubscribedBeforeCompleted)
				onNext(data);
		}, (err) => {
			if (!this.isUnsubscribed && !unsubscribedBeforeCompleted) {
				if (!completed)
					unsubscribedBeforeCompleted = true;
				else
					this.unsubscribe();
			}
			onError(err);
		}, () => {
			this.isCompleted = true;

			if (!this.isUnsubscribed && !unsubscribedBeforeCompleted) {
				if (!completed)
					unsubscribedBeforeCompleted = true;
				else
					this.unsubscribe();
			}
			onComplete();
		});
		completed = true;
		if (unsubscribedBeforeCompleted)
			this.unsubscribe();
	}

	unsubscribe() {
		if (!this.isUnsubscribed) {
			if (this.destructor)
				(<() => any>this.destructor)();
			this.isUnsubscribed = true;
		}
	}
}
