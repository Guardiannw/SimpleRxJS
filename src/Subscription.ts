export interface Subscriber {
	unsubscribe: Function;
}

export class Subscription implements Subscriber{
	constructor (private destructor: Function) { }

	unsubscribe () {
		this.destructor();
	}
}