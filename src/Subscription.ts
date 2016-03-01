import {Worker} from './Observable';
export interface Subscriber {
	unsubscribe: Function;
}

export class Subscription implements Subscriber {
	public isUnsubscribed:boolean;
	private destructor: (() => any) | void;

	constructor(work:Worker, onNext:(data?:any) => any, onError = (err?:any) => {}, onComplete = () => {}) {
		this.isUnsubscribed = false;

		let completed = false;
		let unsubscribedBeforeCompleted = false;
		this.destructor = work((data?:any) => {
			if (!this.isUnsubscribed && !unsubscribedBeforeCompleted)
				onNext(data);
		}, (err?:any) => {
			if (!this.isUnsubscribed && !unsubscribedBeforeCompleted) {
				if (!completed)
					unsubscribedBeforeCompleted = true;
				else
					this.unsubscribe();
			}
			onError(err);
		}, () => {
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
