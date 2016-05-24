/// <reference path="../typings/main.d.ts" />
import {Observable} from './Observable';
describe('Observable', () => {
	beforeEach(() => {
		jasmine.clock().install();
	});
	
	afterEach(() => {
		jasmine.clock().uninstall();
	});
	
	describe('Interval', () => {
		// TODO: Implement This
	});
	
	it('should unsubscribe when completed', () => {
		let subscription = Observable.create((next, error, complete) => {
			complete();
		}).subscribe();
		
		jasmine.clock().tick(1);
		
		expect(subscription.isUnsubscribed).toBeTruthy();
	});
	
	it('should unsubscribe when errored', () => {
		let subscription = Observable.create((next, error) => {
			error();
		}).subscribe();
		
		expect(subscription.isUnsubscribed).toBeFalsy();
		
		jasmine.clock().tick(1);
		
		expect(subscription.isUnsubscribed).toBeTruthy();
	});
	
	it('should stop emitting values once an error has occurred', () => {
		let map: Array<number> = [];
		Observable.create((next, error) => {
			next(1);
			next(2);
			error();
			next(3);
			next(4);
		}).subscribe(map.push.bind(map));
		
		jasmine.clock().tick(1);
		
		expect(map.length).toEqual(2);
		expect(map[0]).toEqual(1);
		expect(map[1]).toEqual(2);
	});
	
	it('should stop emitting values once it has completed', () => {
		let map: Array<number> = [];
		Observable.create((next, error, complete) => {
			next(1);
			next(2);
			complete();
			next(3);
			next(4);
		}).subscribe(map.push.bind(map));
		
		jasmine.clock().tick(1);
		
		expect(map.length).toEqual(2);
		expect(map[0]).toEqual(1);
		expect(map[1]).toEqual(2);
	});
	
	describe('Operators', () => {
		describe('map', () => {
			it('should map appropriately', () => {
				let map: Array<number> = [];
				Observable.create((next, error, complete) => {
					next(1);
					next(2);
					next(3);
					complete();
				}).map((x: number) => x * 2)
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(1);
				
				expect(map[0]).toEqual(2);
				expect(map[1]).toEqual(4);
				expect(map[2]).toEqual(6);
			});
		});
		
		describe('distinctUntilChanged', () => {
			it('should only call next when the data has changed', () => {
				let map: Array<number> = [];
				Observable.create((next, error, complete) => {
					next(1);
					next(1);
					next(2);
					next(3);
					next(2);
					next(4);
					complete();
				}).distinctUntilChanged()
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(1);
				
				expect(map[0]).toEqual(1);
				expect(map[1]).toEqual(2);
				expect(map[2]).toEqual(3);
				expect(map[3]).toEqual(2);
				expect(map[4]).toEqual(4);
			});
		});
		
		describe('retry', () => {
			it('should retry a set amount of times if the subscription calls error', () => {
				let iterator = 1;
				let map: Array<number> = [];
				
				Observable.create((next, error) => {
					next(iterator++);
					error();
				}).retry(5)
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(1);
				
				expect(map.length).toEqual(6);
				expect(map[0]).toEqual(1);
				expect(map[1]).toEqual(2);
				expect(map[2]).toEqual(3);
				expect(map[3]).toEqual(4);
				expect(map[4]).toEqual(5);
				expect(map[5]).toEqual(6);
			});
		});
		
		describe('flatmap', () => {
			it('should join multiple the output of multiple observables from a single observable', () => {
				function createMappingObservable(number: number) {
					return Observable.create((next) => {
						next(number * 2);
					});
				}
				
				let map: Array<number> = [];
				Observable.create((next, error, complete) => {
					next(1);
					next(2);
					next(3);
					complete();
				}).flatMap(createMappingObservable)
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(1);
				
				expect(map[0]).toEqual(2);
				expect(map[1]).toEqual(4);
				expect(map[2]).toEqual(6);
			});
			
			it('should continue to emit from mapped observable even after parent has completed', () => {
				let map: Array<number> = [];
				
				function createDelayObservable(number: number) {
					return Observable.create((next, error, complete) => {
						let id = setTimeout(() => {
							next(number * 2);
							complete();
						}, 100);
						return () => {
							clearTimeout(id);
						}
					});
				}
				
				Observable.create((next, error, complete) => {
					next(1);
					next(2);
					next(3);
					complete();
				}).flatMap((x: number) => createDelayObservable(x))
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(100);
				
				expect(map.length).toEqual(3);
				expect(map[0]).toEqual(2);
				expect(map[1]).toEqual(4);
				expect(map[2]).toEqual(6);
			});
		});
		
		describe('switchMap', () => {
			it('should switch to a new observable mapping and unsubscribe from the existing mapping', () => {
				let map: Array<number> = [];
				
				function createDelayObservable(number: number) {
					return Observable.create((next, error, complete) => {
						let id = setTimeout(() => {
							next(number * 2);
							complete();
						}, 100);
						return () => {
							clearTimeout(id);
						}
					});
				}
				
				Observable.create((next, error, complete) => {
					next(1);
					next(2);
					next(3);
					complete();
				}).switchMap((x: number) => createDelayObservable(x))
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(100);
				
				expect(map.length).toEqual(1);
				expect(map[0]).toEqual(6);
			});
		});
		
		describe('exhaustMap', () => {
			it('should ignore all new observable mappings until after the current mapping is complete', () => {
				let map: Array<number> = [];
				
				function createDelayObservable(number: number) {
					return Observable.create((next, error, complete) => {
						let id = setTimeout(() => {
							next(number * 2);
							complete();
						}, 100);
						return () => {
							clearTimeout(id);
						}
					});
				}
				
				Observable.create((next, error, complete) => {
					next(1);
					next(2);
					next(3);
					complete();
				}).exhaustMap((x: number) => createDelayObservable(x))
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(100);
				
				expect(map.length).toEqual(1);
				expect(map[0]).toEqual(2);
			});
		});
		
		describe('startWith', () => {
			it('should emit the value provided before any others', () => {
				let map: Array<number> = [];
				Observable.create((next) => {
					next(2);
					next(3);
				}).startWith(1)
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(1);
				
				expect(map.length).toEqual(3);
				expect(map[0]).toEqual(1);
				expect(map[1]).toEqual(2);
				expect(map[2]).toEqual(3);
			});
		});
		
		describe('delay', () => {
			it('should begin emitting items after a certain time delay', () => {
				let map: Array<number> = [];
				
				Observable.create((next, error, complete) => {
					next(1);
					next(2);
					next(3);
					complete();
				}).delay(200)
				.subscribe(map.push.bind(map));
				
				jasmine.clock().tick(1);
				
				expect(map.length).toEqual(0);
				
				jasmine.clock().tick(200);
				
				expect(map.length).toEqual(3);
				expect(map[0]).toEqual(1);
				expect(map[1]).toEqual(2);
				expect(map[2]).toEqual(3);
			});
		});
		
	});
});

