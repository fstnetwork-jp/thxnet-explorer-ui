/*
 * Polkascan Explorer UI
 * Copyright (C) 2018-2023 Polkascan Foundation (NL)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { types as pst } from '@polkadapt/core';
import { ActivatedRoute } from '@angular/router';
import { NetworkService } from '../../../../../../services/network.service';
import { RuntimeService } from '../../../../../../services/runtime/runtime.service';
import { catchError, filter, first, map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { PolkadaptService } from '../../../../../../services/polkadapt.service';

@Component({
  selector: 'app-runtime-event-detail',
  templateUrl: './runtime-event-detail.component.html',
  styleUrls: ['./runtime-event-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuntimeEventDetailComponent implements OnInit, OnDestroy {
  runtime: string;
  pallet: string;
  event: Observable<pst.RuntimeEvent | null>;
  eventAttributes: Observable<pst.RuntimeEventAttribute[]>;
  fetchEventStatus: BehaviorSubject<any> = new BehaviorSubject(null);
  fetchEventAttributesStatus: BehaviorSubject<any> = new BehaviorSubject(null);

  visibleColumns = ['icon', 'type', 'typeComposition'];

  private destroyer = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private ns: NetworkService,
    private rs: RuntimeService,
    private pa: PolkadaptService
  ) {
  }

  ngOnInit(): void {
    // Get the network.
    const runtimeObservable = this.ns.currentNetwork.pipe(
      takeUntil(this.destroyer),
      filter(network => !!network),
      first(),
      // Get the route parameters.
      switchMap(network => this.route.params.pipe(
        takeUntil(this.destroyer),
        map(params => {
          const lastIndex = params['runtime'].lastIndexOf('-');
          const specName = params['runtime'].substring(0, lastIndex);
          const specVersion = params['runtime'].substring(lastIndex + 1);
          return [specName, parseInt(specVersion, 10), params['pallet'], params['eventName']];
        }),
        tap(([specName, specVersion, pallet]) => {
          this.runtime = `${specName}-${specVersion}`;
          this.pallet = pallet;
        })
      )),
      switchMap(([specName, specVersion, pallet, eventName]) =>
        this.rs.getRuntime(specName, specVersion).pipe(
          takeUntil(this.destroyer),
          map(runtime => [runtime as pst.Runtime, pallet, eventName])
        )
      ),
      shareReplay(1)
    );

    this.event = runtimeObservable.pipe(
      tap(() => this.fetchEventStatus.next('loading')),
      switchMap(([runtime, pallet, eventName]) => {
        const subject = new BehaviorSubject<pst.RuntimeEvent | null>(null);
        if (runtime) {
          this.rs.getRuntimeEvents(runtime.specName, runtime.specVersion).pipe(
            takeUntil(this.destroyer)
          ).subscribe({
            next: (events) => {
              const matchedEvent: pst.RuntimeEvent = events.filter(e => e.pallet === pallet && e.eventName === eventName)[0];
              if (matchedEvent) {
                subject.next(matchedEvent);
                this.fetchEventStatus.next(null);
              }
            },
            error: (e) => {
              subject.error(e);
            }
          });
        }
        return subject.pipe(takeUntil(this.destroyer));
      }),
      catchError((e) => {
        this.fetchEventStatus.next('error');
        return of(null);
      })
    )

    this.eventAttributes = runtimeObservable.pipe(
      tap(() => this.fetchEventAttributesStatus.next('loading')),
      switchMap(([runtime, pallet, eventName]) => {
        const subject = new BehaviorSubject<(pst.RuntimeEventAttribute & { parsedComposition?: any })[]>([]);
        this.pa.run().getRuntimeEventAttributes(runtime.specName, runtime.specVersion, pallet, eventName).pipe(
          switchMap((obs) => obs.length ? combineLatest(obs) : of([])),
          takeUntil(this.destroyer)
        ).subscribe({
          next: (items) => {
            if (Array.isArray(items)) {
              const objects: (pst.RuntimeEventAttribute & { parsedComposition?: any })[] = [...items];
              for (let obj of objects) {
                if (obj.scaleTypeComposition) {
                  obj.parsedComposition = JSON.parse(obj.scaleTypeComposition);
                }
              }
              subject.next(objects);
              this.fetchEventAttributesStatus.next(null);
            }
          },
          error: (e) => {
            subject.error(e);
          }
        });
        return subject.pipe(takeUntil(this.destroyer));
      }),
      catchError((e) => {
        this.fetchEventAttributesStatus.next('error');
        return of([]);
      })
    )
  }

  ngOnDestroy(): void {
    this.destroyer.next();
    this.destroyer.complete();
  }

  trackEventAttribute(index: number, item: pst.RuntimeEventAttribute): string {
    return item.eventAttributeName;
  }
}
