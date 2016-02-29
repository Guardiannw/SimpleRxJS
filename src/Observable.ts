import {Subscription} from "./Subscription";

type Worker = (next: Function, error: Function, complete: Function) => Function;

interface Subscribable {
	subscribe: Function;
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
				complete();
			}
		});
	}

	constructor (private work: Worker) { }

	subscribe (onNext: (data?: any) => void, onError?: Function, onComplete?: Function) : Subscription {
		return new Subscription(this.work(onNext, onError, onComplete));
	}
}
