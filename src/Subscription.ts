export interface Subscriber {
	unsubscribe: Function;
}

export class Subscription implements Subscriber{
	public isUnsubscribed: boolean;

	constructor (private destructor: Function) {
		this.isUnsubscribed = false;
	}

	unsubscribe () {
		if (!this.isUnsubscribed) {
			this.destructor();
			this.isUnsubscribed = true;
		}
	}
}
