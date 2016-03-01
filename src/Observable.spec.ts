/// <reference path="../typings/main.d.ts" />
import {Observable} from './Observable';
describe('Observable', () => {
	describe('Interval', () => {
	});

	it('should unsubscribe when completed', () => {
		let subscription = Observable.create((next: (data?: any) => void, error: (err?: any) => void, complete: () => void) => {
			complete();
			return () => { };
		}).subscribe(() => {});
		expect(subscription.isUnsubscribed).toBeTruthy();
	});

	it('should unsubscribe when completed', () => {
		let subscription = Observable.create((next: (data?: any) => void, error: (err?: any) => void, complete: () => void) => {
			error();
			return () => { };
		}).subscribe(() => {}, () => {
			expect(this.isUnsubscribed).toBeFalsy();
		}, () => {});
		expect(subscription.isUnsubscribed).toBeTruthy();
	});

	it('should stop emitting values once an error has occurred', () => {
		let map = [];
		Observable.create((next, error, complete) => {
			next(1);
			next(2);
			error();
			next(3);
			next(4);
		}).subscribe(map.push.bind(map));

		expect(map.length).toEqual(2);
		expect(map[0]).toEqual(1);
		expect(map[1]).toEqual(2);
	});

	it('should stop emitting values once it has completed', () => {
		let map = [];
		Observable.create((next, error, complete) => {
			next(1);
			next(2);
			complete();
			next(3);
			next(4);
		}).subscribe(map.push.bind(map));

		expect(map.length).toEqual(2);
		expect(map[0]).toEqual(1);
		expect(map[1]).toEqual(2);
	});

	describe('operator map', () => {
		it('should map appropriately', () => {
			let map = [];
			Observable.create((next, error, complete) => {
				next(1);
				next(2);
				next(3);
				complete();
			}).map(x => x * 2)
				.subscribe(map.push.bind(map));

			expect(map[0]).toEqual(2);
			expect(map[1]).toEqual(4);
			expect(map[2]).toEqual(6);
		});
	});

	describe('operator distinctUntilChanged', () => {
		it('should only call next when the data has changed', () => {
			let map = [];
			Observable.create((next, error, complete) => {
				next(1);
				next(1);
				next(2);
				next(3);
				next(2);
				next(4);
			}).distinctUntilChanged()
			.subscribe(map.push.bind(map));

			expect(map[0]).toEqual(1);
			expect(map[1]).toEqual(2);
			expect(map[2]).toEqual(3);
			expect(map[3]).toEqual(2);
			expect(map[4]).toEqual(4);
		});
	});

	describe('operator retry', () => {
		it('should retry a set amount of times if the subscription calls error', () => {
			let iterator = 1;
			let map = [];

			Observable.create((next, error, complete) => {
				next(iterator++);
				error();
			}).retry(5)
			.subscribe(map.push.bind(map));

			expect(map.length).toEqual(6);
			expect(map[0]).toEqual(1);
			expect(map[1]).toEqual(2);
			expect(map[2]).toEqual(3);
			expect(map[3]).toEqual(4);
			expect(map[4]).toEqual(5);
			expect(map[5]).toEqual(6);
		});
	});

	describe('operator flatmap', () => {
		it('should join multiple the output of multiple observables from a single observable', () => {
			function createMappingObservable(number) {
				return Observable.create((next) => { next(number * 2); });
			}

			let map = [];
			Observable.create((next, error, complete) => {
				next(1);
				next(2);
				next(3);
			}).flatMap(createMappingObservable)
			.subscribe(map.push.bind(map));

			expect(map[0]).toEqual(2);
			expect(map[1]).toEqual(4);
			expect(map[2]).toEqual(6);
		});
	});
});
